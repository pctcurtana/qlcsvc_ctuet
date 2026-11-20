<?php

namespace App\Services;

use App\Contracts\Repositories\PermissionRepositoryInterface;
use App\Exceptions\ServiceException;
use App\Models\User;
use App\Models\Screen;
use Illuminate\Database\Eloquent\Collection;

class PermissionService
{
    /** Các cờ quyền trên mỗi màn hình (khớp cột bảng user_permissions) */
    private const CAC_QUYEN = [
        'can_view', 'can_create', 'can_edit', 'can_delete',
        'can_regenerate_qr', 'can_import', 'can_export',
    ];

    /**
     * @var PermissionRepositoryInterface
     */
    protected $permissionRepository;

    /**
     * PermissionService constructor.
     *
     * @param PermissionRepositoryInterface $permissionRepository
     */
    public function __construct(PermissionRepositoryInterface $permissionRepository)
    {
        $this->permissionRepository = $permissionRepository;
    }

    /**
     * Lấy danh sách users không phải admin
     *
     * @return Collection
     */
    public function getNonAdminUsers(User $actor): Collection
    {
        return User::where('role', '!=', 'admin')
            // Non-admin không được tự phân quyền nên không hiện chính mình
            ->when(!$actor->isAdmin(), function ($q) use ($actor) {
                $q->where('id', '!=', $actor->id);
            })
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role']);
    }

    /**
     * Lấy danh sách screens dạng tree
     *
     * @return Collection
     */
    public function getScreensTree(): Collection
    {
        return Screen::whereNull('parent_id')
            ->where('is_active', true)
            ->orderBy('order')
            ->with(['children' => function ($query) {
                $query->where('is_active', true)
                    ->orderBy('order')
                    ->with(['children' => function ($q) {
                        $q->where('is_active', true)->orderBy('order');
                    }]);
            }])
            ->get();
    }

    /**
     * Lấy danh sách screens dạng flat
     *
     * @return Collection
     */
    public function getScreensFlat(): Collection
    {
        return Screen::getFlatTree();
    }

    /**
     * Lấy quyền của một user theo dạng key-value
     *
     * @param User $user
     * @return array
     */
    public function getUserPermissions(User $user): array
    {
        $permissions = $this->permissionRepository->getByUserId($user->id);

        return $permissions->keyBy('screen_id')->map(function ($permission) {
            return [
                'can_view' => $permission->can_view,
                'can_create' => $permission->can_create,
                'can_edit' => $permission->can_edit,
                'can_delete' => $permission->can_delete,
                'can_regenerate_qr' => $permission->can_regenerate_qr,
                'can_import' => $permission->can_import,
                'can_export' => $permission->can_export,
            ];
        })->toArray();
    }

    /**
     * Cập nhật quyền của user
     *
     * @param User $user
     * @param array $permissions
     * @return void
     */
    public function updateUserPermissions(User $actor, User $user, array $permissions): void
    {
        if ($user->isAdmin()) {
            throw new ServiceException('Tài khoản admin luôn có toàn quyền, không cần phân quyền.');
        }
        if (!$actor->isAdmin()) {
            if ($actor->id === $user->id) {
                throw new ServiceException('Bạn không thể tự sửa phân quyền của chính mình.');
            }
            if (!$this->coTheQuanLy($actor, $user)) {
                throw new ServiceException('Bạn không thể sửa phân quyền của tài khoản có quyền cao hơn mình.');
            }
            if (!$this->coDuQuyen($actor, $permissions)) {
                throw new ServiceException('Bạn chỉ được cấp những quyền mà chính bạn đang có.');
            }
        }

        $this->permissionRepository->syncPermissions($user->id, $permissions);
    }

    /**
     * Non-admin chỉ quản lý được tài khoản không phải admin
     * và không có quyền nào vượt quá quyền của chính mình (chống chiếm tài khoản để leo quyền).
     */
    public function coTheQuanLy(User $actor, User $target): bool
    {
        if ($actor->isAdmin()) {
            return true;
        }
        if ($target->isAdmin()) {
            return false;
        }
        return $this->coDuQuyen($actor, $this->permissionRepository->getByUserId($target->id));
    }

    /**
     * $actor có đủ mọi quyền đang bật trong $rows không.
     * $rows: danh sách phần tử có screen_id và các cờ can_* (mảng hoặc UserPermission).
     */
    private function coDuQuyen(User $actor, iterable $rows): bool
    {
        if ($actor->isAdmin()) {
            return true;
        }

        $quyenCuaActor = $this->permissionRepository->getByUserId($actor->id)->keyBy('screen_id');

        foreach ($rows as $row) {
            $cua = $quyenCuaActor->get($row['screen_id']);
            foreach (self::CAC_QUYEN as $quyen) {
                if (!empty($row[$quyen]) && !($cua && $cua->{$quyen})) {
                    return false;
                }
            }
        }
        return true;
    }
}


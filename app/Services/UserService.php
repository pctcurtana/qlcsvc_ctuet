<?php

namespace App\Services;

use App\Contracts\Repositories\UserRepositoryInterface;
use App\Exceptions\ServiceException;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;

class UserService
{
    /**
     * @var UserRepositoryInterface
     */
    protected $userRepository;

    /**
     * @var PermissionService
     */
    protected $permissionService;

    public function __construct(UserRepositoryInterface $userRepository, PermissionService $permissionService)
    {
        $this->userRepository = $userRepository;
        $this->permissionService = $permissionService;
    }

    /**
     * Lấy danh sách người dùng có phân trang.
     */
    public function getAllPaginated(array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        return $this->userRepository->paginate($filters, $perPage);
    }

    /**
     * Lấy người dùng theo ID.
     */
    public function getById(int $id): User
    {
        $user = $this->userRepository->find($id);

        if (!$user) {
            throw new \Illuminate\Database\Eloquent\ModelNotFoundException('Không tìm thấy người dùng');
        }

        return $user;
    }

    /**
     * Tạo người dùng mới.
     */
    public function create(array $data, User $actor): User
    {
        if (($data['role'] ?? 'user') === 'admin' && !$actor->isAdmin()) {
            throw new ServiceException('Chỉ admin mới được tạo tài khoản admin.');
        }

        $user = $this->userRepository->create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        // Set role explicitly (not via mass assignment for security)
        $user->role = $data['role'] ?? 'user';
        $user->save();

        return $user;
    }

    /**
     * Cập nhật người dùng.
     *
     * Business rules:
     * - Không cho admin tự thay đổi vai trò của chính mình.
     * - Không cho hạ cấp admin cuối cùng trong hệ thống.
     * - Non-admin không sửa được tài khoản admin / có quyền cao hơn mình, không gán được vai trò admin.
     */
    public function update(int $id, array $data, User $actor): User
    {
        $user = $this->getById($id);
        $isSelf = $user->id === $actor->id;
        $isLastAdmin = $user->role === 'admin' && $this->userRepository->countByRole('admin') <= 1;

        $this->kiemTraQuyenQuanLy($actor, $user);
        if ($data['role'] === 'admin' && !$actor->isAdmin()) {
            throw new ServiceException('Chỉ admin mới được gán vai trò admin.');
        }

        // Không cho phép admin tự thay đổi vai trò của chính mình
        if ($isSelf && $data['role'] !== $user->role) {
            throw new ServiceException('Không thể thay đổi vai trò của chính mình!');
        }

        // Không cho hạ cấp admin cuối cùng
        if ($isLastAdmin && $data['role'] !== 'admin') {
            throw new ServiceException('Không thể hạ cấp admin cuối cùng trong hệ thống!');
        }

        $updateData = [
            'name'  => $data['name'],
            'email' => $data['email'],
        ];

        if (!empty($data['password'])) {
            $updateData['password'] = Hash::make($data['password']);
        }

        $user = $this->userRepository->update($id, $updateData);

        // Chỉ cập nhật role nếu không phải chính mình, gán trực tiếp (không qua mass assignment)
        if (!$isSelf) {
            $user->role = $data['role'];
            $user->save();
        }

        return $user;
    }

    /**
     * Xóa người dùng.
     *
     * Business rules:
     * - Không cho xóa chính mình.
     * - Không cho xóa admin cuối cùng.
     */
    public function delete(int $id, User $actor): bool
    {
        $user = $this->getById($id);

        // Không cho xóa chính mình
        if ($user->id === $actor->id) {
            throw new ServiceException('Không thể xóa tài khoản của chính mình!');
        }

        $this->kiemTraQuyenQuanLy($actor, $user);

        // Không cho xóa admin cuối cùng
        if ($user->role === 'admin' && $this->userRepository->countByRole('admin') <= 1) {
            throw new ServiceException('Không thể xóa admin cuối cùng trong hệ thống!');
        }

        return $this->userRepository->delete($id);
    }

    /**
     * Chặn non-admin thao tác trên tài khoản admin hoặc tài khoản có quyền cao hơn mình
     * (vd: đổi mật khẩu của người có quyền "Phân quyền" để chiếm tài khoản đó).
     */
    public function kiemTraQuyenQuanLy(User $actor, User $target): void
    {
        if (!$this->permissionService->coTheQuanLy($actor, $target)) {
            throw new ServiceException('Bạn không có quyền thao tác trên tài khoản này (tài khoản admin hoặc có quyền cao hơn bạn).');
        }
    }

    /**
     * Kiểm tra user có phải admin cuối cùng không.
     */
    public function isLastAdmin(User $user): bool
    {
        return $user->role === 'admin' && $this->userRepository->countByRole('admin') <= 1;
    }
}

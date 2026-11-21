<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\PermissionService;
use App\Http\Requests\Permission\UpdatePermissionRequest;
use Inertia\Inertia;

class PermissionController extends Controller
{
    /**
     * @var PermissionService
     */
    protected $permissionService;

    /**
     * PermissionController constructor.
     *
     * @param PermissionService $permissionService
     */
    public function __construct(PermissionService $permissionService)
    {
        $this->permissionService = $permissionService;
    }

    /**
     * Hiển thị trang phân quyền
     */
    public function index()
    {
        try {
            $users = $this->permissionService->getNonAdminUsers(auth()->user());
            $screens = $this->permissionService->getScreensTree();

            return Inertia::render('Permission/Index', [
                'users' => $users,
                'screens' => $screens,
            ]);
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $this->thongBaoLoi($e, 'Lỗi khi tải trang phân quyền'));
        }
    }

    /**
     * Lấy quyền của một user
     */
    public function getUserPermissions(User $user)
    {
        try {
            $permissions = $this->permissionService->getUserPermissions($user);
            return response()->json($permissions);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Không thể tải phân quyền'], 500);
        }
    }

    /**
     * Cập nhật quyền của một user
     */
    public function updateUserPermissions(UpdatePermissionRequest $request, User $user)
    {
        try {
            $this->permissionService->updateUserPermissions($request->user(), $user, $request->validated()['permissions']);
            return back()->with('success', 'Cập nhật phân quyền thành công!');
        } catch (\App\Exceptions\ServiceException $e) {
            return back()->with('error', $e->getMessage());
        } catch (\Throwable $e) {
            report($e);
            return back()->with('error', 'Có lỗi xảy ra khi cập nhật phân quyền. Vui lòng thử lại.');
        }
    }

    /**
     * Lấy danh sách screens dạng flat để hiển thị dạng table
     */
    public function getScreensFlat()
    {
        try {
            $screens = $this->permissionService->getScreensFlat();
            return response()->json($screens);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Không thể tải danh sách màn hình'], 500);
        }
    }
}

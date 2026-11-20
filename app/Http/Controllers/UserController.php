<?php

namespace App\Http\Controllers;

use App\Exceptions\ServiceException;
use App\Services\UserService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * @var UserService
     */
    protected $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }

    /**
     * Hiển thị danh sách người dùng
     */
    public function index(Request $request)
    {
        $filters = $request->only(['search', 'role', 'per_page']);
        $users = $this->userService->getAllPaginated($filters, (int)$request->input('per_page', 10));

        return Inertia::render('User/Index', [
            'users'   => $users,
            'filters' => $filters,
        ]);
    }

    /**
     * Hiển thị form tạo người dùng mới
     */
    public function create()
    {
        return Inertia::render('User/Create');
    }

    /**
     * Lưu người dùng mới
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6|confirmed',
            'role'     => 'required|in:admin,user',
        ], [
            'name.required'      => 'Vui lòng nhập tên.',
            'email.required'     => 'Vui lòng nhập email.',
            'email.email'        => 'Email không đúng định dạng.',
            'email.unique'       => 'Email đã tồn tại.',
            'password.required'  => 'Vui lòng nhập mật khẩu.',
            'password.min'       => 'Mật khẩu phải có ít nhất 6 ký tự.',
            'password.confirmed' => 'Xác nhận mật khẩu không khớp.',
            'role.required'      => 'Vui lòng chọn vai trò.',
        ]);

        try {
            $this->userService->create($request->only(['name', 'email', 'password', 'role']), $request->user());
        } catch (ServiceException $e) {
            return back()->withInput($request->except(['password', 'password_confirmation']))->with('error', $e->getMessage());
        }

        return redirect()->route('nguoi-dung.index')->with('success', 'Thêm người dùng thành công!');
    }

    /**
     * Hiển thị form chỉnh sửa người dùng
     */
    public function edit($nguoi_dung)
    {
        $nguoi_dung = $this->userService->getById($nguoi_dung);
        $isSelf = $nguoi_dung->id === auth()->id();

        try {
            $this->userService->kiemTraQuyenQuanLy(auth()->user(), $nguoi_dung);
        } catch (ServiceException $e) {
            return redirect()->route('nguoi-dung.index')->with('error', $e->getMessage());
        }

        return Inertia::render('User/Edit', [
            'user'        => $nguoi_dung,
            'isSelf'      => $isSelf,
            'isLastAdmin' => $this->userService->isLastAdmin($nguoi_dung),
        ]);
    }

    /**
     * Cập nhật người dùng
     */
    public function update(Request $request, $nguoi_dung)
    {
        $nguoi_dung = $this->userService->getById($nguoi_dung);

        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($nguoi_dung->id)],
            'password' => 'nullable|string|min:6|confirmed',
            'role'     => 'required|in:admin,user',
        ], [
            'name.required'      => 'Vui lòng nhập tên.',
            'email.required'     => 'Vui lòng nhập email.',
            'email.email'        => 'Email không đúng định dạng.',
            'email.unique'       => 'Email đã tồn tại.',
            'password.min'       => 'Mật khẩu phải có ít nhất 6 ký tự.',
            'password.confirmed' => 'Xác nhận mật khẩu không khớp.',
            'role.required'      => 'Vui lòng chọn vai trò.',
        ]);

        try {
            $this->userService->update($nguoi_dung->id, $request->only(['name', 'email', 'password', 'role']), $request->user());
            return redirect()->route('nguoi-dung.index')->with('success', 'Cập nhật người dùng thành công!');
        } catch (ServiceException $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Xóa người dùng
     */
    public function destroy($nguoi_dung)
    {
        try {
            $this->userService->delete($nguoi_dung, auth()->user());
            return redirect()->route('nguoi-dung.index')->with('success', 'Xóa người dùng thành công!');
        } catch (ServiceException $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}

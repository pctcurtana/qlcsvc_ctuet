<?php

namespace App\Services;

use App\Contracts\Repositories\UserRepositoryInterface;
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
     * UserService constructor.
     *
     * @param UserRepositoryInterface $userRepository
     */
    public function __construct(UserRepositoryInterface $userRepository)
    {
        $this->userRepository = $userRepository;
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
    public function create(array $data): User
    {
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
     */
    public function update(int $id, array $data, int $currentUserId): User
    {
        $user = $this->getById($id);
        $isSelf = $user->id === $currentUserId;
        $isLastAdmin = $user->role === 'admin' && $this->userRepository->countByRole('admin') <= 1;

        // Không cho phép admin tự thay đổi vai trò của chính mình
        if ($isSelf && $data['role'] !== $user->role) {
            throw new \RuntimeException('Không thể thay đổi vai trò của chính mình!');
        }

        // Không cho hạ cấp admin cuối cùng
        if ($isLastAdmin && $data['role'] !== 'admin') {
            throw new \RuntimeException('Không thể hạ cấp admin cuối cùng trong hệ thống!');
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
    public function delete(int $id, int $currentUserId): bool
    {
        $user = $this->getById($id);

        // Không cho xóa chính mình
        if ($user->id === $currentUserId) {
            throw new \RuntimeException('Không thể xóa tài khoản của chính mình!');
        }

        // Không cho xóa admin cuối cùng
        if ($user->role === 'admin' && $this->userRepository->countByRole('admin') <= 1) {
            throw new \RuntimeException('Không thể xóa admin cuối cùng trong hệ thống!');
        }

        return $this->userRepository->delete($id);
    }

    /**
     * Kiểm tra user có phải admin cuối cùng không.
     */
    public function isLastAdmin(User $user): bool
    {
        return $user->role === 'admin' && $this->userRepository->countByRole('admin') <= 1;
    }
}

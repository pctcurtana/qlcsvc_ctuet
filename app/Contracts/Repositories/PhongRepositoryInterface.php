<?php

namespace App\Contracts\Repositories;

use App\Models\Phong;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface PhongRepositoryInterface
{
    /**
     * Lấy danh sách phòng có phân trang và filter
     *
     * @param array $filters
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function paginate(array $filters = [], int $perPage = 10): LengthAwarePaginator;

    /**
     * Lấy tất cả phòng
     *
     * @param array $columns
     * @return Collection
     */
    public function all(array $columns = ['*']): Collection;

    /**
     * Lấy phòng theo ID
     *
     * @param int $id
     * @return Phong|null
     */
    public function find(int $id): ?Phong;

    /**
     * Tạo phòng mới
     *
     * @param array $data
     * @return Phong
     */
    public function create(array $data): Phong;

    /**
     * Cập nhật phòng
     *
     * @param int $id
     * @param array $data
     * @return Phong
     */
    public function update(int $id, array $data): Phong;

    /**
     * Xóa phòng
     *
     * @param int $id
     * @return bool
     */
    public function delete(int $id): bool;

    /**
     * Lấy phòng đang hoạt động với thông tin khu nhà
     *
     * @param array $columns
     * @return Collection
     */
    public function getActive(array $columns = ['*']): Collection;

    /**
     * Đếm tổng số phòng
     *
     * @return int
     */
    public function count(): int;

    /**
     * Lấy phòng theo khu nhà
     *
     * @param int $khuNhaId
     * @return Collection
     */
    public function getByKhuNha(int $khuNhaId, array $columns = ['id', 'ten_phong', 'ma_phong', 'khu_nha_id']): Collection;

    /**
     * Lấy thống kê theo loại phòng
     *
     * @return Collection
     */
    public function getStatsByType(): Collection;

    /**
     * Lấy thống kê theo trạng thái phòng
     *
     * @return Collection
     */
    public function getStatsByStatus(): Collection;

    /**
     * Lấy danh sách phòng cho quản lý QR có phân trang và filter (kèm khu nhà, cơ sở)
     *
     * @param array $filters
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function paginateForQr(array $filters = [], int $perPage = 10): LengthAwarePaginator;

    /**
     * Tạo lại QR token cho phòng
     *
     * @param int $id
     * @return bool
     */
    public function regenerateQrToken(int $id): bool;

    /**
     * Lấy danh sách tầng unique
     *
     * @return array
     */
    public function getDistinctTang(): array;
}


<?php

namespace App\Contracts\Repositories;

use App\Models\ThietBi;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface ThietBiRepositoryInterface
{
    /**
     * Lấy danh sách thiết bị có phân trang và filter
     *
     * @param array $filters
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function paginate(array $filters = [], int $perPage = 10): LengthAwarePaginator;

    /**
     * Lấy tất cả thiết bị
     *
     * @param array $columns
     * @return Collection
     */
    public function all(array $columns = ['*']): Collection;

    /**
     * Lấy thiết bị theo ID
     *
     * @param int $id
     * @return ThietBi|null
     */
    public function find(int $id): ?ThietBi;

    /**
     * Tạo thiết bị mới
     *
     * @param array $data
     * @return ThietBi
     */
    public function create(array $data): ThietBi;

    /**
     * Cập nhật thiết bị
     *
     * @param int $id
     * @param array $data
     * @return ThietBi
     */
    public function update(int $id, array $data): ThietBi;

    /**
     * Xóa thiết bị
     *
     * @param int $id
     * @return bool
     */
    public function delete(int $id): bool;

    /**
     * Lấy thiết bị đang hoạt động với thông tin phòng
     *
     * @param array $columns
     * @return Collection
     */
    public function getActive(array $columns = ['*']): Collection;

    /**
     * Đếm tổng số lượng thiết bị
     *
     * @return int
     */
    public function getTotalQuantity(): int;

    /**
     * Tính tổng giá trị thiết bị
     *
     * @return float
     */
    public function getTotalValue(): float;

    /**
     * Lấy thiết bị theo phòng
     *
     * @param int $phongId
     * @return Collection
     */
    public function getByPhong(int $phongId): Collection;

    /**
     * Lấy thống kê theo loại thiết bị
     *
     * @return Collection
     */
    public function getStatsByType(): Collection;

    /**
     * Lấy thiết bị cần bảo dưỡng
     *
     * @return Collection
     */
    public function getNeedMaintenance(): Collection;

    /**
     * Lấy thiết bị được nhóm theo phòng
     *
     * @param array $filters
     * @return Collection
     */
    public function getGroupedByPhong(array $filters = []): Collection;

    /**
     * Lấy danh sách thiết bị lịch sử (đã lưu kho) có phân trang và filter
     *
     * @param array $filters
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function paginateArchived(array $filters = [], int $perPage = 12): LengthAwarePaginator;

    /**
     * Thống kê tổng quan thiết bị trong kho
     *
     * @return array
     */
    public function getKhoStats(): array;

    /**
     * Lấy danh sách thiết bị cho quản lý QR có phân trang và filter (kèm phòng, khu nhà, cơ sở)
     *
     * @param array $filters
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function paginateForQr(array $filters = [], int $perPage = 10): LengthAwarePaginator;

    /**
     * Tạo lại QR token cho thiết bị
     *
     * @param int $id
     * @return bool
     */
    public function regenerateQrToken(int $id): bool;

    /**
     * Lấy thiết bị theo QR token (kèm phòng, khu nhà, cơ sở)
     *
     * @param string $token
     * @return ThietBi|null
     */
    public function getByQrToken(string $token): ?ThietBi;
}


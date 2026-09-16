<?php

namespace App\Services;

use App\Contracts\Repositories\ThietBiRepositoryInterface;
use App\Contracts\Services\ThietBiServiceInterface;
use App\Models\ThietBi;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use App\Services\ThongKeSnapshotService;

class ThietBiService
{
    /**
     * @var ThietBiRepositoryInterface
     */
    protected $thietBiRepository;

    /**
     * ThietBiService constructor.
     *
     * @param ThietBiRepositoryInterface $thietBiRepository
     */
    public function __construct(ThietBiRepositoryInterface $thietBiRepository)
    {
        $this->thietBiRepository = $thietBiRepository;
    }

    /**
     * {@inheritDoc}
     */
    public function getAllPaginated(array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        return $this->thietBiRepository->paginate($filters, $perPage);
    }

    /**
     * {@inheritDoc}
     */
    public function getActiveThietBis(): Collection
    {
        return $this->thietBiRepository->getActive(['id', 'ma_thiet_bi', 'ten_thiet_bi', 'phong_id']);
    }

    /**
     * {@inheritDoc}
     */
    public function getById(int $id): ThietBi
    {
        $thietBi = $this->thietBiRepository->find($id);
        
        if (!$thietBi) {
            throw new \Illuminate\Database\Eloquent\ModelNotFoundException('Không tìm thấy thiết bị');
        }

        // Load relationships
        $thietBi->load(['phong.khuNha.coSo', 'lichSuBaoDuongs']);

        return $thietBi;
    }

    /**
     * {@inheritDoc}
     */
    public function create(array $data): ThietBi
    {
        // Force so_luong = 1 và don_vi_tinh = 'cái' (mỗi record = 1 máy)
        $data['so_luong'] = 1;
        $data['don_vi_tinh'] = 'cái';
        
        // Tự động tính ngày bảo dưỡng tiếp theo
        $nextMaintenanceDate = $this->calculateNextMaintenanceDate($data);
        if ($nextMaintenanceDate) {
            $data['ngay_bao_duong_tiep_theo'] = $nextMaintenanceDate;
        }
        $result = $this->thietBiRepository->create($data);
        app(ThongKeSnapshotService::class)->onEntityChanged('thiet_bi');
        return $result;
    }

    /**
     * {@inheritDoc}
     */
    public function update(int $id, array $data): ThietBi
    {
        $thietBi = $this->getById($id);

        // Force so_luong = 1 và don_vi_tinh = 'cái' (không cho phép thay đổi)
        $data['so_luong'] = 1;
        $data['don_vi_tinh'] = 'cái';

        // Tự động tính ngày bảo dưỡng tiếp theo nếu có thay đổi
        $nextMaintenanceDate = $this->calculateNextMaintenanceDate($data, $thietBi);
        if ($nextMaintenanceDate) {
            $data['ngay_bao_duong_tiep_theo'] = $nextMaintenanceDate;
        }

        $result = $this->thietBiRepository->update($id, $data);
        app(ThongKeSnapshotService::class)->onEntityChanged('thiet_bi');
        return $result;
    }

    /**
     * {@inheritDoc}
     */
    public function delete(int $id): bool
    {
        $result = $this->thietBiRepository->delete($id);
        app(ThongKeSnapshotService::class)->onEntityChanged('thiet_bi');
        return $result;
    }

    /**
     * Tạo phiên bản mới: lưu trữ bản ghi hiện tại vào lịch sử,
     * tạo bản ghi mới với dữ liệu đã cập nhật.
     *
     * ThietBi không có con nên không cần cascade FK.
     * Lịch sử bảo dưỡng vẫn liên kết với bản ghi cũ (có thể truy vết qua ban_ghi_goc_id).
     */
    public function createNewVersion(int $id, array $data): ThietBi
    {
        return DB::transaction(function () use ($id, $data) {
            $current = $this->getById($id);

            $gocId = $current->ban_ghi_goc_id ?? $current->id;
            $phienBanMoi = ($current->phien_ban ?? 1) + 1;
            $now = now();

            $current->update([
                'trang_thai_du_lieu' => 'lich_su',
                'hieu_luc_den' => $now,
            ]);

            $data['so_luong'] = 1;
            $data['don_vi_tinh'] = 'cái';

            $nextMaintenanceDate = $this->calculateNextMaintenanceDate($data, $current);
            if ($nextMaintenanceDate) {
                $data['ngay_bao_duong_tiep_theo'] = $nextMaintenanceDate;
            }

            $newRecord = $this->thietBiRepository->create(array_merge($data, [
                'ma_thiet_bi'        => $current->ma_thiet_bi,
                'serial_number'      => $current->serial_number,
                'trang_thai_du_lieu' => 'hien_hanh',
                'hieu_luc_tu'        => $now,
                'hieu_luc_den'       => null,
                'phien_ban'          => $phienBanMoi,
                'ban_ghi_goc_id'     => $gocId,
            ]));

            app(ThongKeSnapshotService::class)->onEntityChanged('thiet_bi');

            return $newRecord;
        });
    }

    /**
     * {@inheritDoc}
     *
     * Logic tính ngày bảo dưỡng tiếp theo:
     * 1. Nếu có ngay_bao_duong_cuoi và chu_ky_bao_duong → cộng từ ngày bảo dưỡng cuối
     * 2. Nếu chỉ có ngay_mua và chu_ky_bao_duong (chưa bảo dưỡng lần nào) → cộng từ ngày mua
     * 3. Nếu không đủ điều kiện → null
     */
    public function calculateNextMaintenanceDate(array $data, ?ThietBi $thietBi = null): ?string
    {
        $ngayBaoDuongCuoi = $data['ngay_bao_duong_cuoi'] ?? ($thietBi->ngay_bao_duong_cuoi ?? null);
        $ngayMua = $data['ngay_mua'] ?? ($thietBi->ngay_mua ?? null);
        $chuKyBaoDuong = $data['chu_ky_bao_duong'] ?? ($thietBi->chu_ky_bao_duong ?? null);

        // Trường hợp 1: Có ngày bảo dưỡng cuối và chu kỳ bảo dưỡng
        if ($ngayBaoDuongCuoi && $chuKyBaoDuong) {
            return Carbon::parse($ngayBaoDuongCuoi)
                ->addMonths($chuKyBaoDuong)
                ->format('Y-m-d');
        }

        // Trường hợp 2: Chưa bảo dưỡng lần nào, tính từ ngày mua
        if ($ngayMua && $chuKyBaoDuong && !$ngayBaoDuongCuoi) {
            return Carbon::parse($ngayMua)
                ->addMonths($chuKyBaoDuong)
                ->format('Y-m-d');
        }

        return null;
    }

    /**
     * Lấy danh sách thiết bị lịch sử (kho) có phân trang
     *
     * @param array $filters
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getKhoPaginated(array $filters = [], int $perPage = 12): LengthAwarePaginator
    {
        return $this->thietBiRepository->paginateArchived($filters, $perPage);
    }

    /**
     * Lấy thống kê tổng quan kho thiết bị
     *
     * @return array
     */
    public function getKhoStats(): array
    {
        return $this->thietBiRepository->getKhoStats();
    }

    /**
     * Get all thiet bi grouped by phong
     * 
     * @param array $filters
     * @return array
     */
    public function getGroupedByPhong(array $filters = []): array
    {
        $groupedThietBis = $this->thietBiRepository->getGroupedByPhong($filters);
        
        // Transform data to include phong information and statistics
        $result = [];
        
        foreach ($groupedThietBis as $phongId => $thietBis) {
            if ($thietBis->isEmpty()) {
                continue;
            }

            $phong = $thietBis->first()->phong;
            
            // Calculate statistics for each phong
            $tongSoLuong = $thietBis->count(); // Đếm số thiết bị (mỗi record = 1 máy)
            $tongGiaTri = $thietBis->sum('gia_tri'); // Tổng giá trị

            $result[] = [
                'phong_id' => $phongId,
                'phong' => $phong,
                'thiet_bis' => $thietBis->values(),
                'tong_so_luong' => $tongSoLuong,
                'tong_gia_tri' => $tongGiaTri,
                'so_thiet_bi' => $thietBis->count(),
            ];
        }

        // Sort by phong name
        usort($result, function($a, $b) {
            return strcmp($a['phong']->ten_phong ?? '', $b['phong']->ten_phong ?? '');
        });

        return $result;
    }

    /**
     * Lấy danh sách thiết bị cho quản lý QR có phân trang (kèm phòng, khu nhà, cơ sở).
     */
    public function getQrPaginated(array $filters = [], int $perPage = 10): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        return $this->thietBiRepository->paginateForQr($filters, $perPage);
    }

    /**
     * Tạo lại QR token cho thiết bị.
     */
    public function regenerateQrToken(int $id): bool
    {
        return $this->thietBiRepository->regenerateQrToken($id);
    }

    /**
     * Lấy thiết bị theo QR token (kèm phòng, khu nhà, cơ sở).
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     */
    public function getByQrToken(string $token): \App\Models\ThietBi
    {
        $thietBi = $this->thietBiRepository->getByQrToken($token);

        if (!$thietBi) {
            throw new \Illuminate\Database\Eloquent\ModelNotFoundException('Không tìm thấy thiết bị với mã QR này.');
        }

        return $thietBi;
    }
}


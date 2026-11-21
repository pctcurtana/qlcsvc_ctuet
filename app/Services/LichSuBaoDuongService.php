<?php

namespace App\Services;

use App\Contracts\Repositories\LichSuBaoDuongRepositoryInterface;
use App\Contracts\Repositories\ThietBiRepositoryInterface;
use App\Contracts\Services\LichSuBaoDuongServiceInterface;
use App\Models\LichSuBaoDuong;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use App\Services\ThongKeSnapshotService;

class LichSuBaoDuongService
{
    /**
     * @var LichSuBaoDuongRepositoryInterface
     */
    protected $lichSuBaoDuongRepository;

    /**
     * @var ThietBiRepositoryInterface
     */
    protected $thietBiRepository;

    /**
     * LichSuBaoDuongService constructor.
     *
     * @param LichSuBaoDuongRepositoryInterface $lichSuBaoDuongRepository
     * @param ThietBiRepositoryInterface $thietBiRepository
     */
    /**
     * @var BaoCaoSuCoService
     */
    protected $baoCaoSuCoService;

    public function __construct(
        LichSuBaoDuongRepositoryInterface $lichSuBaoDuongRepository,
        ThietBiRepositoryInterface $thietBiRepository,
        BaoCaoSuCoService $baoCaoSuCoService
    ) {
        $this->lichSuBaoDuongRepository = $lichSuBaoDuongRepository;
        $this->thietBiRepository = $thietBiRepository;
        $this->baoCaoSuCoService = $baoCaoSuCoService;
    }

    /**
     * {@inheritDoc}
     */
    public function getAllPaginated(array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        return $this->lichSuBaoDuongRepository->paginate($filters, $perPage);
    }

    /**
     * {@inheritDoc}
     */
    public function getById(int $id): LichSuBaoDuong
    {
        $lichSu = $this->lichSuBaoDuongRepository->find($id);
        
        if (!$lichSu) {
            throw new \Illuminate\Database\Eloquent\ModelNotFoundException('Không tìm thấy lịch sử bảo dưỡng');
        }

        // Load relationship
        $lichSu->load('thietBi');

        return $lichSu;
    }

    /**
     * {@inheritDoc}
     */
    public function create(array $data): LichSuBaoDuong
    {
        $lichSu = DB::transaction(function () use ($data) {
            $lichSu = $this->lichSuBaoDuongRepository->create($data);

            // Cập nhật thông tin bảo dưỡng cho thiết bị nếu hoàn thành
            if ($data['trang_thai'] === 'hoan_thanh') {
                $this->updateThietBiMaintenanceInfo($data['thiet_bi_id'], $data['ngay_bao_duong']);
            }
            $this->dongBoBaoCaoSuCo($data, null);

            return $lichSu;
        });

        app(ThongKeSnapshotService::class)->onEntityChanged('lich_su_bao_duong');

        return $lichSu;
    }

    /**
     * {@inheritDoc}
     */
    public function update(int $id, array $data): LichSuBaoDuong
    {
        $lichSu = $this->getById($id);
        $oldStatus = $lichSu->trang_thai;

        $updatedLichSu = DB::transaction(function () use ($id, $data, $oldStatus) {
            $updatedLichSu = $this->lichSuBaoDuongRepository->update($id, $data);

            // Cập nhật thông tin bảo dưỡng cho thiết bị nếu trạng thái thay đổi thành hoàn thành
            if ($data['trang_thai'] === 'hoan_thanh' && $oldStatus !== 'hoan_thanh') {
                $this->updateThietBiMaintenanceInfo($data['thiet_bi_id'], $data['ngay_bao_duong']);
            }
            $this->dongBoBaoCaoSuCo($data, $oldStatus);

            return $updatedLichSu;
        });

        app(ThongKeSnapshotService::class)->onEntityChanged('lich_su_bao_duong');

        return $updatedLichSu;
    }

    /**
     * Đồng bộ báo cáo sự cố đang mở của thiết bị theo phiếu (dùng chung cho form admin và QR):
     * - chuyển sang "hoàn thành" → đóng các báo cáo đang mở;
     * - "đang thực hiện" → báo cáo chuyển sang "đang sửa chữa".
     */
    protected function dongBoBaoCaoSuCo(array $data, ?string $oldStatus): void
    {
        $nguoi = $data['nguoi_thuc_hien'] ?? null;
        if (!$nguoi) {
            $nguoi = optional(auth()->user())->name ?? optional(auth()->user())->email ?? 'Hệ thống';
        }

        if ($data['trang_thai'] === 'hoan_thanh' && $oldStatus !== 'hoan_thanh') {
            $this->baoCaoSuCoService->completeReportsForDevice($data['thiet_bi_id'], $nguoi);
        } elseif ($data['trang_thai'] === 'dang_thuc_hien') {
            $this->baoCaoSuCoService->updateReportsStatusForDevice($data['thiet_bi_id'], 'dang_sua_chua', $nguoi);
        }
    }

    /**
     * {@inheritDoc}
     */
    public function delete(int $id): bool
    {
        $result = $this->lichSuBaoDuongRepository->delete($id);
        app(ThongKeSnapshotService::class)->onEntityChanged('lich_su_bao_duong');
        return $result;
    }

    /**
     * {@inheritDoc}
     * 
     * Cập nhật ngày bảo dưỡng cuối và tính ngày bảo dưỡng tiếp theo cho thiết bị
     */
    public function updateThietBiMaintenanceInfo(int $thietBiId, string $ngayBaoDuong): void
    {
        $thietBi = $this->thietBiRepository->find($thietBiId);

        if (!$thietBi) {
            return;
        }

        $updateData = [
            'ngay_bao_duong_cuoi' => $ngayBaoDuong,
        ];

        // Tính ngày bảo dưỡng tiếp theo nếu có chu kỳ
        if ($thietBi->chu_ky_bao_duong) {
            $updateData['ngay_bao_duong_tiep_theo'] = Carbon::parse($ngayBaoDuong)
                ->addMonths($thietBi->chu_ky_bao_duong)
                ->format('Y-m-d');
        }

        $this->thietBiRepository->update($thietBiId, $updateData);
    }

    /**
     * Thống kê tổng quan lịch sử bảo dưỡng cho KPI cards.
     */
    public function getStats(): array
    {
        return $this->lichSuBaoDuongRepository->getStats();
    }

    /**
     * Đếm số lần sửa chữa của thiết bị.
     */
    public function countSuaChuaByThietBi(int $thietBiId): int
    {
        return $this->lichSuBaoDuongRepository->countByThietBiAndType($thietBiId, 'sua_chua');
    }

    /**
     * Lấy bản ghi đang thực hiện mới nhất của thiết bị.
     */
    public function getDangThucHienByThietBi(int $thietBiId): ?LichSuBaoDuong
    {
        return $this->lichSuBaoDuongRepository->getLatestByThietBiAndStatus($thietBiId, 'dang_thuc_hien');
    }
}


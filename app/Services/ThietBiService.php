<?php

namespace App\Services;

use App\Contracts\Repositories\ThietBiRepositoryInterface;
use App\Contracts\Services\ThietBiServiceInterface;
use App\Exceptions\ServiceException;
use App\Models\BaoCaoSuCo;
use App\Models\LichSuBaoDuong;
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
        $thietBi = $this->getById($id);
        KiemTraXoa::xoa($thietBi, "thiết bị \"{$thietBi->ma_thiet_bi}\"", [
            ['báo cáo sự cố', DB::table('bao_cao_su_cos')->where('thiet_bi_id', $id), false],
            ['lịch sử bảo dưỡng/sửa chữa', DB::table('lich_su_bao_duongs')->where('thiet_bi_id', $id), false],
        ], 'Nếu thiết bị không còn dùng nữa, hãy dùng chức năng "Ngừng sử dụng".');
        app(ThongKeSnapshotService::class)->onEntityChanged('thiet_bi');
        return true;
    }

    /**
     * Ngừng sử dụng: chuyển bản hiện hành sang lịch sử (hieu_luc_den = hiện tại),
     * KHÔNG tạo phiên bản mới. Chặn nếu còn sự cố/sửa chữa chưa xong.
     */
    public function ngungSuDung(int $id): ThietBi
    {
        $thietBi = DB::transaction(function () use ($id) {
            $thietBi = ThietBi::whereKey($id)->lockForUpdate()->first();
            if (!$thietBi) {
                throw new \Illuminate\Database\Eloquent\ModelNotFoundException('Không tìm thấy thiết bị');
            }
            if ($thietBi->trang_thai_du_lieu !== 'hien_hanh') {
                throw new ServiceException('Thiết bị này đã ngừng sử dụng hoặc đã được thay bằng phiên bản mới.', 422);
            }

            $lyDo = [];
            $soBaoCaoMo = BaoCaoSuCo::where('thiet_bi_id', $id)
                ->whereIn('trang_thai', ['yeu_cau_sua_chua', 'dang_sua_chua'])
                ->count();
            if ($soBaoCaoMo > 0) {
                $lyDo[] = "còn {$soBaoCaoMo} báo cáo sự cố chưa hoàn thành";
            }
            $soDangSua = LichSuBaoDuong::where('thiet_bi_id', $id)
                ->where('trang_thai', 'dang_thuc_hien')
                ->count();
            if ($soDangSua > 0) {
                $lyDo[] = "còn {$soDangSua} phiếu sửa chữa đang thực hiện";
            }
            if (!empty($lyDo)) {
                throw new ServiceException(
                    "Không thể ngừng sử dụng thiết bị \"{$thietBi->ma_thiet_bi}\": " . implode(', ', $lyDo) . '. Vui lòng xử lý xong trước.',
                    422
                );
            }

            $this->luuTruBanHienHanh($thietBi, now());
            return $thietBi;
        });

        app(ThongKeSnapshotService::class)->onEntityChanged('thiet_bi');
        return $thietBi;
    }

    /**
     * Chuyển bản hiện hành sang lịch sử. Dùng chung cho "lưu phiên bản mới" và "ngừng sử dụng".
     */
    private function luuTruBanHienHanh(ThietBi $current, $thoiDiem): void
    {
        $current->update([
            'trang_thai_du_lieu' => 'lich_su',
            'hieu_luc_den'       => $thoiDiem,
        ]);
    }

    /**
     * Tạo phiên bản mới: lưu trữ bản ghi hiện tại vào lịch sử,
     * tạo bản ghi mới với dữ liệu đã cập nhật.
     *
     * Đây vẫn là CÙNG một thiết bị (vd chuyển phòng), nên:
     * - QR được giữ nguyên (chuyển token sang bản mới) để tem QR đã dán vẫn dùng được;
     * - báo cáo sự cố / phiếu sửa chữa đang mở đi theo bản mới;
     * - phiếu đã xong ở lại bản cũ làm lịch sử (truy vết qua ban_ghi_goc_id).
     */
    public function createNewVersion(int $id, array $data): ThietBi
    {
        return DB::transaction(function () use ($id, $data) {
            $current = $this->getById($id);

            $gocId = $current->ban_ghi_goc_id ?? $current->id;
            $phienBanMoi = ($current->phien_ban ?? 1) + 1;
            $now = now();
            $qrToken = $current->qr_token;

            $this->luuTruBanHienHanh($current, $now);
            // Gỡ token khỏi bản cũ trước (cột qr_token unique)
            $current->update(['qr_token' => null]);

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
                'qr_token'           => $qrToken,
            ]));

            BaoCaoSuCo::where('thiet_bi_id', $current->id)
                ->whereIn('trang_thai', ['yeu_cau_sua_chua', 'dang_sua_chua'])
                ->update(['thiet_bi_id' => $newRecord->id]);
            LichSuBaoDuong::where('thiet_bi_id', $current->id)
                ->whereIn('trang_thai', ['chua_thuc_hien', 'dang_thuc_hien'])
                ->update(['thiet_bi_id' => $newRecord->id]);

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

    /**
     * Tìm thiết bị theo QR, kể cả bản đã ngừng sử dụng / đã thay bằng phiên bản mới.
     */
    public function findByQrTokenMoiTrangThai(string $token): ?ThietBi
    {
        return ThietBi::where('qr_token', $token)->first();
    }
}


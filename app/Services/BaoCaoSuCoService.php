<?php

namespace App\Services;

use App\Contracts\Repositories\BaoCaoSuCoRepositoryInterface;
use App\Models\BaoCaoSuCo;
use App\Models\Phong;
use App\Models\User;
use App\Notifications\BaoCaoSuCoMoi;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class BaoCaoSuCoService
{
    protected $repository;

    public function __construct(BaoCaoSuCoRepositoryInterface $repository)
    {
        $this->repository = $repository;
    }

    public function getAllPaginated(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return $this->repository->paginate($filters, $perPage);
    }

    public function getAll(array $filters = []): Collection
    {
        return $this->repository->all($filters);
    }

    public function getById(int $id): BaoCaoSuCo
    {
        $record = $this->repository->find($id);
        if (!$record) {
            throw new \Illuminate\Database\Eloquent\ModelNotFoundException('Không tìm thấy báo cáo');
        }
        return $record;
    }

    public function getPhongByToken(string $token): ?Phong
    {
        return Phong::where('qr_token', $token)
            ->where('trang_thai_du_lieu', 'hien_hanh')
            ->with(['khuNha.coSo', 'thietBis' => function ($q) {
                $q->where('trang_thai_du_lieu', 'hien_hanh')
                  ->select('id', 'ten_thiet_bi', 'ma_thiet_bi', 'trang_thai', 'phong_id');
            }])
            ->first();
    }

    public function create(array $data): BaoCaoSuCo
    {
        // Anti-spam: block duplicate open reports for the same device
        if (!empty($data['thiet_bi_id'])) {
            if ($this->repository->hasOpenReportForDevice((int) $data['thiet_bi_id'])) {
                throw new \RuntimeException(
                    'Thiết bị này đã có yêu cầu sửa chữa đang chờ xử lý. Vui lòng chờ kỹ thuật viên xử lý xong.'
                );
            }
        }

        $baoCao = $this->repository->create($data);

        // Chỉ báo khi dữ liệu đã commit (không transaction thì chạy ngay)
        DB::afterCommit(function () use ($baoCao) {
            $this->thongBaoBaoCaoMoi($baoCao);
        });

        return $baoCao;
    }

    /**
     * Gửi thông báo realtime + lưu chuông cho admin và người có quyền xem "Báo cáo sự cố".
     * Lỗi Pusher/DB chỉ ghi log: người báo sự cố vẫn gửi thành công.
     */
    protected function thongBaoBaoCaoMoi(BaoCaoSuCo $baoCao): void
    {
        try {
            $nguoiNhan = User::where('role', 'admin')
                ->orWhereHas('permissions', function ($q) {
                    $q->where('can_view', true)
                      ->whereHas('screen', function ($s) { $s->where('code', 'bao-cao-su-co'); });
                })
                ->get();

            Notification::send($nguoiNhan, new BaoCaoSuCoMoi($baoCao));
        } catch (\Throwable $e) {
            report($e);
        }
    }

    /**
     * Tự động đánh dấu hoàn thành tất cả báo cáo đang chờ của thiết bị
     * khi kỹ thuật viên ghi nhận hoàn thành sửa chữa qua QR.
     */
    public function completeReportsForDevice(int $thietBiId, string $nguoiHoanThanh, ?int $dotId = null): int
    {
        return $this->repository->completeOpenReportsForDevice($thietBiId, $nguoiHoanThanh, $dotId);
    }

    /**
     * Cập nhật trạng thái đang sửa chữa cho các báo cáo đang chờ của thiết bị.
     */
    public function updateReportsStatusForDevice(int $thietBiId, string $trangThai, string $nguoiThucHien, ?int $dotId = null): int
    {
        return $this->repository->updateStatusForDevice($thietBiId, $trangThai, $nguoiThucHien, $dotId);
    }

    public function delete(int $id): bool
    {
        return $this->repository->delete($id);
    }

    public function getStats(): array
    {
        return $this->repository->countByTrangThai();
    }

    /**
     * Kiểm tra thiết bị có báo cáo đang mở (yêu cầu sửa chữa hoặc đang sửa) không.
     */
    public function hasOpenReportForThietBi(int $thietBiId): bool
    {
        return $this->repository->hasOpenReportForDevice($thietBiId);
    }
}

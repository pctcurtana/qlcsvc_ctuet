<?php

namespace App\Repositories;

use App\Contracts\Repositories\BaoCaoSuCoRepositoryInterface;
use App\Models\BaoCaoSuCo;
use App\Models\Phong;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class BaoCaoSuCoRepository implements BaoCaoSuCoRepositoryInterface
{
    protected $model;

    public function __construct(BaoCaoSuCo $model)
    {
        $this->model = $model;
    }

    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->model->query()
            ->with(['phong.khuNha.coSo', 'thietBi', 'dotKiemTraThietBi']);

        if (!empty($filters['phong_id'])) {
            $query->whereIn('phong_id', $this->moiPhienBanPhong($filters['phong_id']));
        }
        if (!empty($filters['muc_do'])) {
            $query->where('muc_do', $filters['muc_do']);
        }
        if (!empty($filters['trang_thai'])) {
            $query->where('trang_thai', $filters['trang_thai']);
        }
        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('ten_nguoi_bao', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('mo_ta_su_co', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('so_dien_thoai', 'like', '%' . $filters['search'] . '%');
            });
        }

        if (!empty($filters['dot_id'])) {
            // Đợt đã lưu trên báo cáo lúc sửa (#15)
            $query->where('dot_kiem_tra_thiet_bi_id', $filters['dot_id']);
        }

        return $query->latest()->paginate($perPage);
    }

    public function all(array $filters = []): Collection
    {
        $query = $this->model->query()
            ->with(['phong.khuNha', 'thietBi', 'dotKiemTraThietBi']);

        if (!empty($filters['phong_id'])) {
            $query->whereIn('phong_id', $this->moiPhienBanPhong($filters['phong_id']));
        }
        if (!empty($filters['muc_do'])) {
            $query->where('muc_do', $filters['muc_do']);
        }
        if (!empty($filters['trang_thai'])) {
            $query->where('trang_thai', $filters['trang_thai']);
        }
        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('ten_nguoi_bao', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('mo_ta_su_co', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('so_dien_thoai', 'like', '%' . $filters['search'] . '%');
            });
        }

        if (!empty($filters['dot_id'])) {
            // Đợt đã lưu trên báo cáo lúc sửa (#15)
            $query->where('dot_kiem_tra_thiet_bi_id', $filters['dot_id']);
        }

        return $query->latest()->get();
    }

    public function find(int $id): ?BaoCaoSuCo
    {
        return $this->model->with(['phong.khuNha.coSo', 'thietBi', 'dotKiemTraThietBi'])->find($id);
    }

    public function create(array $data): BaoCaoSuCo
    {
        return $this->model->create($data);
    }

    public function update(int $id, array $data): BaoCaoSuCo
    {
        $record = $this->model->findOrFail($id);
        $record->update($data);
        return $record->fresh();
    }

    public function delete(int $id): bool
    {
        return $this->model->findOrFail($id)->delete();
    }

    public function hasOpenReportForDevice(int $thietBiId): bool
    {
        return $this->model
            ->where('thiet_bi_id', $thietBiId)
            ->whereIn('trang_thai', ['yeu_cau_sua_chua', 'dang_sua_chua'])
            ->exists();
    }

    public function completeOpenReportsForDevice(int $thietBiId, string $nguoiHoanThanh, ?int $dotId = null): int
    {
        return $this->model
            ->where('thiet_bi_id', $thietBiId)
            ->whereIn('trang_thai', ['yeu_cau_sua_chua', 'dang_sua_chua'])
            ->update([
                'trang_thai'       => 'hoan_thanh_sua_chua',
                'nguoi_hoan_thanh' => $nguoiHoanThanh,
                'ngay_hoan_thanh'  => now(),
                'dot_kiem_tra_thiet_bi_id' => $dotId,
            ]);
    }

    public function updateStatusForDevice(int $thietBiId, string $trangThai, string $nguoiThucHien, ?int $dotId = null): int
    {
        return $this->model
            ->where('thiet_bi_id', $thietBiId)
            ->whereIn('trang_thai', ['yeu_cau_sua_chua', 'dang_sua_chua'])
            ->update([
                'trang_thai'       => $trangThai,
                'nguoi_hoan_thanh' => $nguoiThucHien,
                'ngay_hoan_thanh'  => null,
                'dot_kiem_tra_thiet_bi_id' => $dotId,
            ]);
    }

    public function countByTrangThai(): array
    {
        return $this->model->selectRaw("
            COUNT(*) as tong,
            SUM(CASE WHEN trang_thai = 'yeu_cau_sua_chua'    THEN 1 ELSE 0 END) as yeu_cau,
            SUM(CASE WHEN trang_thai = 'dang_sua_chua'       THEN 1 ELSE 0 END) as dang_sua,
            SUM(CASE WHEN trang_thai = 'hoan_thanh_sua_chua' THEN 1 ELSE 0 END) as hoan_thanh,
            SUM(CASE WHEN muc_do = 'khan_cap' AND trang_thai IN ('yeu_cau_sua_chua', 'dang_sua_chua') THEN 1 ELSE 0 END) as khan_cap_chua_xu_ly
        ")->first()->toArray();
    }

    /**
     * Id của mọi phiên bản cùng phòng: báo cáo cũ gắn với bản phòng trước khi ghi nhận thay đổi (#37).
     */
    private function moiPhienBanPhong($phongId)
    {
        $phong = Phong::find($phongId);
        return $phong ? Phong::cungDoiTuong($phong)->select('id') : [$phongId];
    }
}

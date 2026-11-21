<?php

namespace App\Repositories;

use App\Contracts\Repositories\LichSuBaoDuongRepositoryInterface;
use App\Models\LichSuBaoDuong;
use App\Models\ThietBi;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class LichSuBaoDuongRepository implements LichSuBaoDuongRepositoryInterface
{
    /**
     * @var LichSuBaoDuong
     */
    protected $model;

    /**
     * LichSuBaoDuongRepository constructor.
     *
     * @param LichSuBaoDuong $model
     */
    public function __construct(LichSuBaoDuong $model)
    {
        $this->model = $model;
    }

    /**
     * {@inheritDoc}
     */
    public function paginate(array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        $query = $this->model->query()
            ->with(['thietBi.phong.khuNha.coSo', 'dotKiemTraThietBi']);

        // Filter by search
        if (isset($filters['search']) && !empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->whereHas('thietBi', function ($tbQ) use ($search) {
                    $tbQ->where('ma_thiet_bi', 'like', "%{$search}%")
                        ->orWhere('ten_thiet_bi', 'like', "%{$search}%")
                        ->orWhere('serial_number', 'like', "%{$search}%");
                })
                ->orWhere('noi_dung', 'like', "%{$search}%")
                ->orWhere('nguoi_thuc_hien', 'like', "%{$search}%");
            });
        }

        // Filter by thiet_bi_id
        if (isset($filters['thiet_bi_id']) && !empty($filters['thiet_bi_id'])) {
            $query->where('thiet_bi_id', $filters['thiet_bi_id']);
        }

        // Filter by loai_bao_duong
        if (isset($filters['loai_bao_duong']) && !empty($filters['loai_bao_duong'])) {
            $query->where('loai_bao_duong', $filters['loai_bao_duong']);
        }

        // Filter by status
        if (isset($filters['trang_thai']) && !empty($filters['trang_thai'])) {
            $query->where('trang_thai', $filters['trang_thai']);
        }

        // Sắp xếp: ngày bảo dưỡng giảm dần + tie-break theo thời gian tạo mới nhất
        return $query
            ->orderBy('ngay_bao_duong', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * {@inheritDoc}
     */
    public function all(array $columns = ['*']): Collection
    {
        return $this->model->all($columns);
    }

    /**
     * {@inheritDoc}
     */
    public function find(int $id): ?LichSuBaoDuong
    {
        return $this->model->find($id);
    }

    /**
     * {@inheritDoc}
     */
    public function create(array $data): LichSuBaoDuong
    {
        return $this->model->create($data);
    }

    /**
     * {@inheritDoc}
     */
    public function update(int $id, array $data): LichSuBaoDuong
    {
        $lichSu = $this->model->findOrFail($id);
        $lichSu->update($data);
        return $lichSu->fresh();
    }

    /**
     * {@inheritDoc}
     */
    public function delete(int $id): bool
    {
        $lichSu = $this->model->findOrFail($id);
        return $lichSu->delete();
    }

    /**
     * {@inheritDoc}
     */
    public function getLatestByThietBi(int $thietBiId): ?LichSuBaoDuong
    {
        return $this->model
            ->where('thiet_bi_id', $thietBiId)
            ->orderBy('ngay_bao_duong', 'desc')
            ->orderBy('created_at', 'desc')
            ->first();
    }

    /**
     * {@inheritDoc}
     */
    public function getStats(): array
    {
        return [
            'tong'             => $this->model->count(),
            'dinh_ky'          => $this->model->where('loai_bao_duong', 'dinh_ky')->count(),
            'sua_chua'         => $this->model->where('loai_bao_duong', 'sua_chua')->count(),
            'thay_the'         => $this->model->where('loai_bao_duong', 'thay_the')->count(),
            'hoan_thanh'       => $this->model->where('trang_thai', 'hoan_thanh')->count(),
            'dang_thuc_hien'   => $this->model->where('trang_thai', 'dang_thuc_hien')->count(),
            'tong_chi_phi'     => $this->model->sum('chi_phi') ?? 0,
        ];
    }

    /**
     * {@inheritDoc}
     */
    public function countByThietBiAndType(int $thietBiId, string $loaiBaoDuong): int
    {
        // Đếm trên mọi phiên bản của thiết bị (chuyển phòng không làm mất số lần sửa)
        $thietBi = ThietBi::find($thietBiId);
        if (!$thietBi) {
            return 0;
        }

        return $this->model
            ->whereIn('thiet_bi_id', ThietBi::cungDoiTuong($thietBi)->select('id'))
            ->where('loai_bao_duong', $loaiBaoDuong)
            ->count();
    }

    /**
     * {@inheritDoc}
     */
    public function getLatestByThietBiAndStatus(int $thietBiId, string $trangThai): ?LichSuBaoDuong
    {
        return $this->model
            ->where('thiet_bi_id', $thietBiId)
            ->where('trang_thai', $trangThai)
            ->latest('updated_at')
            ->first();
    }
}


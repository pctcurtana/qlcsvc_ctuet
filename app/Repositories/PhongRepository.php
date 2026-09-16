<?php

namespace App\Repositories;

use App\Contracts\Repositories\PhongRepositoryInterface;
use App\Models\Phong;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class PhongRepository implements PhongRepositoryInterface
{
    /**
     * @var Phong
     */
    protected $model;

    /**
     * PhongRepository constructor.
     *
     * @param Phong $model
     */
    public function __construct(Phong $model)
    {
        $this->model = $model;
    }

    /**
     * {@inheritDoc}
     */
    public function paginate(array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        $query = $this->model->query()
            ->with(['khuNha.coSo'])
            ->withCount('thietBis')
            ->where('trang_thai_du_lieu', 'hien_hanh');

        if (isset($filters['search']) && !empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function($q) use ($search) {
                $q->where('ma_phong', 'like', "%{$search}%")
                  ->orWhere('ten_phong', 'like', "%{$search}%");
            });
        }

        if (isset($filters['khu_nha_id']) && !empty($filters['khu_nha_id'])) {
            $query->where('khu_nha_id', $filters['khu_nha_id']);
        }

        if (isset($filters['loai_phong']) && !empty($filters['loai_phong'])) {
            $query->where('loai_phong', $filters['loai_phong']);
        }
        if (isset($filters['tang']) && $filters['tang'] !== '') {
            $query->where('tang', $filters['tang']);
        }

        return $query->orderBy('ma_phong', 'asc')->paginate($perPage);
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
    public function find(int $id): ?Phong
    {
        return $this->model->find($id);
    }

    /**
     * {@inheritDoc}
     */
    public function create(array $data): Phong
    {
        return $this->model->create($data);
    }

    /**
     * {@inheritDoc}
     */
    public function update(int $id, array $data): Phong
    {
        $phong = $this->model->findOrFail($id);
        $phong->update($data);
        return $phong->fresh();
    }

    /**
     * {@inheritDoc}
     */
    public function delete(int $id): bool
    {
        $phong = $this->model->findOrFail($id);
        return $phong->delete();
    }

    /**
     * {@inheritDoc}
     */
    public function getActive(array $columns = ['*']): Collection
    {
        return $this->model
            ->with('khuNha.coSo')
            ->where('trang_thai', 'active')
            ->where('trang_thai_du_lieu', 'hien_hanh')
            ->orderBy('ma_phong', 'asc')
            ->get($columns);
    }

    /**
     * {@inheritDoc}
     */
    public function count(): int
    {
        return $this->model->where('trang_thai_du_lieu', 'hien_hanh')->count();
    }

    /**
     * {@inheritDoc}
     */
    public function getByKhuNha(int $khuNhaId, array $columns = ['id', 'ten_phong', 'ma_phong', 'khu_nha_id']): Collection
    {
        return $this->model
            ->where('khu_nha_id', $khuNhaId)
            ->where('trang_thai', 'active')
            ->where('trang_thai_du_lieu', 'hien_hanh')
            ->orderBy('ma_phong', 'asc')
            ->get($columns);
    }

    /**
     * {@inheritDoc}
     */
    public function getStatsByType(): Collection
    {
        return $this->model
            ->selectRaw('loai_phong, COUNT(*) as so_luong, SUM(dien_tich) as dien_tich')
            ->where('trang_thai_du_lieu', 'hien_hanh')
            ->groupBy('loai_phong')
            ->get();
    }

    /**
     * {@inheritDoc}
     */
    public function getStatsByStatus(): Collection
    {
        return $this->model
            ->selectRaw('trang_thai, COUNT(*) as so_luong')
            ->where('trang_thai_du_lieu', 'hien_hanh')
            ->groupBy('trang_thai')
            ->get();
    }

    /**
     * {@inheritDoc}
     */
    public function paginateForQr(array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        $query = $this->model
            ->where('phongs.trang_thai_du_lieu', 'hien_hanh')
            ->leftJoin('khu_nhas as kn', 'kn.id', '=', 'phongs.khu_nha_id')
            ->leftJoin('co_sos as cs', 'cs.id', '=', 'kn.co_so_id')
            ->select(
                'phongs.id', 'phongs.ma_phong', 'phongs.ten_phong', 'phongs.qr_token',
                'phongs.khu_nha_id', 'kn.co_so_id',
                'kn.ten_khu_nha', 'cs.ten_co_so'
            );

        if (isset($filters['search']) && !empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('phongs.ten_phong', 'like', "%{$search}%")
                  ->orWhere('phongs.ma_phong', 'like', "%{$search}%")
                  ->orWhere('kn.ten_khu_nha', 'like', "%{$search}%")
                  ->orWhere('cs.ten_co_so', 'like', "%{$search}%");
            });
        }

        if (isset($filters['co_so_id']) && !empty($filters['co_so_id'])) {
            $query->where('kn.co_so_id', $filters['co_so_id']);
        }

        if (isset($filters['khu_nha_id']) && !empty($filters['khu_nha_id'])) {
            $query->where('phongs.khu_nha_id', $filters['khu_nha_id']);
        }

        return $query->orderBy('cs.ten_co_so')->orderBy('kn.ten_khu_nha')->orderBy('phongs.ten_phong')
            ->paginate($perPage);
    }

    /**
     * {@inheritDoc}
     */
    public function regenerateQrToken(int $id): bool
    {
        $phong = $this->model->findOrFail($id);
        return $phong->update([
            'qr_token' => \Illuminate\Support\Str::uuid(),
        ]);
    }

    /**
     * {@inheritDoc}
     */
    public function getDistinctTang(): array
    {
        return $this->model
            ->where('trang_thai_du_lieu', 'hien_hanh')
            ->select('tang')
            ->distinct()
            ->orderBy('tang')
            ->pluck('tang')
            ->toArray();
    }
}


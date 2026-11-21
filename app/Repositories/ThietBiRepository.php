<?php

namespace App\Repositories;

use App\Contracts\Repositories\ThietBiRepositoryInterface;
use App\Models\ThietBi;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class ThietBiRepository implements ThietBiRepositoryInterface
{
    /**
     * @var ThietBi
     */
    protected $model;

    /**
     * ThietBiRepository constructor.
     *
     * @param ThietBi $model
     */
    public function __construct(ThietBi $model)
    {
        $this->model = $model;
    }

    /**
     * {@inheritDoc}
     */
    public function paginate(array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        $query = $this->model->query()
            ->select('thiet_bis.*')
            ->leftJoin('phongs', 'thiet_bis.phong_id', '=', 'phongs.id')
            ->with(['phong.khuNha.coSo'])
            ->withCount('lichSuBaoDuongs')
            ->where('thiet_bis.trang_thai_du_lieu', 'hien_hanh');

        if (isset($filters['search']) && !empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function($q) use ($search) {
                $q->where('thiet_bis.ma_thiet_bi', 'like', "%{$search}%")
                  ->orWhere('thiet_bis.ten_thiet_bi', 'like', "%{$search}%")
                  ->orWhere('thiet_bis.serial_number', 'like', "%{$search}%")
                  ->orWhere('thiet_bis.hang_san_xuat', 'like', "%{$search}%");
            });
        }

        if (isset($filters['phong_id']) && !empty($filters['phong_id'])) {
            $query->where('thiet_bis.phong_id', $filters['phong_id']);
        }

        if (isset($filters['loai_thiet_bi']) && !empty($filters['loai_thiet_bi'])) {
            $query->where('thiet_bis.loai_thiet_bi', $filters['loai_thiet_bi']);
        }

        if (isset($filters['co_so_id']) && !empty($filters['co_so_id'])) {
            $query->whereHas('phong.khuNha', function($q) use ($filters) {
                $q->where('co_so_id', $filters['co_so_id']);
            });
        }
        if (isset($filters['can_bao_duong']) && $filters['can_bao_duong'] === 'true') {
            $query->whereNotNull('thiet_bis.ngay_bao_duong_tiep_theo')
                  ->whereDate('thiet_bis.ngay_bao_duong_tiep_theo', '<=', now());
        }

        return $query->orderBy('phongs.ten_phong', 'asc')
            ->orderBy('thiet_bis.ma_thiet_bi', 'asc')
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
    public function find(int $id): ?ThietBi
    {
        return $this->model->find($id);
    }

    /**
     * {@inheritDoc}
     */
    public function create(array $data): ThietBi
    {
        return $this->model->create($data);
    }

    /**
     * {@inheritDoc}
     */
    public function update(int $id, array $data): ThietBi
    {
        $thietBi = $this->model->findOrFail($id);
        $thietBi->update($data);
        return $thietBi->fresh();
    }

    /**
     * {@inheritDoc}
     */
    public function delete(int $id): bool
    {
        $thietBi = $this->model->findOrFail($id);
        return $thietBi->delete();
    }

    /**
     * {@inheritDoc}
     */
    public function getActive(array $columns = ['*']): Collection
    {
        return $this->model
            ->with('phong.khuNha')
            ->where('trang_thai_du_lieu', 'hien_hanh')
            ->orderBy('ma_thiet_bi', 'asc')
            ->get($columns);
    }

    /**
     * {@inheritDoc}
     */
    public function getTotalQuantity(): int
    {
        return $this->model->where('trang_thai_du_lieu', 'hien_hanh')->count();
    }

    /**
     * {@inheritDoc}
     */
    public function getTotalValue(): float
    {
        return (float) $this->model->where('trang_thai_du_lieu', 'hien_hanh')->sum('gia_tri') ?? 0;
    }

    /**
     * {@inheritDoc}
     */
    public function getByPhong(int $phongId): Collection
    {
        return $this->model
            ->where('phong_id', $phongId)
            ->where('trang_thai_du_lieu', 'hien_hanh')
            ->orderBy('ma_thiet_bi', 'asc')
            ->get();
    }

    /**
     * {@inheritDoc}
     */
    public function getStatsByType(): Collection
    {
        return $this->model
            ->selectRaw('loai_thiet_bi, COUNT(*) as so_luong, SUM(gia_tri) as gia_tri')
            ->where('trang_thai_du_lieu', 'hien_hanh')
            ->groupBy('loai_thiet_bi')
            ->get();
    }

    /**
     * {@inheritDoc}
     */
    public function getNeedMaintenance(): Collection
    {
        return $this->model
            ->where('trang_thai_du_lieu', 'hien_hanh')
            ->whereNotNull('ngay_bao_duong_tiep_theo')
            ->whereDate('ngay_bao_duong_tiep_theo', '<=', now())
            ->with(['phong.khuNha.coSo'])
            ->get();
    }

    /**
     * {@inheritDoc}
     */
    public function paginateArchived(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->model->query()
            ->with(['phong.khuNha.coSo'])
            ->where('trang_thai_du_lieu', 'lich_su');

        if (isset($filters['search']) && !empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('ma_thiet_bi', 'like', "%{$search}%")
                  ->orWhere('ten_thiet_bi', 'like', "%{$search}%")
                  ->orWhere('serial_number', 'like', "%{$search}%")
                  ->orWhere('hang_san_xuat', 'like', "%{$search}%");
            });
        }

        if (isset($filters['phong_id']) && !empty($filters['phong_id'])) {
            $query->where('phong_id', $filters['phong_id']);
        }

        if (isset($filters['ngay_vao_kho_tu']) && !empty($filters['ngay_vao_kho_tu'])) {
            $query->whereDate('hieu_luc_den', '>=', $filters['ngay_vao_kho_tu']);
        }

        if (isset($filters['ngay_vao_kho_den']) && !empty($filters['ngay_vao_kho_den'])) {
            $query->whereDate('hieu_luc_den', '<=', $filters['ngay_vao_kho_den']);
        }

        $paginated = $query->orderBy('hieu_luc_den', 'desc')->paginate($perPage);

        // Lấy thiết bị thay thế (phiên bản hiện hành) cho từng bản ghi kho
        $gocIds = $paginated->getCollection()->map(function ($tb) {
            return $tb->ban_ghi_goc_id ?? $tb->id;
        })->unique()->values()->toArray();

        if (!empty($gocIds)) {
            $replacements = $this->model
                ->with(['phong.khuNha.coSo'])
                ->where('trang_thai_du_lieu', 'hien_hanh')
                ->whereIn('ban_ghi_goc_id', $gocIds)
                ->get()
                ->keyBy('ban_ghi_goc_id');

            $paginated->getCollection()->transform(function ($tb) use ($replacements) {
                $gocId = $tb->ban_ghi_goc_id ?? $tb->id;
                $tb->thiet_bi_thay_the = $replacements->get($gocId);
                return $tb;
            });
        }

        return $paginated;
    }

    /**
     * {@inheritDoc}
     */
    public function getKhoStats(): array
    {
        $base = $this->model->where('trang_thai_du_lieu', 'lich_su');

        $tong = (clone $base)->count();

        // Thiết bị kết thúc trong tháng này
        $thangNay = (clone $base)
            ->whereYear('hieu_luc_den', now()->year)
            ->whereMonth('hieu_luc_den', now()->month)
            ->count();

        // Thiết bị đang dùng và đã từng ghi nhận thay đổi (bản hiện hành có bản gốc)
        $daThayDoi = $this->model
            ->where('trang_thai_du_lieu', 'hien_hanh')
            ->whereNotNull('ban_ghi_goc_id')
            ->count();

        // Thiết bị đã ngừng sử dụng: chuỗi phiên bản không còn bản hiện hành (#36)
        $daNgung = DB::table('thiet_bis as t')
            ->where('t.trang_thai_du_lieu', 'lich_su')
            ->whereNotExists(function ($q) {
                $q->from('thiet_bis as h')
                  ->where('h.trang_thai_du_lieu', 'hien_hanh')
                  ->whereRaw('COALESCE(h.ban_ghi_goc_id, h.id) = COALESCE(t.ban_ghi_goc_id, t.id)');
            })
            ->distinct()
            ->count(DB::raw('COALESCE(t.ban_ghi_goc_id, t.id)'));

        return [
            'tong'          => $tong,
            'da_thay_the'   => $daThayDoi,
            'thang_nay'     => $thangNay,
            'da_ngung'      => $daNgung,
        ];
    }

    /**
     * {@inheritDoc}
     */
    public function getGroupedByPhong(array $filters = []): Collection
    {
        $query = $this->model->query()
            ->with(['phong.khuNha.coSo'])
            ->where('trang_thai_du_lieu', 'hien_hanh');

        if (isset($filters['search']) && !empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function($q) use ($search) {
                $q->where('ma_thiet_bi', 'like', "%{$search}%")
                  ->orWhere('ten_thiet_bi', 'like', "%{$search}%")
                  ->orWhere('serial_number', 'like', "%{$search}%")
                  ->orWhere('hang_san_xuat', 'like', "%{$search}%");
            });
        }

        if (isset($filters['loai_thiet_bi']) && !empty($filters['loai_thiet_bi'])) {
            $query->where('loai_thiet_bi', $filters['loai_thiet_bi']);
        }

        if (isset($filters['trang_thai']) && !empty($filters['trang_thai'])) {
            $query->where('trang_thai', $filters['trang_thai']);
        }

        if (isset($filters['can_bao_duong']) && $filters['can_bao_duong'] === 'true') {
            $query->whereNotNull('ngay_bao_duong_tiep_theo')
                  ->whereDate('ngay_bao_duong_tiep_theo', '<=', now());
        }

        return $query->get()->groupBy('phong_id');
    }

    /**
     * {@inheritDoc}
     */
    public function paginateForQr(array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        $query = $this->model
            ->where('thiet_bis.trang_thai_du_lieu', 'hien_hanh')
            ->leftJoin('phongs as p', 'p.id', '=', 'thiet_bis.phong_id')
            ->leftJoin('khu_nhas as kn', 'kn.id', '=', 'p.khu_nha_id')
            ->leftJoin('co_sos as cs', 'cs.id', '=', 'kn.co_so_id')
            ->select(
                'thiet_bis.id', 'thiet_bis.qr_token', 'thiet_bis.ma_thiet_bi', 'thiet_bis.ten_thiet_bi', 'thiet_bis.loai_thiet_bi',
                'thiet_bis.phong_id', 'p.khu_nha_id', 'kn.co_so_id',
                'p.ten_phong', 'kn.ten_khu_nha', 'cs.ten_co_so'
            );

        if (isset($filters['search']) && !empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('thiet_bis.ten_thiet_bi', 'like', "%{$search}%")
                  ->orWhere('thiet_bis.ma_thiet_bi', 'like', "%{$search}%")
                  ->orWhere('p.ten_phong', 'like', "%{$search}%")
                  ->orWhere('kn.ten_khu_nha', 'like', "%{$search}%");
            });
        }

        if (isset($filters['co_so_id']) && !empty($filters['co_so_id'])) {
            $query->where('kn.co_so_id', $filters['co_so_id']);
        }

        if (isset($filters['khu_nha_id']) && !empty($filters['khu_nha_id'])) {
            $query->where('p.khu_nha_id', $filters['khu_nha_id']);
        }

        if (isset($filters['phong_id']) && !empty($filters['phong_id'])) {
            $query->where('thiet_bis.phong_id', $filters['phong_id']);
        }

        return $query->orderBy('cs.ten_co_so')->orderBy('kn.ten_khu_nha')->orderBy('p.ten_phong')
            ->paginate($perPage);
    }

    /**
     * {@inheritDoc}
     */
    public function regenerateQrToken(int $id): bool
    {
        $thietBi = $this->model
            ->where('id', $id)
            ->where('trang_thai_du_lieu', 'hien_hanh')
            ->firstOrFail();

        // Vô hiệu cả QR cũ của các phiên bản trước (nếu không chúng vẫn được chuyển tiếp sang bản hiện hành)
        $this->model->cungDoiTuong($thietBi)->where('trang_thai_du_lieu', 'lich_su')->update(['qr_token' => null]);

        return $thietBi->update([
            'qr_token' => \Illuminate\Support\Str::uuid(),
        ]);
    }

    /**
     * {@inheritDoc}
     */
    public function getByQrToken(string $token): ?ThietBi
    {
        $thietBi = $this->model
            ->where('qr_token', $token)
            ->where('trang_thai_du_lieu', 'hien_hanh')
            ->first();

        if ($thietBi) {
            $thietBi->load('phong.khuNha.coSo');
        }

        return $thietBi;
    }
}


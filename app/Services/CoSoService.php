<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use App\Contracts\Repositories\CoSoRepositoryInterface;
use App\Contracts\Services\CoSoServiceInterface;
use App\Models\CoSo;
use App\Models\KhuNha;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use App\Services\ThongKeSnapshotService;

class CoSoService
{
    /**
     * @var CoSoRepositoryInterface
     */
    protected $coSoRepository;

    public const SELECT_CACHE_KEY = 'select:co_so';
    public const SELECT_CACHE_TTL = 1800; // 30 phút

    /**
     * CoSoService constructor.
     *
     * @param CoSoRepositoryInterface $coSoRepository
     */
    public function __construct(CoSoRepositoryInterface $coSoRepository)
    {
        $this->coSoRepository = $coSoRepository;
    }

    /**
     * {@inheritDoc}
     */
    public function getAllPaginated(array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        return $this->coSoRepository->paginate($filters, $perPage);
    }

    /**
     * {@inheritDoc}
     */
    public function getActiveCoSos(): Collection
    {
        try {
            return Cache::remember(
                self::SELECT_CACHE_KEY,
                self::SELECT_CACHE_TTL,
                function () {
                    return $this->coSoRepository->getActive(['id', 'ten_co_so', 'ma_co_so']);
                }
            );
        } catch (\Throwable $e) {
            Log::warning("Redis cache error in getActiveCoSos: " . $e->getMessage());
            return $this->coSoRepository->getActive(['id', 'ten_co_so', 'ma_co_so']);
        }
    }

    /**
     * Xóa cache Select Cơ sở và các cache Khu nhà phụ thuộc.
     */
    public function clearSelectCache(?int $coSoId = null): void
    {
        try {
            Cache::forget(self::SELECT_CACHE_KEY);
            if ($coSoId) {
                Cache::forget("select:khu_nha:{$coSoId}");
            }
            $this->clearCachePattern('select:khu_nha:');
        } catch (\Throwable $e) {
            Log::warning("Clear select cache co_so failed: " . $e->getMessage());
        }
    }

    protected function clearCachePattern(string $pattern): void
    {
        try {
            if (config('cache.default') === 'redis') {
                $redis = Cache::getRedis();
                $keys = $redis->keys('*' . $pattern . '*');
                if (!empty($keys)) {
                    foreach ($keys as $key) {
                        $redis->del($key);
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::warning("Clear cache pattern [{$pattern}] failed: " . $e->getMessage());
        }
    }

    /**
     * {@inheritDoc}
     */
    public function getById(int $id): CoSo
    {
        $coSo = $this->coSoRepository->find($id);
        if (!$coSo) {
            throw new \App\Exceptions\ResourceNotFoundException('Không tìm thấy cơ sở với ID: ' . $id);
        }
        return $coSo;
    }

    /**
     * {@inheritDoc}
     */
    public function create(array $data): CoSo
    {
        // Tự động tính diện tích quy đổi = diện tích đất * vị trí khuôn viên
        $data['dien_tich_quy_doi'] = $this->calculateDienTichQuyDoi(
            $data['dien_tich_dat'],
            $data['vi_tri_khuon_vien']
        );
        $result = $this->coSoRepository->create($data);
        $this->clearSelectCache();
        app(ThongKeSnapshotService::class)->onEntityChanged('co_so');
        return $result;
    }

    /**
     * {@inheritDoc}
     */
    public function update(int $id, array $data): CoSo
    {
        $this->getById($id);
        // Tự động tính diện tích quy đổi = diện tích đất * vị trí khuôn viên
        $data['dien_tich_quy_doi'] = $this->calculateDienTichQuyDoi(
            $data['dien_tich_dat'],
            $data['vi_tri_khuon_vien']
        );
        $result = $this->coSoRepository->update($id, $data);
        $this->clearSelectCache($id);
        app(ThongKeSnapshotService::class)->onEntityChanged('co_so');
        return $result;
    }

    /**
     * {@inheritDoc}
     */
    public function delete(int $id): bool
    {
        $coSo = $this->getById($id);
        KiemTraXoa::xoa($coSo, "cơ sở \"{$coSo->ma_co_so}\"", [
            ['toà nhà', DB::table('khu_nhas')->where('co_so_id', $id), true],
        ]);
        $this->clearSelectCache($id);
        app(ThongKeSnapshotService::class)->onEntityChanged('co_so');
        return true;
    }

    /**
     * Tạo phiên bản mới: lưu trữ bản ghi hiện tại vào lịch sử,
     * tạo bản ghi mới với dữ liệu đã cập nhật.
     *
     * Cascade: cập nhật tất cả KhuNha hien_hanh trỏ từ old_id sang new_id.
     */
    public function createNewVersion(int $id, array $data): CoSo
    {
        return DB::transaction(function () use ($id, $data) {
            $current = $this->getById($id);

            // Xác định ban_ghi_goc_id và phien_ban mới
            $gocId = $current->ban_ghi_goc_id ?? $current->id;
            $phienBanMoi = ($current->phien_ban ?? 1) + 1;
            $now = now();

            // Đánh dấu bản ghi hiện tại là lịch sử
            $current->update([
                'trang_thai_du_lieu' => 'lich_su',
                'hieu_luc_den' => $now,
            ]);

            // Tính diện tích quy đổi
            $data['dien_tich_quy_doi'] = $this->calculateDienTichQuyDoi(
                $data['dien_tich_dat'],
                $data['vi_tri_khuon_vien']
            );

            // Tạo bản ghi phiên bản mới
            $newRecord = $this->coSoRepository->create(array_merge($data, [
                'ma_co_so'          => $current->ma_co_so,
                'trang_thai_du_lieu' => 'hien_hanh',
                'hieu_luc_tu'       => $now,
                'hieu_luc_den'      => null,
                'phien_ban'         => $phienBanMoi,
                'ban_ghi_goc_id'    => $gocId,
            ]));

            // Cascade: chuyển các KhuNha hien_hanh sang co_so_id mới
            KhuNha::where('co_so_id', $current->id)
                ->where('trang_thai_du_lieu', 'hien_hanh')
                ->update(['co_so_id' => $newRecord->id]);

            // Clear cache select
            $this->clearSelectCache($id);
            $this->clearSelectCache($newRecord->id);

            // Hook sau khi transaction commit thành công
            app(ThongKeSnapshotService::class)->onEntityChanged('co_so');

            return $newRecord;
        });
    }

    /**
     * Tính diện tích quy đổi theo công thức BGD
     * Diện tích quy đổi = Diện tích đất × Vị trí khuôn viên
     * 
     * @param float $dienTichDat Diện tích đất (m²)
     * @param float $viTriKhuonVien Hệ số vị trí khuôn viên (mặc định 2.5 theo BGD)
     * @return float Diện tích quy đổi
     */
    public function calculateDienTichQuyDoi(float $dienTichDat, float $viTriKhuonVien): float
    {
        return $dienTichDat * $viTriKhuonVien;
    }
}


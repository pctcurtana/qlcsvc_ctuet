<?php

namespace App\Services;

use App\Contracts\Repositories\PhongRepositoryInterface;
use App\Contracts\Services\PhongServiceInterface;
use App\Models\Phong;
use App\Models\ThietBi;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use App\Services\ThongKeSnapshotService;

class PhongService
{
    /**
     * @var PhongRepositoryInterface
     */
    protected $phongRepository;

    public const SELECT_CACHE_TTL = 1800; // 30 phút

    /**
     * PhongService constructor.
     *
     * @param PhongRepositoryInterface $phongRepository
     */
    public function __construct(PhongRepositoryInterface $phongRepository)
    {
        $this->phongRepository = $phongRepository;
    }

    /**
     * {@inheritDoc}
     */
    public function getAllPaginated(array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        return $this->phongRepository->paginate($filters, $perPage);
    }

    /**
     * {@inheritDoc}
     */
    public function getActivePhongs(): Collection
    {
        try {
            return Cache::remember('select:phong:all', self::SELECT_CACHE_TTL, function () {
                return $this->phongRepository->getActive(['id', 'ten_phong', 'ma_phong', 'khu_nha_id']);
            });
        } catch (\Throwable $e) {
            Log::warning("Redis cache error in getActivePhongs: " . $e->getMessage());
            return $this->phongRepository->getActive(['id', 'ten_phong', 'ma_phong', 'khu_nha_id']);
        }
    }

    /**
     * Lấy danh sách phòng theo khu nhà cho Select (Có cache Redis)
     */
    public function getByKhuNha(int $khuNhaId): Collection
    {
        $cacheKey = "select:phong:{$khuNhaId}";
        try {
            return Cache::remember($cacheKey, self::SELECT_CACHE_TTL, function () use ($khuNhaId) {
                return $this->phongRepository->getByKhuNha($khuNhaId, ['id', 'ten_phong', 'ma_phong', 'khu_nha_id']);
            });
        } catch (\Throwable $e) {
            Log::warning("Redis cache error in getByKhuNha [{$khuNhaId}]: " . $e->getMessage());
            return $this->phongRepository->getByKhuNha($khuNhaId, ['id', 'ten_phong', 'ma_phong', 'khu_nha_id']);
        }
    }

    /**
     * Xóa cache Select Phòng.
     */
    public function clearSelectCache(?int $khuNhaId = null): void
    {
        try {
            Cache::forget('select:phong:all');
            if ($khuNhaId) {
                Cache::forget("select:phong:{$khuNhaId}");
            }
            $this->clearCachePattern('select:phong:');
        } catch (\Throwable $e) {
            Log::warning("Clear select cache phong failed: " . $e->getMessage());
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
    public function getById(int $id): Phong
    {
        $phong = $this->phongRepository->find($id);
        
        if (!$phong) {
            throw new \Illuminate\Database\Eloquent\ModelNotFoundException('Không tìm thấy phòng');
        }

        // Load relationships
        $phong->load('khuNha.coSo');

        return $phong;
    }

    /**
     * {@inheritDoc}
     */
    public function create(array $data): Phong
    {
        $result = $this->phongRepository->create($data);
        $this->clearSelectCache($result->khu_nha_id ?? null);
        app(ThongKeSnapshotService::class)->onEntityChanged('phong');
        return $result;
    }

    /**
     * {@inheritDoc}
     */
    public function update(int $id, array $data): Phong
    {
        $current = $this->getById($id);
        $oldKhuNhaId = $current->khu_nha_id ?? null;

        $result = $this->phongRepository->update($id, $data);

        $this->clearSelectCache($oldKhuNhaId);
        if ($result->khu_nha_id && $result->khu_nha_id !== $oldKhuNhaId) {
            $this->clearSelectCache($result->khu_nha_id);
        }

        app(ThongKeSnapshotService::class)->onEntityChanged('phong');
        return $result;
    }

    /**
     * {@inheritDoc}
     */
    public function delete(int $id): bool
    {
        $phong = $this->phongRepository->find($id);
        $khuNhaId = $phong->khu_nha_id ?? null;
        $result = $this->phongRepository->delete($id);
        $this->clearSelectCache($khuNhaId);
        app(ThongKeSnapshotService::class)->onEntityChanged('phong');
        return $result;
    }

    /**
     * Tạo phiên bản mới: lưu trữ bản ghi hiện tại vào lịch sử,
     * tạo bản ghi mới với dữ liệu đã cập nhật.
     *
     * Cascade: cập nhật tất cả ThietBi hien_hanh trỏ từ old_id sang new_id.
     */
    public function createNewVersion(int $id, array $data): Phong
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

            $newRecord = $this->phongRepository->create(array_merge($data, [
                'ma_phong'           => $current->ma_phong,
                'trang_thai_du_lieu' => 'hien_hanh',
                'hieu_luc_tu'        => $now,
                'hieu_luc_den'       => null,
                'phien_ban'          => $phienBanMoi,
                'ban_ghi_goc_id'     => $gocId,
            ]));

            // Cascade: chuyển các ThietBi hien_hanh sang phong_id mới
            ThietBi::where('phong_id', $current->id)
                ->where('trang_thai_du_lieu', 'hien_hanh')
                ->update(['phong_id' => $newRecord->id]);

            $this->clearSelectCache($current->khu_nha_id ?? null);
            $this->clearSelectCache($newRecord->khu_nha_id ?? null);

            app(ThongKeSnapshotService::class)->onEntityChanged('phong');

            return $newRecord;
        });
    }

    /**
     * Lấy danh sách phòng cho quản lý QR có phân trang (kèm khu nhà, cơ sở).
     */
    public function getQrPaginated(array $filters = [], int $perPage = 10): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        return $this->phongRepository->paginateForQr($filters, $perPage);
    }

    /**
     * Tạo lại QR token cho phòng.
     */
    public function regenerateQrToken(int $id): bool
    {
        return $this->phongRepository->regenerateQrToken($id);
    }

    /**
     * Lấy danh sách tầng unique.
     */
    public function getDistinctTang(): array
    {
        return $this->phongRepository->getDistinctTang();
    }
}


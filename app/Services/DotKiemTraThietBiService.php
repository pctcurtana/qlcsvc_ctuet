<?php

namespace App\Services;

use App\Contracts\Repositories\DotKiemTraThietBiRepositoryInterface;
use App\Models\DotKiemTraThietBi;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DotKiemTraThietBiService
{
    /**
     * @var DotKiemTraThietBiRepositoryInterface
     */
    protected $repository;

    public function __construct(DotKiemTraThietBiRepositoryInterface $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Lấy danh sách đợt kiểm tra có phân trang.
     */
    public function getAllPaginated(array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        return $this->repository->paginate($filters, $perPage);
    }

    /**
     * Thống kê tổng quan.
     */
    public function getStats(): array
    {
        return $this->repository->getStats();
    }

    /**
     * Tạo đợt kiểm tra mới.
     *
     * Business rule: Nếu đợt mới được active, deactivate tất cả đợt cũ.
     */
    public function create(array $data): DotKiemTraThietBi
    {
        return DB::transaction(function () use ($data) {
            $shouldActivate = !empty($data['is_active']);

            if ($shouldActivate) {
                $this->repository->deactivateAll();
            }

            // Remove sensitive fields from data before mass assignment
            $fillableData = collect($data)->except(['is_active', 'nguoi_tao_id'])->toArray();

            $dot = $this->repository->create($fillableData);

            // Set sensitive fields explicitly (not via mass assignment)
            $dot->is_active    = $shouldActivate;
            $dot->nguoi_tao_id = auth()->id();
            $dot->save();

            return $dot;
        });
    }

    /**
     * Kích hoạt 1 đợt kiểm tra (tắt tất cả đợt cũ).
     */
    public function activate(int $id): DotKiemTraThietBi
    {
        return DB::transaction(function () use ($id) {
            $this->repository->deactivateAll();

            $dot = $this->repository->find($id);
            if (!$dot) {
                throw new \Illuminate\Database\Eloquent\ModelNotFoundException('Không tìm thấy đợt kiểm tra');
            }

            // Set is_active explicitly (not via mass assignment)
            $dot->is_active = true;
            $dot->save();

            return $dot;
        });
    }

    /**
     * Xóa đợt kiểm tra.
     *
     * Business rule: Không cho xóa đợt đang active.
     */
    public function delete(int $id): bool
    {
        $dot = $this->repository->find($id);

        if (!$dot) {
            throw new \Illuminate\Database\Eloquent\ModelNotFoundException('Không tìm thấy đợt kiểm tra');
        }

        if ($dot->is_active) {
            throw new \RuntimeException('Không thể xóa đợt đang active.');
        }

        return $this->repository->delete($id);
    }

    /**
     * Lấy đợt kiểm tra đang active.
     */
    public function getActiveDot(): ?DotKiemTraThietBi
    {
        return $this->repository->getActiveDot();
    }

    /**
     * Lấy danh sách đợt kiểm tra cho dropdown.
     */
    public function getAllForDropdown(): Collection
    {
        return $this->repository->getAllForDropdown();
    }
}

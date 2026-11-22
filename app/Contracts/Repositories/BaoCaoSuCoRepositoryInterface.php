<?php

namespace App\Contracts\Repositories;

use App\Models\BaoCaoSuCo;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface BaoCaoSuCoRepositoryInterface
{
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator;
    public function all(array $filters = []): Collection;
    public function find(int $id): ?BaoCaoSuCo;
    public function create(array $data): BaoCaoSuCo;
    public function update(int $id, array $data): BaoCaoSuCo;
    public function delete(int $id): bool;
    public function countByTrangThai(): array;
    public function hasOpenReportForDevice(int $thietBiId): bool;
    public function completeOpenReportsForDevice(int $thietBiId, string $nguoiHoanThanh, ?int $dotId = null): int;
    public function updateStatusForDevice(int $thietBiId, string $trangThai, string $nguoiThucHien, ?int $dotId = null): int;
}

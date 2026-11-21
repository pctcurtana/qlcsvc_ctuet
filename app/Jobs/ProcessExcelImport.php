<?php

namespace App\Jobs;

use App\Events\ImportProcessed;
use App\Models\Import;
use App\Services\ImportService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

class ProcessExcelImport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * ID bản ghi import trong DB.
     *
     * @var int
     */
    public $importId;

    /**
     * Mã module ('co_so', 'khu_nha', 'phong', 'thiet_bi').
     *
     * @var string|null
     */
    public $module;

    /**
     * Timeout cho Job (tính bằng giây). 3600 = 1 giờ.
     *
     * @var int
     */
    public $timeout = 3600;

    /**
     * Số lần thử tối đa.
     *
     * @var int
     */
    public $tries = 1;

    /**
     * Create a new job instance.
     *
     * @param int $importId
     * @param string|null $module
     */
    public function __construct($importId, $module = null)
    {
        $this->importId = (int) $importId;
        $this->module   = $module;
        $this->onQueue('imports');
    }

    /**
     * Execute the job.
     *
     * @param ImportService $importService
     * @return void
     */
    public function handle(ImportService $importService)
    {
        $import = Import::find($this->importId);
        if (!$import) {
            Log::warning("ProcessExcelImport: Import #{$this->importId} không tồn tại, bỏ qua.");
            return;
        }

        // Nếu import đã hoàn tất hoặc đã thất bại trước đó (do retry), không xử lý lại
        if (in_array($import->status, ['completed', 'failed'])) {
            Log::info("ProcessExcelImport: Import #{$this->importId} đã ở trạng thái '{$import->status}', bỏ qua retry.");
            return;
        }

        // Kiểm tra file tạm còn tồn tại không (quan trọng khi retry)
        if (!Storage::disk('local')->exists($import->file_path)) {
            $import->update([
                'status'        => 'failed',
                'error_message' => 'File tạm đã bị xóa, không thể xử lý lại. Vui lòng import lại.',
            ]);
            $this->safeBroadcast(new ImportProcessed(
                $import->id, $import->user_id, $import->module,
                'failed', 0, 0, 0, 0, null,
                'File tạm đã bị xóa, không thể xử lý lại.'
            ));
            return;
        }

        // Nhận việc nguyên tử: nếu một job khác đã nhận import này thì bỏ qua (#14, tránh nhập trùng)
        $claimed = Import::whereKey($import->id)->where('status', 'pending')
            ->update(['status' => 'processing', 'updated_at' => now()]);
        if (!$claimed) {
            Log::info("ProcessExcelImport: Import #{$import->id} đang được job khác xử lý, bỏ qua.");
            return;
        }
        $import->refresh();

        try {
            $fullPath = Storage::disk('local')->path($import->file_path);

            if (!file_exists($fullPath)) {
                throw new \RuntimeException("File tạm không tồn tại: {$import->file_path}");
            }

            $result = [];
            switch ($import->module) {
                case 'co_so':
                    $result = $importService->importCoSo($fullPath);
                    break;
                case 'khu_nha':
                    $result = $importService->importKhuNha($fullPath);
                    break;
                case 'phong':
                    $result = $importService->importPhong($fullPath);
                    break;
                case 'thiet_bi':
                    $result = $importService->importThietBi($fullPath);
                    break;
                default:
                    throw new \InvalidArgumentException("Module import không hợp lệ: {$import->module}");
            }

            $import->update([
                'status'         => 'completed',
                'total'          => $result['total'] ?? 0,
                'created'        => $result['created'] ?? 0,
                'updated'        => $result['updated'] ?? 0,
                'errors'         => $result['errors'] ?? 0,
                'error_details'  => $result['error_details'] ?? [],
                'execution_time' => $result['execution_time'] ?? null,
            ]);

            // Xóa file tạm sau khi import thành công
            if (Storage::disk('local')->exists($import->file_path)) {
                Storage::disk('local')->delete($import->file_path);
            }

            // Broadcast thông báo hoàn tất an toàn
            $this->safeBroadcast(new ImportProcessed(
                $import->id,
                $import->user_id,
                $import->module,
                'completed',
                $import->total,
                $import->created,
                $import->updated,
                $import->errors,
                $import->execution_time
            ));

        } catch (Throwable $e) {

            $import->update([
                'status'        => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            if (Storage::disk('local')->exists($import->file_path)) {
                Storage::disk('local')->delete($import->file_path);
            }

            $this->safeBroadcast(new ImportProcessed(
                $import->id,
                $import->user_id,
                $import->module,
                'failed',
                0, 0, 0, 0, null,
                $e->getMessage()
            ));

            throw $e;
        }
    }

    /**
     * Xử lý trường hợp Job bị unhandled exception / failed.
     *
     * @param Throwable $exception
     * @return void
     */
    public function failed(Throwable $exception)
    {

        try {
            $import = Import::find($this->importId);
            if ($import) {
                $import->update([
                    'status'        => 'failed',
                    'error_message' => $exception->getMessage(),
                ]);

                if (Storage::disk('local')->exists($import->file_path)) {
                    Storage::disk('local')->delete($import->file_path);
                }

                $this->safeBroadcast(new ImportProcessed(
                    $import->id,
                    $import->user_id,
                    $import->module,
                    'failed',
                    0, 0, 0, 0, null,
                    $exception->getMessage()
                ));
            }
        } catch (Throwable $e) {
            Log::error("ProcessExcelImport::failed handler exception: {$e->getMessage()}");
        }
    }

    /**
     * Broadcast an toàn, không ngắt Job nếu broadcasting gặp sự cố network/Pusher.
     *
     * @param object $event
     * @return void
     */
    protected function safeBroadcast($event)
    {
        try {
            broadcast($event);
        } catch (Throwable $e) {
            Log::error("ProcessExcelImport broadcast warning: {$e->getMessage()}");
        }
    }
}

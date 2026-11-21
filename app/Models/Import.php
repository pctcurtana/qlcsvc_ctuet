<?php

namespace App\Models;

use App\Jobs\ProcessExcelImport;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class Import extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'module',
        'file_path',
        'original_filename',
        'status',
        'total',
        'created',
        'updated',
        'errors',
        'error_details',
        'execution_time',
        'error_message',
    ];

    protected $casts = [
        'total' => 'integer',
        'created' => 'integer',
        'updated' => 'integer',
        'errors' => 'integer',
        'execution_time' => 'float',
        'error_details' => 'array',
    ];

    /**
     * Relationship với User thực hiện import.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Dọn dẹp các import bị kẹt:
     * - Import processing/pending > 2 giờ → đánh dấu failed (không thể recovery).
     * - Import pending > 30 giây, hoặc processing quá timeout của job (nhưng < 2 giờ) → reset về pending và re-dispatch job.
     *
     * Được gọi từ Controller trước khi hiển thị trạng thái import.
     */
    public static function cleanupStaleImports()
    {
        // 1. Import kẹt quá 2 giờ → đánh dấu failed
        $expiredImports = self::whereIn('status', ['pending', 'processing'])
            ->where('updated_at', '<=', now()->subSeconds(7200))
            ->get();

        foreach ($expiredImports as $import) {
            $import->update([
                'status'        => 'failed',
                'error_message' => 'Tiến trình import bị hủy do worker bị gián đoạn quá lâu (hơn 2 giờ). Vui lòng import lại.',
            ]);

            // Xóa file tạm
            if (Storage::disk('local')->exists($import->file_path)) {
                Storage::disk('local')->delete($import->file_path);
            }

            Log::warning("cleanupStaleImports: Import #{$import->id} quá 2 giờ, đánh dấu failed.");
        }

        // 2. Khôi phục (re-dispatch), chỉ khi chắc chắn job không còn chạy:
        //    - pending > 30 giây: job chưa được worker nhận (job trùng sẽ bị chặn trong handle()).
        //    - processing > thời gian timeout của job: worker đã chết giữa chừng.
        $staleImports = self::where('updated_at', '>', now()->subSeconds(7200))
            ->where(function ($q) {
                $q->where(function ($q) {
                    $q->where('status', 'pending')->where('updated_at', '<=', now()->subSeconds(30));
                })->orWhere(function ($q) {
                    $q->where('status', 'processing')
                      ->where('updated_at', '<=', now()->subSeconds(3660)); // = ProcessExcelImport::$timeout (3600) + 60
                });
            })
            ->get();

        foreach ($staleImports as $import) {
            // Kiểm tra file tạm còn tồn tại không
            if (!Storage::disk('local')->exists($import->file_path)) {
                $import->update([
                    'status'        => 'failed',
                    'error_message' => 'File tạm đã bị xóa, không thể khôi phục. Vui lòng import lại.',
                ]);
                Log::warning("cleanupStaleImports: Import #{$import->id} file tạm không tồn tại, đánh dấu failed.");
                continue;
            }

            // Reset về pending và re-dispatch
            $import->update([
                'status'        => 'pending',
                'error_message' => null,
            ]);

            ProcessExcelImport::dispatch($import->id, $import->module)->onQueue('imports');
            Log::info("cleanupStaleImports: Import #{$import->id} đã được khôi phục và re-dispatch.");
        }
    }
}


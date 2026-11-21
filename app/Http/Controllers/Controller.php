<?php

namespace App\Http\Controllers;

use App\Exceptions\ResourceNotFoundException;
use App\Exceptions\ServiceException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Bus\DispatchesJobs;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;

class Controller extends BaseController
{
    use AuthorizesRequests, DispatchesJobs, ValidatesRequests;

    /**
     * Câu báo lỗi an toàn cho người dùng (#18).
     * Lỗi nghiệp vụ (câu tiếng Việt do service ném ra) được hiển thị nguyên văn;
     * lỗi hệ thống (SQL, đường dẫn file...) chỉ ghi log, người dùng thấy câu chung.
     */
    protected function thongBaoLoi(\Throwable $e, string $hanhDong): string
    {
        $laLoiNghiepVu = $e instanceof ServiceException
            || $e instanceof ResourceNotFoundException
            // service ném RuntimeException / Exception với câu cho người dùng; so đúng tên lớp
            // để QueryException, lỗi HTTP client... (lớp con) không lọt vào đây
            || in_array(get_class($e), [\RuntimeException::class, \Exception::class], true)
            || ($e instanceof ModelNotFoundException && strpos($e->getMessage(), 'No query results') !== 0);

        if ($laLoiNghiepVu) {
            return "{$hanhDong}: " . $e->getMessage();
        }
        if ($e instanceof ModelNotFoundException) {
            return $hanhDong;
        }

        report($e);
        return "{$hanhDong}. Vui lòng thử lại hoặc liên hệ quản trị viên.";
    }
}

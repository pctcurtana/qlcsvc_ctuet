<?php

namespace App\Services;

use App\Exceptions\ServiceException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\QueryException;
use Illuminate\Database\Query\Builder;

/**
 * Xóa cứng an toàn cho các thực thể có versioning (cơ sở, khu nhà, phòng, thiết bị):
 * chỉ xóa bản hiện hành, chưa có phiên bản cũ và không còn dữ liệu liên quan.
 */
class KiemTraXoa
{
    /** Mã lỗi MySQL: Cannot delete or update a parent row (foreign key constraint fails) */
    private const MYSQL_FK_RESTRICT = 1451;

    /**
     * @param Model  $record   Bản ghi cần xóa
     * @param string $ten      Tên hiển thị, vd: 'phòng "P101"'
     * @param array  $lienQuan Danh sách [nhãn, Builder, có versioning?]
     * @param string $goiY     Câu gợi ý thêm khi bị chặn
     *
     * @throws ServiceException
     */
    public static function xoa(Model $record, string $ten, array $lienQuan, string $goiY = ''): void
    {
        if ($record->trang_thai_du_lieu !== 'hien_hanh') {
            throw new ServiceException("Không thể xóa {$ten}: đây là bản lịch sử, chỉ xóa được bản ghi hiện hành.", 422);
        }

        $lyDo = [];
        if ($record->ban_ghi_goc_id) {
            $lyDo[] = 'đã có lịch sử phiên bản';
        }

        /** @var Builder $query */
        foreach ($lienQuan as [$nhan, $query, $coVersioning]) {
            if ($coVersioning) {
                $dem = (clone $query)
                    ->selectRaw("COUNT(*) AS tong, SUM(trang_thai_du_lieu <> 'hien_hanh') AS lich_su")
                    ->first();
                $tong = (int) $dem->tong;
                $lichSu = (int) $dem->lich_su;
            } else {
                $tong = $query->count();
                $lichSu = 0;
            }

            if ($tong > 0) {
                $lyDo[] = "còn {$tong} {$nhan}" . ($lichSu > 0 ? " (trong đó {$lichSu} bản lịch sử)" : '');
            }
        }

        if (!empty($lyDo)) {
            throw new ServiceException(
                "Không thể xóa {$ten}: " . implode(', ', $lyDo) . '.' . ($goiY ? " {$goiY}" : ''),
                422
            );
        }

        try {
            $record->delete();
        } catch (QueryException $e) {
            // Lưới an toàn: DB chặn bằng FK RESTRICT nếu phần kiểm tra ở trên bỏ sót
            if ((int) ($e->errorInfo[1] ?? 0) === self::MYSQL_FK_RESTRICT) {
                throw new ServiceException("Không thể xóa {$ten}: vẫn còn dữ liệu liên quan trong hệ thống.", 422, $e);
            }
            throw $e;
        }
    }
}

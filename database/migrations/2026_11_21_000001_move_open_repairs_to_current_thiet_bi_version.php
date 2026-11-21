<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Dữ liệu cũ: trước đây "Lưu phiên bản mới" bỏ lại báo cáo sự cố / phiếu sửa chữa đang mở
 * ở bản thiết bị cũ (không đóng được nữa). Chuyển chúng sang bản hiện hành cùng thiết bị.
 * Thiết bị đã ngừng sử dụng (không có bản hiện hành) giữ nguyên.
 */
class MoveOpenRepairsToCurrentThietBiVersion extends Migration
{
    public function up()
    {
        $this->chuyen('bao_cao_su_cos', ['yeu_cau_sua_chua', 'dang_sua_chua']);
        $this->chuyen('lich_su_bao_duongs', ['chua_thuc_hien', 'dang_thuc_hien']);
    }

    public function down()
    {
        // Không hoàn tác: dữ liệu sau khi chuyển mới là đúng nghiệp vụ.
    }

    private function chuyen(string $table, array $trangThaiMo): void
    {
        $placeholders = implode(',', array_fill(0, count($trangThaiMo), '?'));

        DB::update("
            UPDATE {$table} x
            JOIN thiet_bis cu  ON cu.id = x.thiet_bi_id AND cu.trang_thai_du_lieu = 'lich_su'
            JOIN thiet_bis moi ON moi.trang_thai_du_lieu = 'hien_hanh'
                AND COALESCE(moi.ban_ghi_goc_id, moi.id) = COALESCE(cu.ban_ghi_goc_id, cu.id)
            SET x.thiet_bi_id = moi.id
            WHERE x.trang_thai IN ({$placeholders})
        ", $trangThaiMo);
    }
}

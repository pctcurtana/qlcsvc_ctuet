<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Chặn xóa dây chuyền ở tầng DB: không cho xóa cơ sở / khu nhà / phòng / thiết bị
 * khi còn dữ liệu con hoặc dữ liệu liên quan (lớp bảo vệ cuối nếu code sót kiểm tra).
 */
class RestrictDeleteOnFacilityForeignKeys extends Migration
{
    /** [bảng, cột, bảng cha, hành vi ON DELETE cũ] */
    private $foreignKeys = [
        ['khu_nhas',           'co_so_id',    'co_sos',    'cascade'],
        ['phongs',             'khu_nha_id',  'khu_nhas',  'cascade'],
        ['thiet_bis',          'phong_id',    'phongs',    'set null'],
        ['bao_cao_su_cos',     'phong_id',    'phongs',    'cascade'],
        ['bao_cao_su_cos',     'thiet_bi_id', 'thiet_bis', 'set null'],
        ['lich_su_bao_duongs', 'thiet_bi_id', 'thiet_bis', 'cascade'],
    ];

    public function up()
    {
        foreach ($this->foreignKeys as [$table, $column, $parent]) {
            $this->replaceForeignKey($table, $column, $parent, 'restrict');
        }
    }

    public function down()
    {
        foreach ($this->foreignKeys as [$table, $column, $parent, $oldRule]) {
            $this->replaceForeignKey($table, $column, $parent, $oldRule);
        }
    }

    private function replaceForeignKey(string $table, string $column, string $parent, string $onDelete): void
    {
        Schema::table($table, function (Blueprint $t) use ($column, $parent, $onDelete) {
            $t->dropForeign([$column]);
            $t->foreign($column)->references('id')->on($parent)->onDelete($onDelete);
        });
    }
}

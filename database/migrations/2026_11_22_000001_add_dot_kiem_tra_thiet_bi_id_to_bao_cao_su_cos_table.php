<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * #15: báo cáo sự cố tự lưu đợt kiểm tra của phiếu đã sửa nó
 * (định kỳ → có đợt, đột xuất → null), thay vì đoán theo phiếu mới nhất của thiết bị.
 * Báo cáo cũ để null: không biết chắc lần sửa đó là định kỳ hay đột xuất.
 */
class AddDotKiemTraThietBiIdToBaoCaoSuCosTable extends Migration
{
    public function up()
    {
        Schema::table('bao_cao_su_cos', function (Blueprint $table) {
            $table->foreignId('dot_kiem_tra_thiet_bi_id')
                ->nullable()
                ->after('thiet_bi_id')
                ->constrained('dot_kiem_tra_thiet_bis')
                ->nullOnDelete();
        });
    }

    public function down()
    {
        Schema::table('bao_cao_su_cos', function (Blueprint $table) {
            $table->dropConstrainedForeignId('dot_kiem_tra_thiet_bi_id');
        });
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DotBaoCao extends Model
{
    use HasFactory;

    protected $table = 'dot_bao_caos';

    protected $fillable = [
        'ten_dot',
        'nam_hoc',
        'mo_ta',
        'ngay_tong_hop',
    ];

    protected $casts = [
        'ngay_tong_hop' => 'date',
    ];

    public function nguoiTao()
    {
        return $this->belongsTo(User::class, 'nguoi_tao_id');
    }

    public function bcLoaiPhongs()
    {
        return $this->hasMany(BcLoaiPhong::class, 'dot_bao_cao_id')->orderBy('thu_tu');
    }

    public function bcTieuChuanCsvcs()
    {
        return $this->hasMany(BcTieuChuanCsvc::class, 'dot_bao_cao_id')->orderBy('thu_tu');
    }

    public function bcKhuonViens()
    {
        return $this->hasMany(BcKhuonVien::class, 'dot_bao_cao_id')->orderBy('thu_tu');
    }

    public function bcCongTrinhDaoTaos()
    {
        return $this->hasMany(BcCongTrinhDaoTao::class, 'dot_bao_cao_id')->orderBy('thu_tu');
    }

    public function bcHaTangCntts()
    {
        return $this->hasMany(BcHaTangCntt::class, 'dot_bao_cao_id')->orderBy('thu_tu');
    }

    public function isCompleted()
    {
        return $this->trang_thai === 'completed';
    }
}

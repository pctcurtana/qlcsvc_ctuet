<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KhuNha extends Model
{
    use HasFactory;

    protected $table = 'khu_nhas';

    protected $fillable = [
        'co_so_id',
        'ma_khu_nha',
        'ten_khu_nha',
        'loai_khu_nha',
        'so_tang',
        'dien_tich_xay_dung',
        'tong_dien_tich_san',
        'he_so_su_dung_dao_tao',
        'dien_tich_san_dao_tao',
        'nam_xay_dung',
        'mo_ta',
        'trang_thai',
        // Versioning fields
        'trang_thai_du_lieu',
        'hieu_luc_tu',
        'hieu_luc_den',
        'phien_ban',
        'ban_ghi_goc_id',
    ];

    protected $casts = [
        'so_tang' => 'integer',
        'nam_xay_dung' => 'integer',
        'dien_tich_xay_dung' => 'decimal:2',
        'tong_dien_tich_san' => 'decimal:2',
        'he_so_su_dung_dao_tao' => 'decimal:1',
        'dien_tich_san_dao_tao' => 'decimal:2',
        'hieu_luc_tu' => 'datetime',
        'hieu_luc_den' => 'datetime',
        'phien_ban' => 'integer',
        'ban_ghi_goc_id' => 'integer',
    ];

    protected static function booted()
    {
        static::creating(function ($model) {
            if (empty($model->hieu_luc_tu)) {
                $model->hieu_luc_tu = now();
            }
        });
    }

    public function coSo()
    {
        return $this->belongsTo(CoSo::class, 'co_so_id');
    }

    public function phongs()
    {
        return $this->hasMany(Phong::class, 'khu_nha_id');
    }

    public function getTongSoPhongAttribute()
    {
        return $this->phongs()->count();
    }
}


<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CoSo extends Model
{
    use HasFactory;

    protected $table = 'co_sos';

    protected $fillable = [
        'ma_co_so',
        'ten_co_so',
        'dia_chi',
        'dien_tich_dat',
        'vi_tri_khuon_vien',
        'dien_tich_quy_doi',
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
        'dien_tich_dat' => 'decimal:2',
        'vi_tri_khuon_vien' => 'decimal:1',
        'dien_tich_quy_doi' => 'decimal:2',
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

    public function khuNhas()
    {
        return $this->hasMany(KhuNha::class, 'co_so_id');
    }

    public function getTongSoKhuNhaAttribute()
    {
        return $this->khuNhas()->count();
    }

    public function getTongSoPhongAttribute()
    {
        return Phong::whereHas('khuNha', function($query) {
            $query->where('co_so_id', $this->id);
        })->count();
    }
}


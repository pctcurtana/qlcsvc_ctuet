<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ThietBi extends Model
{
    use HasFactory, Concerns\CoPhienBan;

    protected $table = 'thiet_bis';

    protected $fillable = [
        'phong_id',
        'ma_thiet_bi',
        'serial_number',
        'ten_thiet_bi',
        'loai_thiet_bi',
        'hang_san_xuat',
        'model',
        'nam_san_xuat',
        'nam_mua',
        'ngay_mua',
        'ngay_bao_duong_cuoi',
        'chu_ky_bao_duong',
        'ngay_bao_duong_tiep_theo',
        'ghi_chu_bao_duong',
        'gia_tri',
        'so_luong',
        'don_vi_tinh',
        'thong_so_ky_thuat',
        'mo_ta',
        'trang_thai',
        // Versioning fields
        'trang_thai_du_lieu',
        'hieu_luc_tu',
        'hieu_luc_den',
        'phien_ban',
        'ban_ghi_goc_id',
        'qr_token',
    ];

    protected $casts = [
        'nam_san_xuat' => 'integer',
        'nam_mua' => 'integer',
        'ngay_mua' => 'date',
        'ngay_bao_duong_cuoi' => 'date',
        'chu_ky_bao_duong' => 'integer',
        'ngay_bao_duong_tiep_theo' => 'date',
        'gia_tri' => 'decimal:2',
        'so_luong' => 'integer',
        'hieu_luc_tu' => 'datetime',
        'hieu_luc_den' => 'datetime',
        'phien_ban' => 'integer',
        'ban_ghi_goc_id' => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->qr_token)) {
                $model->qr_token = (string) Str::uuid();
            }
            if (empty($model->hieu_luc_tu)) {
                $model->hieu_luc_tu = now();
            }
        });
    }

    public function phong()
    {
        return $this->belongsTo(Phong::class, 'phong_id');
    }

    // Mỗi thiết bị là 1 máy riêng biệt, so_luong luôn = 1
    // Không cần attribute tong_gia_tri nữa vì gia_tri = giá trị của máy đó

    public function lichSuBaoDuongs()
    {
        return $this->hasMany(LichSuBaoDuong::class, 'thiet_bi_id');
    }

    public function getCanBaoDuongAttribute()
    {
        if (!$this->ngay_bao_duong_tiep_theo) {
            return false;
        }
        return now()->greaterThanOrEqualTo($this->ngay_bao_duong_tiep_theo);
    }

    public function getSoNgayDenBaoDuongAttribute()
    {
        if (!$this->ngay_bao_duong_tiep_theo) {
            return null;
        }
        return now()->diffInDays($this->ngay_bao_duong_tiep_theo, false);
    }
}


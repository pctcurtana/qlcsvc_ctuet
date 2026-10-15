<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DotKiemTraThietBi extends Model
{
    use HasFactory;

    protected $table = 'dot_kiem_tra_thiet_bis';

    protected $fillable = [
        'ten_dot',
        'ngay_bat_dau',
        'ngay_ket_thuc',
        'mo_ta',
    ];

    protected $casts = [
        'ngay_bat_dau' => 'date',
        'ngay_ket_thuc' => 'date',
        'is_active' => 'boolean',
    ];
}

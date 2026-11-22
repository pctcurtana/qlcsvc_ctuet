<?php

namespace App\Notifications;

use App\Models\BaoCaoSuCo;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

/**
 * Thông báo có báo cáo sự cố mới: lưu DB (chuông) + broadcast qua kênh riêng App.Models.User.{id}.
 * Không ShouldQueue và broadcast chạy 'sync' (giống ImportProcessed/ThongKeUpdated) để production không cần queue worker.
 */
class BaoCaoSuCoMoi extends Notification
{
    /** @var BaoCaoSuCo */
    protected $baoCao;

    public function __construct(BaoCaoSuCo $baoCao)
    {
        $this->baoCao = $baoCao->loadMissing(['phong', 'thietBi']);
    }

    public function via($notifiable)
    {
        return ['database', 'broadcast'];
    }

    public function toArray($notifiable)
    {
        $bc = $this->baoCao;
        return [
            'bao_cao_id' => $bc->id,
            'mo_ta'      => Str::limit($bc->mo_ta_su_co, 120),
            'phong'      => optional($bc->phong)->ten_phong,
            'thiet_bi'   => optional($bc->thietBi)->ten_thiet_bi ?? 'Cơ sở vật chất khác',
            'muc_do'     => $bc->muc_do,
            'nguoi_bao'  => $bc->ten_nguoi_bao,
            'url'        => '/bao-cao-su-co',
        ];
    }

    public function toBroadcast($notifiable)
    {
        return (new BroadcastMessage($this->toArray($notifiable) + [
            'created_at' => now()->toIso8601String(),
        ]))->onConnection('sync');
    }
}

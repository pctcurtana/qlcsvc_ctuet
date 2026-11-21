<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;

/**
 * Model có lịch sử thay đổi (SCD type 2): mọi bản ghi của cùng một đối tượng
 * dùng chung ban_ghi_goc_id (bản đầu tiên có ban_ghi_goc_id = null, gốc là chính nó).
 */
trait CoPhienBan
{
    public function gocId(): int
    {
        return $this->ban_ghi_goc_id ?? $this->id;
    }

    /** Mọi phiên bản của cùng một đối tượng với $record. */
    public function scopeCungDoiTuong(Builder $query, self $record): Builder
    {
        $goc = $record->gocId();
        return $query->where(function ($q) use ($goc) {
            $q->where('id', $goc)->orWhere('ban_ghi_goc_id', $goc);
        });
    }

    /** Bản hiện hành của đối tượng này (null nếu đã ngừng sử dụng). */
    public function banHienHanh(): ?self
    {
        if ($this->trang_thai_du_lieu === 'hien_hanh') {
            return $this;
        }
        return static::cungDoiTuong($this)->where('trang_thai_du_lieu', 'hien_hanh')->first();
    }
}

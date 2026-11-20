<?php

namespace App\Http\Requests\BaoCaoSuCo;

use App\Models\Phong;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBaoCaoSuCoRequest extends FormRequest
{
    public function authorize()
    {
        return true; // Public form - no auth required
    }

    public function rules()
    {
        // ?? 0: where(..., null) sẽ thành whereNull và khớp thiết bị chưa gán phòng
        $phongId = Phong::where('qr_token', $this->route('token'))
            ->where('trang_thai_du_lieu', 'hien_hanh')
            ->value('id') ?? 0;

        return [
            'ten_nguoi_bao' => 'required|string|max:100',
            'so_dien_thoai' => 'nullable|string|max:20',
            // Thiết bị phải thuộc đúng phòng của mã QR và đang hiện hành
            'thiet_bi_id'   => [
                'nullable',
                'integer',
                Rule::exists('thiet_bis', 'id')
                    ->where('phong_id', $phongId)
                    ->where('trang_thai_du_lieu', 'hien_hanh'),
            ],
            'mo_ta_su_co'   => 'required|string|min:3|max:1000',
            'muc_do'        => 'required|in:thap,trung_binh,cao,khan_cap',
            // Honeypot — must be empty
            'website'       => 'max:0',
        ];
    }

    public function messages()
    {
        return [
            'ten_nguoi_bao.required' => 'Vui lòng nhập tên người báo cáo.',
            'mo_ta_su_co.required'   => 'Vui lòng mô tả sự cố.',
            'mo_ta_su_co.min'        => 'Mô tả quá ngắn, vui lòng nhập ít nhất 3 ký tự.',
            'muc_do.required'        => 'Vui lòng chọn mức độ nghiêm trọng.',
            'thiet_bi_id.integer'    => 'Thiết bị không hợp lệ.',
            'thiet_bi_id.exists'     => 'Thiết bị không hợp lệ.',
            'website.max'            => 'Phát hiện spam.',
        ];
    }

    public function attributes()
    {
        return [
            'ten_nguoi_bao' => 'Tên người báo cáo',
            'so_dien_thoai' => 'Số điện thoại',
            'mo_ta_su_co'   => 'Mô tả sự cố',
            'muc_do'        => 'Mức độ',
        ];
    }
}

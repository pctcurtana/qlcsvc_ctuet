<?php

namespace App\Http\Requests\LichSuBaoDuong;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLichSuBaoDuongRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'thiet_bi_id' => 'required|exists:thiet_bis,id',
            'ngay_bao_duong' => 'required|date|before_or_equal:today',
            'loai_bao_duong' => 'required|in:dinh_ky,sua_chua,thay_the',
            'noi_dung' => 'required|string',
            'chi_phi' => 'nullable|numeric|min:0',
            'nguoi_thuc_hien' => 'nullable|string',
            'don_vi_thuc_hien' => 'nullable|string',
            'ghi_chu' => 'nullable|string',
            'trang_thai' => 'required|in:hoan_thanh,dang_thuc_hien,chua_thuc_hien',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array
     */
    public function attributes()
    {
        return [
            'thiet_bi_id' => 'Thiết bị',
            'ngay_bao_duong' => 'Ngày bảo dưỡng',
            'loai_bao_duong' => 'Loại bảo dưỡng',
            'noi_dung' => 'Nội dung',
            'chi_phi' => 'Chi phí',
            'nguoi_thuc_hien' => 'Người thực hiện',
            'don_vi_thuc_hien' => 'Đơn vị thực hiện',
            'ghi_chu' => 'Ghi chú',
            'trang_thai' => 'Trạng thái',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array
     */
    public function messages()
    {
        return [
            'ngay_bao_duong.before_or_equal' => 'Ngày bảo dưỡng không được ở tương lai.',
            'thiet_bi_id.exists' => 'Thiết bị không tồn tại trong hệ thống.',
            'chi_phi.min' => 'Chi phí phải lớn hơn hoặc bằng 0.',
        ];
    }
}


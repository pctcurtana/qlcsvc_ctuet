<?php

namespace App\Services;

use App\Models\DotBaoCao;
use App\Models\BcLoaiPhong;
use App\Models\BcTieuChuanCsvc;
use App\Models\BcKhuonVien;
use App\Models\BcCongTrinhDaoTao;
use App\Models\BcHaTangCntt;
use Illuminate\Support\Facades\DB;

class BaoCaoBgdService
{
    /**
     * Tổng hợp toàn bộ báo cáo cho một đợt
     */
    public function tongHopBaoCao(DotBaoCao $dotBaoCao): void
    {
        DB::transaction(function () use ($dotBaoCao) {
            // Xóa dữ liệu cũ của đợt này
            $this->xoaDuLieuCu($dotBaoCao);

            // Tổng hợp từng loại báo cáo
            $this->tongHopLoaiPhong($dotBaoCao);
            $this->tongHopTieuChuanCsvc($dotBaoCao);
            $this->tongHopKhuonVien($dotBaoCao);
            $this->tongHopCongTrinhDaoTao($dotBaoCao);
            $this->tongHopHaTangCntt($dotBaoCao);

            // Cập nhật ngày tổng hợp và trạng thái
            $dotBaoCao->ngay_tong_hop = now();
            $dotBaoCao->trang_thai = 'completed';
            $dotBaoCao->save();
        });
    }

    /**
     * Xóa dữ liệu cũ của đợt báo cáo
     */
    private function xoaDuLieuCu(DotBaoCao $dotBaoCao): void
    {
        BcLoaiPhong::where('dot_bao_cao_id', $dotBaoCao->id)->delete();
        BcTieuChuanCsvc::where('dot_bao_cao_id', $dotBaoCao->id)->delete();
        BcKhuonVien::where('dot_bao_cao_id', $dotBaoCao->id)->delete();
        BcCongTrinhDaoTao::where('dot_bao_cao_id', $dotBaoCao->id)->delete();
        BcHaTangCntt::where('dot_bao_cao_id', $dotBaoCao->id)->delete();
    }

    /**
     * Báo cáo 1: Loại phòng phục vụ tuyển sinh
     */
    private function tongHopLoaiPhong(DotBaoCao $dotBaoCao): void
    {
        $thuTu = 0;

        // Lấy tổng phòng học các loại (mục 1)
        $tongPhongHoc = DB::table('phongs')
            ->where('trang_thai_du_lieu', 'hien_hanh')
            ->whereIn('loai_phong', ['phong_hoc', 'phong_lam_viec', 'phong_chuc_nang'])
            ->selectRaw('COUNT(*) as so_luong, SUM(dien_tich) as dien_tich')
            ->first();

        BcLoaiPhong::create([
            'dot_bao_cao_id' => $dotBaoCao->id,
            'stt' => '1',
            'loai_phong' => 'Hội trường, giảng đường, phòng học các loại, phòng đa năng, phòng làm việc của giáo sư, phó giáo sư, giảng viên của cơ sở đào tạo',
            'so_luong' => $tongPhongHoc->so_luong ?? 0,
            'dien_tich' => $tongPhongHoc->dien_tich ?? 0,
            'is_tong' => false,
            'thu_tu' => $thuTu++,
        ]);

        // 1.1 Hội trường, phòng học lớn trên 200 chỗ
        $phongLon200 = $this->demPhongTheoSucChua(200, null);
        BcLoaiPhong::create([
            'dot_bao_cao_id' => $dotBaoCao->id,
            'stt' => '1.1',
            'loai_phong' => 'Hội trường, phòng học lớn trên 200 chỗ',
            'so_luong' => $phongLon200['so_luong'],
            'dien_tich' => $phongLon200['dien_tich'],
            'is_tong' => false,
            'thu_tu' => $thuTu++,
        ]);

        // 1.2 Giảng đường từ 100 - 200 chỗ
        $giangDuong100_200 = $this->demPhongTheoSucChua(100, 200);
        BcLoaiPhong::create([
            'dot_bao_cao_id' => $dotBaoCao->id,
            'stt' => '1.2',
            'loai_phong' => 'Giảng đường từ 100 - 200 chỗ',
            'so_luong' => $giangDuong100_200['so_luong'],
            'dien_tich' => $giangDuong100_200['dien_tich'],
            'is_tong' => false,
            'thu_tu' => $thuTu++,
        ]);

        // 1.3 Phòng học từ 50 - 100 chỗ
        $phong50_100 = $this->demPhongTheoSucChua(50, 100);
        BcLoaiPhong::create([
            'dot_bao_cao_id' => $dotBaoCao->id,
            'stt' => '1.3',
            'loai_phong' => 'Phòng học từ 50 - 100 chỗ',
            'so_luong' => $phong50_100['so_luong'],
            'dien_tich' => $phong50_100['dien_tich'],
            'is_tong' => false,
            'thu_tu' => $thuTu++,
        ]);

        // 1.4 Số phòng dưới 50 chỗ
        $phongDuoi50 = $this->demPhongTheoSucChua(0, 50);
        BcLoaiPhong::create([
            'dot_bao_cao_id' => $dotBaoCao->id,
            'stt' => '1.4',
            'loai_phong' => 'Số phòng dưới 50 chỗ',
            'so_luong' => $phongDuoi50['so_luong'],
            'dien_tich' => $phongDuoi50['dien_tich'],
            'is_tong' => false,
            'thu_tu' => $thuTu++,
        ]);

        // 1.5 Số phòng học đa phương tiện
        $phongDaPhuongTien = DB::table('phongs')
            ->where('trang_thai_du_lieu', 'hien_hanh')
            ->where('loai_phong', 'phong_chuc_nang')
            ->selectRaw('COUNT(*) as so_luong, SUM(dien_tich) as dien_tich')
            ->first();
        BcLoaiPhong::create([
            'dot_bao_cao_id' => $dotBaoCao->id,
            'stt' => '1.5',
            'loai_phong' => 'Số phòng học đa phương tiện',
            'so_luong' => $phongDaPhuongTien->so_luong ?? 0,
            'dien_tich' => $phongDaPhuongTien->dien_tich ?? 0,
            'is_tong' => false,
            'thu_tu' => $thuTu++,
        ]);

        // 1.6 Phòng làm việc của giáo sư, phó giáo sư, giảng viên
        $phongLamViec = DB::table('phongs')
            ->where('trang_thai_du_lieu', 'hien_hanh')
            ->where('loai_phong', 'phong_lam_viec')
            ->selectRaw('COUNT(*) as so_luong, SUM(dien_tich) as dien_tich')
            ->first();
        BcLoaiPhong::create([
            'dot_bao_cao_id' => $dotBaoCao->id,
            'stt' => '1.6',
            'loai_phong' => 'Phòng làm việc của giáo sư, phó giáo sư, giảng viên của cơ sở đào tạo',
            'so_luong' => $phongLamViec->so_luong ?? 0,
            'dien_tich' => $phongLamViec->dien_tich ?? 0,
            'is_tong' => false,
            'thu_tu' => $thuTu++,
        ]);

        // 2. Thư viện, trung tâm học liệu
        $thuVien = DB::table('phongs')
            ->where('trang_thai_du_lieu', 'hien_hanh')
            ->where(function ($q) {
                $q->where('ten_phong', 'like', '%thư viện%')
                  ->orWhere('ten_phong', 'like', '%thu vien%')
                  ->orWhere('ten_phong', 'like', '%học liệu%');
            })
            ->selectRaw('COUNT(*) as so_luong, SUM(dien_tich) as dien_tich')
            ->first();
        BcLoaiPhong::create([
            'dot_bao_cao_id' => $dotBaoCao->id,
            'stt' => '2',
            'loai_phong' => 'Thư viện, trung tâm học liệu',
            'so_luong' => $thuVien->so_luong ?? 0,
            'dien_tich' => $thuVien->dien_tich ?? 0,
            'is_tong' => false,
            'thu_tu' => $thuTu++,
        ]);

        // 3. Trung tâm nghiên cứu, phòng thí nghiệm, thực nghiệm, cơ sở thực hành, thực tập, luyện tập
        $phongThiNghiem = DB::table('phongs')
            ->where('trang_thai_du_lieu', 'hien_hanh')
            ->whereIn('loai_phong', ['phong_thi_nghiem', 'phong_thuc_hanh'])
            ->selectRaw('COUNT(*) as so_luong, SUM(dien_tich) as dien_tich')
            ->first();
        BcLoaiPhong::create([
            'dot_bao_cao_id' => $dotBaoCao->id,
            'stt' => '3',
            'loai_phong' => 'Trung tâm nghiên cứu, phòng thí nghiệm, thực nghiệm, cơ sở thực hành, thực tập, luyện tập',
            'so_luong' => $phongThiNghiem->so_luong ?? 0,
            'dien_tich' => $phongThiNghiem->dien_tich ?? 0,
            'is_tong' => false,
            'thu_tu' => $thuTu++,
        ]);

        // Dòng TỔNG
        $tong = DB::table('phongs')
            ->where('trang_thai_du_lieu', 'hien_hanh')
            ->selectRaw('COUNT(*) as so_luong, SUM(dien_tich) as dien_tich')
            ->first();
        BcLoaiPhong::create([
            'dot_bao_cao_id' => $dotBaoCao->id,
            'stt' => '',
            'loai_phong' => 'TỔNG',
            'so_luong' => $tong->so_luong ?? 0,
            'dien_tich' => $tong->dien_tich ?? 0,
            'is_tong' => true,
            'thu_tu' => $thuTu++,
        ]);
    }

    /**
     * Helper: đếm phòng theo sức chứa
     */
    private function demPhongTheoSucChua(?int $min, ?int $max): array
    {
        $query = DB::table('phongs')
            ->where('trang_thai_du_lieu', 'hien_hanh')
            ->where('loai_phong', 'phong_hoc');

        if ($min !== null && $max !== null) {
            $query->whereBetween('suc_chua', [$min, $max]);
        } elseif ($min !== null) {
            $query->where('suc_chua', '>', $min);
        } elseif ($max !== null) {
            $query->where('suc_chua', '<', $max);
        }

        $result = $query->selectRaw('COUNT(*) as so_luong, COALESCE(SUM(dien_tich), 0) as dien_tich')->first();

        return [
            'so_luong' => $result->so_luong ?? 0,
            'dien_tich' => $result->dien_tich ?? 0,
        ];
    }

    /**
     * Báo cáo 2: Tiêu chuẩn 3 - Cơ sở vật chất
     */
    private function tongHopTieuChuanCsvc(DotBaoCao $dotBaoCao): void
    {
        $thuTu = 0;

        // 3.1 Diện tích đất/người học (m2) - để trống vì chưa có data sinh viên
        BcTieuChuanCsvc::create([
            'dot_bao_cao_id' => $dotBaoCao->id,
            'ma_chi_so' => '3.1',
            'chi_so_danh_gia' => 'Diện tích đất/người học (m2)',
            'nguong' => '',
            'thuc_te' => '',
            'ket_qua' => null,
            'giai_trinh' => null,
            'thu_tu' => $thuTu++,
        ]);

        // 3.2.1 Diện tích sàn xây dựng/người học (m2) - để trống
        BcTieuChuanCsvc::create([
            'dot_bao_cao_id' => $dotBaoCao->id,
            'ma_chi_so' => '3.2.1',
            'chi_so_danh_gia' => 'Diện tích sàn xây dựng/người học (m2)',
            'nguong' => '',
            'thuc_te' => '',
            'ket_qua' => null,
            'giai_trinh' => null,
            'thu_tu' => $thuTu++,
        ]);

        // 3.2.2 Tỉ lệ giảng viên có chỗ làm việc riêng biệt (%) - để trống
        BcTieuChuanCsvc::create([
            'dot_bao_cao_id' => $dotBaoCao->id,
            'ma_chi_so' => '3.2.2',
            'chi_so_danh_gia' => 'Tỉ lệ giảng viên có chỗ làm việc riêng biệt (%)',
            'nguong' => '',
            'thuc_te' => '',
            'ket_qua' => null,
            'giai_trinh' => null,
            'thu_tu' => $thuTu++,
        ]);

        // 3.3.1 Số đầu sách/ngành đào tạo - để trống
        BcTieuChuanCsvc::create([
            'dot_bao_cao_id' => $dotBaoCao->id,
            'ma_chi_so' => '3.3.1',
            'chi_so_danh_gia' => 'Số đầu sách/ngành đào tạo',
            'nguong' => '',
            'thuc_te' => '',
            'ket_qua' => null,
            'giai_trinh' => null,
            'thu_tu' => $thuTu++,
        ]);

        // 3.3.2 Số bản sách/người học - để trống
        BcTieuChuanCsvc::create([
            'dot_bao_cao_id' => $dotBaoCao->id,
            'ma_chi_so' => '3.3.2',
            'chi_so_danh_gia' => 'Số bản sách/người học',
            'nguong' => '',
            'thuc_te' => '',
            'ket_qua' => null,
            'giai_trinh' => null,
            'thu_tu' => $thuTu++,
        ]);

        // 3.4.1 Tỉ lệ học phần sẵn sàng giảng dạy trực tuyến (%) - để trống
        BcTieuChuanCsvc::create([
            'dot_bao_cao_id' => $dotBaoCao->id,
            'ma_chi_so' => '3.4.1',
            'chi_so_danh_gia' => 'Tỉ lệ học phần sẵn sàng giảng dạy trực tuyến (%)',
            'nguong' => '',
            'thuc_te' => '',
            'ket_qua' => null,
            'giai_trinh' => null,
            'thu_tu' => $thuTu++,
        ]);

        // 3.4.2 Tốc độ Internet/1.000 người học (Mbps) - để trống
        BcTieuChuanCsvc::create([
            'dot_bao_cao_id' => $dotBaoCao->id,
            'ma_chi_so' => '3.4.2',
            'chi_so_danh_gia' => 'Tốc độ Internet/1.000 người học (Mbps)',
            'nguong' => '',
            'thuc_te' => '',
            'ket_qua' => null,
            'giai_trinh' => null,
            'thu_tu' => $thuTu++,
        ]);
    }

    /**
     * Báo cáo 3A: Khuôn viên trụ sở chính và các phân hiệu
     */
    private function tongHopKhuonVien(DotBaoCao $dotBaoCao): void
    {
        $coSos = DB::table('co_sos')
            ->where('trang_thai_du_lieu', 'hien_hanh')
            ->orderBy('id')
            ->get();

        $thuTu = 0;
        $tongDienTichDat = 0;
        $tongDienTichQuyDoi = 0;

        foreach ($coSos as $coSo) {
            $dienTichQuyDoi = ($coSo->dien_tich_dat ?? 0) * ($coSo->vi_tri_khuon_vien ?? 1);
            $tongDienTichDat += $coSo->dien_tich_dat ?? 0;
            $tongDienTichQuyDoi += $dienTichQuyDoi;

            BcKhuonVien::create([
                'dot_bao_cao_id' => $dotBaoCao->id,
                'co_so_id' => $coSo->id,
                'ten_khuon_vien' => $coSo->ten_co_so ?? '',
                'ky_hieu' => $coSo->ma_co_so ?? '',
                'hinh_thuc_su_dung' => '',
                'dien_tich_dat' => $coSo->dien_tich_dat ?? 0,
                'vi_tri_khuon_vien' => $coSo->vi_tri_khuon_vien ?? 0,
                'dien_tich_quy_doi' => $dienTichQuyDoi,
                'dia_chi' => $coSo->dia_chi ?? '',
                'is_tong' => false,
                'thu_tu' => $thuTu++,
            ]);
        }

        // Dòng Tổng
        BcKhuonVien::create([
            'dot_bao_cao_id' => $dotBaoCao->id,
            'co_so_id' => null,
            'ten_khuon_vien' => 'Tổng',
            'ky_hieu' => '',
            'hinh_thuc_su_dung' => '',
            'dien_tich_dat' => $tongDienTichDat,
            'vi_tri_khuon_vien' => null,
            'dien_tich_quy_doi' => $tongDienTichQuyDoi,
            'dia_chi' => '',
            'is_tong' => true,
            'thu_tu' => $thuTu++,
        ]);
    }

    /**
     * Báo cáo 3B: Công trình phục vụ đào tạo
     */
    private function tongHopCongTrinhDaoTao(DotBaoCao $dotBaoCao): void
    {
        $khuNhas = DB::table('khu_nhas as kn')
            ->join('co_sos as cs', 'cs.id', '=', 'kn.co_so_id')
            ->where('kn.trang_thai_du_lieu', 'hien_hanh')
            ->select('kn.*', 'cs.ma_co_so', 'cs.dia_chi as dia_chi_co_so')
            ->orderBy('kn.id')
            ->get();

        $thuTu = 0;
        $stt = 1;
        $tongDienTichSan = 0;
        $tongDienTichDaoTao = 0;

        foreach ($khuNhas as $khuNha) {
            $dienTichSan = $khuNha->tong_dien_tich_san ?? 0;
            $dienTichDaoTao = $dienTichSan * ($khuNha->he_so_su_dung_dao_tao ?? 0);
            $tongDienTichSan += $dienTichSan;
            $tongDienTichDaoTao += $dienTichDaoTao;

            BcCongTrinhDaoTao::create([
                'dot_bao_cao_id' => $dotBaoCao->id,
                'khu_nha_id' => $khuNha->id,
                'stt' => $stt++,
                'ten_cong_trinh' => $khuNha->ten_khu_nha,
                'ky_hieu' => $khuNha->ma_khu_nha ?? '',
                'tong_dien_tich_san' => $dienTichSan,
                'he_so_dien_tich' => $khuNha->he_so_su_dung_dao_tao ?? 0,
                'dien_tich_san_dao_tao' => $dienTichDaoTao,
                'dia_chi' => $khuNha->dia_chi ?? $khuNha->dia_chi_co_so ?? '',
                'is_tong' => false,
                'thu_tu' => $thuTu++,
            ]);
        }

        // Dòng TỔNG SỐ
        BcCongTrinhDaoTao::create([
            'dot_bao_cao_id' => $dotBaoCao->id,
            'khu_nha_id' => null,
            'stt' => 0,
            'ten_cong_trinh' => 'TỔNG SỐ',
            'ky_hieu' => '',
            'tong_dien_tich_san' => $tongDienTichSan,
            'he_so_dien_tich' => null,
            'dien_tich_san_dao_tao' => $tongDienTichDaoTao,
            'dia_chi' => '',
            'is_tong' => true,
            'thu_tu' => $thuTu++,
        ]);
    }

    /**
     * Báo cáo 3D: Hạ tầng công nghệ thông tin
     */
    private function tongHopHaTangCntt(DotBaoCao $dotBaoCao): void
    {
        $thuTu = 0;

        // 1. Tốc độ hoặc băng thông đường truyền Internet (Mpbs) - để trống
        BcHaTangCntt::create([
            'dot_bao_cao_id' => $dotBaoCao->id,
            'stt' => 1,
            'chi_so_thong_ke' => 'Tốc độ hoặc băng thông đường truyền Internet (Mpbs)',
            'gia_tri' => null,
            'ghi_chu' => 'Đơn vị Mbps',
            'thu_tu' => $thuTu++,
        ]);

        // 2. Tổng số học phần giảng dạy trong năm học - để trống
        BcHaTangCntt::create([
            'dot_bao_cao_id' => $dotBaoCao->id,
            'stt' => 2,
            'chi_so_thong_ke' => 'Tổng số học phần giảng dạy trong năm học',
            'gia_tri' => null,
            'ghi_chu' => 'Tổng số học phần trong năm',
            'thu_tu' => $thuTu++,
        ]);

        // 3. Tổng số học phần sẵn sàng giảng dạy trực tuyến > 50% - để trống
        BcHaTangCntt::create([
            'dot_bao_cao_id' => $dotBaoCao->id,
            'stt' => 3,
            'chi_so_thong_ke' => 'Tổng số học phần sẵn sàng giảng dạy trực tuyến > 50%',
            'gia_tri' => null,
            'ghi_chu' => 'Số học phần Lý thuyết',
            'thu_tu' => $thuTu++,
        ]);
    }
}

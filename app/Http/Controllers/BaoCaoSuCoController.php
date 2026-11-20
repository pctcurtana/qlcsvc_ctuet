<?php

namespace App\Http\Controllers;

use App\Services\BaoCaoSuCoService;
use App\Services\LichSuBaoDuongService;
use App\Services\ThietBiService;
use App\Services\DotKiemTraThietBiService;
use App\Http\Requests\BaoCaoSuCo\StoreBaoCaoSuCoRequest;
use App\Exports\BaoCaoSuCoExport;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class BaoCaoSuCoController extends Controller
{
    protected $baoCaoService;
    protected $lichSuService;
    protected $thietBiService;
    protected $dotKiemTraService;

    public function __construct(
        BaoCaoSuCoService $baoCaoService,
        LichSuBaoDuongService $lichSuService,
        ThietBiService $thietBiService,
        DotKiemTraThietBiService $dotKiemTraService
    ) {
        $this->baoCaoService     = $baoCaoService;
        $this->lichSuService     = $lichSuService;
        $this->thietBiService    = $thietBiService;
        $this->dotKiemTraService = $dotKiemTraService;
    }

    // ─── Public: Room QR form ─────────────────────────────────────────────────

    public function showPhongForm(string $token)
    {
        $phong = $this->baoCaoService->getPhongByToken($token);

        if (!$phong) {
            abort(404, 'Phòng không tồn tại hoặc mã QR đã hết hiệu lực.');
        }

        return Inertia::render('BaoCao/PhongForm', [
            'phong' => $phong,
            'token' => $token,
        ]);
    }

    public function submitPhongForm(StoreBaoCaoSuCoRequest $request, string $token)
    {
        $phong = $this->baoCaoService->getPhongByToken($token);

        if (!$phong) {
            abort(404);
        }

        try {
            $this->baoCaoService->create(array_merge($request->validated(), [
                'phong_id'   => $phong->id,
                'ip_address' => $request->ip(),
                'trang_thai' => 'yeu_cau_sua_chua',
            ]));
        } catch (\RuntimeException $e) {
            return back()->withErrors(['thiet_bi_id' => $e->getMessage()]);
        }

        return back()->with('success', 'Báo cáo đã được ghi nhận. Cảm ơn bạn!');
    }

    // ─── Auth: Device QR quick-repair form (token-based) ─────────────────────

    public function showSuaChuaForm(string $token)
    {
        $banGhi = $this->thietBiService->findByQrTokenMoiTrangThai($token);
        if (!$banGhi) {
            abort(404, 'Không tìm thấy thiết bị với mã QR này.');
        }
        // QR của thiết bị đã ngừng sử dụng hoặc của phiên bản cũ (đã được thay)
        if ($banGhi->trang_thai_du_lieu !== 'hien_hanh') {
            return Inertia::render('BaoCao/ThietBiNgungSuDung', [
                'thietBi' => [
                    'ten_thiet_bi' => $banGhi->ten_thiet_bi,
                    'ma_thiet_bi'  => $banGhi->ma_thiet_bi,
                    'ngay_ngung'   => optional($banGhi->hieu_luc_den)->format('d/m/Y'),
                ],
            ]);
        }

        $thietBi = $this->thietBiService->getByQrToken($token);
        $soLanSuaChua = $this->lichSuService->countSuaChuaByThietBi($thietBi->id);
        $lichSuDangSua = $this->lichSuService->getDangThucHienByThietBi($thietBi->id);
        $coPhienDangSua = $this->baoCaoService->hasOpenReportForThietBi($thietBi->id);

        return Inertia::render('BaoCao/SuaChuaForm', [
            'thietBi'           => $thietBi,
            'soLanSuaChua'      => $soLanSuaChua,
            'token'             => $token,
            'lichSuDangSuaChua' => $lichSuDangSua,
            'coPhienDangSua'    => $coPhienDangSua,
        ]);
    }

    public function submitSuaChua(Request $request, string $token)
    {
        $thietBi = $this->thietBiService->getByQrToken($token);

        $validated = $request->validate([
            'hu_hong_mo_ta'  => 'required|string|min:5|max:500',
            'noi_dung'       => 'required|string|min:5|max:1000',
            'ngay_bao_duong' => 'required|date',
            'chi_phi'        => 'nullable|numeric|gte:0',
            'trang_thai'     => 'required|in:dang_sua_chua,hoan_thanh',
            'loai_bao_duong' => 'required|in:dinh_ky,sua_chua,thay_the',
            'hinh_thuc_sua_chua' => 'required|in:dot_xuat,dinh_ky_kiem_tra',
        ]);
        $dotKiemTraThietBiId = null;
        if ($validated['hinh_thuc_sua_chua'] === 'dinh_ky_kiem_tra') {
            $activeDot = $this->dotKiemTraService->getActiveDot();
            if (!$activeDot) {
                return back()->withErrors([
                    'hinh_thuc_sua_chua' => 'Hiện chưa có đợt quản lý active từ admin để ghi nhận sửa chữa định kỳ.',
                ])->withInput();
            }
            $dotKiemTraThietBiId = $activeDot->id;
        }

        $nguoiThucHien = auth()->user()->name ?? auth()->user()->email;

        $lichSuTrangThai = $validated['trang_thai'] === 'hoan_thanh' ? 'hoan_thanh' : 'dang_thuc_hien';
        $noiDungSuaChua = "Hư hỏng: {$validated['hu_hong_mo_ta']}\n\nSửa chữa: {$validated['noi_dung']}";
        $lichSuDangSua = $this->lichSuService->getDangThucHienByThietBi($thietBi->id);
        $chiPhi = array_key_exists('chi_phi', $validated) && $validated['chi_phi'] !== null
            ? (float) $validated['chi_phi']
            : 0;

        $payload = [
            'thiet_bi_id'     => $thietBi->id,
            'loai_bao_duong'  => $validated['loai_bao_duong'],
            'hinh_thuc_sua_chua' => $validated['hinh_thuc_sua_chua'],
            'dot_kiem_tra_thiet_bi_id'  => $dotKiemTraThietBiId,
            'ngay_bao_duong'  => $validated['ngay_bao_duong'],
            'noi_dung'        => $noiDungSuaChua,
            'chi_phi'         => $chiPhi,
            'nguoi_thuc_hien' => $nguoiThucHien,
            'trang_thai'      => $lichSuTrangThai,
            'ghi_chu'         => 'Ghi nhận qua QR code',
        ];

        if ($lichSuDangSua) {
            $this->lichSuService->update($lichSuDangSua->id, $payload);
        } else {
            $this->lichSuService->create($payload);
        }

        if ($validated['trang_thai'] === 'hoan_thanh') {
            $this->baoCaoService->completeReportsForDevice($thietBi->id, $nguoiThucHien);
        } else {
            $this->baoCaoService->updateReportsStatusForDevice($thietBi->id, 'dang_sua_chua', $nguoiThucHien);
        }

        $successMsg = $validated['trang_thai'] === 'hoan_thanh' 
            ? 'Ghi nhận sửa chữa hoàn thành!' 
            : 'Ghi nhận đang sửa chữa thành công!';

        return back()->with('success', $successMsg);
    }

    // ─── Admin: Incident report list ─────────────────────────────────────────

    public function index(Request $request)
    {
        $filters = $request->only(['search', 'phong_id', 'muc_do', 'trang_thai', 'dot_id', 'per_page']);
        $baoCaos = $this->baoCaoService->getAllPaginated($filters, (int)$request->input('per_page', 15));
        $stats   = $this->baoCaoService->getStats();
        $dots    = $this->dotKiemTraService->getAllForDropdown();

        return Inertia::render('BaoCaoSuCo/Index', [
            'baoCaos' => $baoCaos,
            'stats'   => $stats,
            'filters' => $filters,
            'dots'    => $dots,
        ]);
    }

    public function destroy(int $id)
    {
        $this->baoCaoService->delete($id);
        return back()->with('success', 'Đã xóa báo cáo!');
    }

    // ─── Export Excel ─────────────────────────────────────────────────────────

    public function export(Request $request)
    {
        $filters  = $request->only(['search', 'phong_id', 'muc_do', 'trang_thai', 'dot_id']);
        $data     = $this->baoCaoService->getAll($filters);

        $filename = 'BaoCaoSuCo_' . date('Ymd_His') . '.xlsx';

        return Excel::download(new BaoCaoSuCoExport($data), $filename);
    }
}

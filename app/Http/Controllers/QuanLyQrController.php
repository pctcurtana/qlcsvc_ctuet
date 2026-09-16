<?php

namespace App\Http\Controllers;

use App\Services\CoSoService;
use App\Services\KhuNhaService;
use App\Services\PhongService;
use App\Services\ThietBiService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class QuanLyQrController extends Controller
{
    protected $phongService;
    protected $thietBiService;
    protected $coSoService;
    protected $khuNhaService;

    public function __construct(
        PhongService $phongService,
        ThietBiService $thietBiService,
        CoSoService $coSoService,
        KhuNhaService $khuNhaService
    ) {
        $this->phongService   = $phongService;
        $this->thietBiService = $thietBiService;
        $this->coSoService    = $coSoService;
        $this->khuNhaService  = $khuNhaService;
    }

    public function index(Request $request)
    {
        $activeTab = $request->input('tab', 'phong');
        $perPage   = (int) $request->input('per_page', 10);

        // Filters chung cho cả 2 tab
        $filters = $request->only(['search', 'co_so_id', 'khu_nha_id', 'phong_id', 'per_page', 'tab']);

        // Phân trang phòng
        $phongFilters = $request->only(['search', 'co_so_id', 'khu_nha_id']);
        $phongs = $this->phongService->getQrPaginated(
            $activeTab === 'phong' ? $phongFilters : [],
            $activeTab === 'phong' ? $perPage : 10
        );

        // Phân trang thiết bị
        $tbFilters = $request->only(['search', 'co_so_id', 'khu_nha_id', 'phong_id']);
        $thietBis = $this->thietBiService->getQrPaginated(
            $activeTab === 'thiet-bi' ? $tbFilters : [],
            $activeTab === 'thiet-bi' ? $perPage : 10
        );

        // Danh sách cơ sở, khu nhà, phòng cho bộ lọc
        $coSos     = $this->coSoService->getActiveCoSos();
        $khuNhas   = $this->khuNhaService->getActiveKhuNhas();
        $phongsList = $this->phongService->getActivePhongs();

        $baseUrl = rtrim(config('app.url'), '/');

        return Inertia::render('QuanLyQr/Index', [
            'phongs'     => $phongs,
            'thietBis'   => $thietBis,
            'coSos'      => $coSos,
            'khuNhas'    => $khuNhas,
            'phongsList' => $phongsList,
            'baseUrl'    => $baseUrl,
            'filters'    => $filters,
            'activeTab'  => $activeTab,
        ]);
    }

    public function regeneratePhongQr(int $phong_id)
    {
        $this->phongService->regenerateQrToken($phong_id);

        return back()->with('success', 'Đã tạo lại mã QR cho phòng!');
    }

    public function regenerateThietBiQr(int $thiet_bi_id)
    {
        $this->thietBiService->regenerateQrToken($thiet_bi_id);

        return back()->with('success', 'Đã tạo lại mã QR cho thiết bị!');
    }
}

<?php

namespace App\Http\Controllers;

use App\Services\CoSoService;
use App\Services\PhongService;
use App\Services\ThietBiService;
use App\Services\ImportService;
use App\Http\Requests\ThietBi\StoreThietBiRequest;
use App\Http\Requests\ThietBi\UpdateThietBiRequest;
use App\Http\Requests\ThietBi\VersionUpdateThietBiRequest;
use App\Http\Requests\ImportRequest;
use App\Exports\Templates\ThietBiTemplate;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class ThietBiController extends Controller
{
    /**
     * @var ThietBiService
     */
    protected $thietBiService;

    /**
     * @var PhongService
     */
    protected $phongService;

    /**
     * @var CoSoService
     */
    protected $coSoService;

    /**
     * @var ImportService
     */
    protected $importService;

    /**
     * ThietBiController constructor.
     */
    public function __construct(
        ThietBiService $thietBiService,
        PhongService $phongService,
        CoSoService $coSoService,
        ImportService $importService
    ) {
        $this->thietBiService = $thietBiService;
        $this->phongService   = $phongService;
        $this->coSoService    = $coSoService;
        $this->importService  = $importService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $filters = $request->only(['search', 'phong_id', 'loai_thiet_bi', 'co_so_id', 'can_bao_duong', 'per_page']);
            $thietBis = $this->thietBiService->getAllPaginated($filters, $this->perPage(10));
            $phongs = $this->phongService->getActivePhongs();
            $coSos = $this->coSoService->getActiveCoSos();

            return Inertia::render('ThietBi/Index', [
                'thietBis' => $thietBis,
                'phongs' => $phongs,
                'coSos' => $coSos,
                'filters' => $filters,
            ]);
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $this->thongBaoLoi($e, 'Lỗi khi tải danh sách thiết bị'));
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        try {
            $phongs = $this->phongService->getActivePhongs();

            return Inertia::render('ThietBi/Create', [
                'phongs' => $phongs
            ]);
        } catch (\Throwable $e) {
            return redirect()->route('thiet-bi.index')->with('error', $this->thongBaoLoi($e, 'Lỗi khi tải trang tạo mới'));
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreThietBiRequest $request)
    {
        try {
            $this->thietBiService->create($request->validated());
            return redirect()->route('thiet-bi.index')->with('success', 'Thêm thiết bị thành công!');
        } catch (\Throwable $e) {
            return redirect()->back()->withInput()->with('error', $this->thongBaoLoi($e, 'Lỗi khi thêm thiết bị'));
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        try {
            $thietBi = $this->thietBiService->getById($id);
            $phongs = $this->phongService->getActivePhongs();
            $baseUrl = rtrim(config('app.url'), '/');

            return Inertia::render('ThietBi/Edit', [
                'thietBi' => $thietBi,
                'phongs' => $phongs,
                'baseUrl' => $baseUrl,
            ]);
        } catch (\Throwable $e) {
            return redirect()->route('thiet-bi.index')->with('error', $this->thongBaoLoi($e, 'Không tìm thấy thiết bị'));
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateThietBiRequest $request, $id)
    {
        try {
            $this->thietBiService->update($id, $request->validated());
            return redirect()->route('thiet-bi.index')->with('success', 'Cập nhật thiết bị thành công!');
        } catch (\Throwable $e) {
            return redirect()->back()->withInput()->with('error', $this->thongBaoLoi($e, 'Lỗi khi cập nhật thiết bị'));
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        try {
            $this->thietBiService->delete($id);
            return redirect()->route('thiet-bi.index')->with('success', 'Xóa thiết bị thành công!');
        } catch (\App\Exceptions\ServiceException | \Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        } catch (\Throwable $e) {
            report($e);
            return redirect()->back()->with('error', 'Có lỗi xảy ra khi xóa thiết bị. Vui lòng thử lại.');
        }
    }

    /**
     * Ngừng sử dụng thiết bị (chuyển sang lịch sử, không tạo phiên bản mới).
     */
    public function ngungSuDung($id)
    {
        try {
            $thietBi = $this->thietBiService->ngungSuDung($id);
            return redirect()->route('thiet-bi.index')
                ->with('success', "Đã ngừng sử dụng thiết bị \"{$thietBi->ma_thiet_bi}\".");
        } catch (\App\Exceptions\ServiceException | \Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        } catch (\Throwable $e) {
            report($e);
            return redirect()->back()->with('error', 'Có lỗi xảy ra khi ngừng sử dụng thiết bị. Vui lòng thử lại.');
        }
    }

    /**
     * Lưu phiên bản mới: lưu trữ dữ liệu cũ, tạo bản ghi mới với thay đổi.
     */
    public function versionUpdate(VersionUpdateThietBiRequest $request, $id)
    {
        try {
            $this->thietBiService->createNewVersion($id, $request->validated());
            return redirect()->route('thiet-bi.index')->with('success', 'Đã ghi nhận thay đổi của thiết bị (thông tin cũ đã được lưu vào lịch sử).');
        } catch (\Throwable $e) {
            return redirect()->back()->withInput()->with('error', $this->thongBaoLoi($e, 'Lỗi khi ghi nhận thay đổi'));
        }
    }

    /**
     * Hiển thị kho thiết bị (các thiết bị đã được thay thế bởi phiên bản mới)
     */
    public function kho(Request $request)
    {
        try {
            $filters = $request->only(['search', 'phong_id', 'ngay_vao_kho_tu', 'ngay_vao_kho_den', 'per_page']);
            $thietBis = $this->thietBiService->getKhoPaginated($filters, $this->perPage(15));
            $stats    = $this->thietBiService->getKhoStats();
            $phongs   = $this->phongService->getActivePhongs();

            return Inertia::render('ThietBi/Kho', [
                'thietBis' => $thietBis,
                'stats'    => $stats,
                'phongs'   => $phongs,
                'filters'  => $filters,
            ]);
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $this->thongBaoLoi($e, 'Lỗi khi tải kho thiết bị'));
        }
    }

    /**
     * Show form to duplicate an existing device
     */
    public function duplicate($id)
    {
        try {
            $thietBi = $this->thietBiService->getById($id);
            $phongs = $this->phongService->getActivePhongs();

            return Inertia::render('ThietBi/Duplicate', [
                'thietBi' => $thietBi,
                'phongs' => $phongs
            ]);
        } catch (\Throwable $e) {
            return redirect()->route('thiet-bi.index')->with('error', $this->thongBaoLoi($e, 'Không tìm thấy thiết bị'));
        }
    }

    /**
     * Xử lý import Excel cho Thiết bị.
     */
    public function import(ImportRequest $request)
    {
        try {
            $this->importService->startImport('thiet_bi', $request->file('file'));
            return redirect()->back()->with('success', 'Đang thực hiện import trong nền');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $this->thongBaoLoi($e, 'Lỗi khi import'));
        }
    }

    /**
     * Tải xuống file Excel template mẫu cho Thiết bị.
     */
    public function downloadTemplate()
    {
        return Excel::download(new ThietBiTemplate(), 'thiet_bi_import_template.xlsx');
    }
}

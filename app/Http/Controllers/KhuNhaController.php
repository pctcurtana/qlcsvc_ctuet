<?php

namespace App\Http\Controllers;

use App\Services\CoSoService;
use App\Services\KhuNhaService;
use App\Services\ImportService;
use App\Http\Requests\KhuNha\StoreKhuNhaRequest;
use App\Http\Requests\KhuNha\UpdateKhuNhaRequest;
use App\Http\Requests\KhuNha\VersionUpdateKhuNhaRequest;
use App\Http\Requests\ImportRequest;
use App\Exports\Templates\KhuNhaTemplate;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class KhuNhaController extends Controller
{
    /**
     * @var KhuNhaService
     */
    protected $khuNhaService;

    /**
     * @var CoSoService
     */
    protected $coSoService;

    /**
     * @var ImportService
     */
    protected $importService;

    public function __construct(
        KhuNhaService $khuNhaService,
        CoSoService $coSoService,
        ImportService $importService
    ) {
        $this->khuNhaService  = $khuNhaService;
        $this->coSoService    = $coSoService;
        $this->importService  = $importService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $filters = $request->only(['search', 'co_so_id', 'loai_khu_nha', 'per_page']);
            $khuNhas = $this->khuNhaService->getAllPaginated($filters, $this->perPage(10));
            $coSos = $this->coSoService->getActiveCoSos();

            return Inertia::render('KhuNha/Index', [
                'khuNhas' => $khuNhas,
                'coSos' => $coSos,
                'filters' => $filters,
            ]);
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $this->thongBaoLoi($e, 'Lỗi khi tải danh sách toà nhà'));
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        try {
            $coSos = $this->coSoService->getActiveCoSos();

            return Inertia::render('KhuNha/Create', [
                'coSos' => $coSos
            ]);
        } catch (\Throwable $e) {
            return redirect()->route('khu-nha.index')->with('error', $this->thongBaoLoi($e, 'Lỗi khi tải trang tạo mới'));
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreKhuNhaRequest $request)
    {
        try {
            $this->khuNhaService->create($request->validated());
            return redirect()->route('khu-nha.index')->with('success', 'Thêm toà nhà thành công!');
        } catch (\Throwable $e) {
            return redirect()->back()->withInput()->with('error', $this->thongBaoLoi($e, 'Lỗi khi thêm toà nhà'));
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        try {
            $khuNha = $this->khuNhaService->getById($id);
            $coSos = $this->coSoService->getActiveCoSos();

            return Inertia::render('KhuNha/Edit', [
                'khuNha' => $khuNha,
                'coSos' => $coSos
            ]);
        } catch (\Throwable $e) {
            return redirect()->route('khu-nha.index')->with('error', $this->thongBaoLoi($e, 'Không tìm thấy toà nhà'));
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateKhuNhaRequest $request, $id)
    {
        try {
            $this->khuNhaService->update($id, $request->validated());
            return redirect()->route('khu-nha.index')->with('success', 'Cập nhật toà nhà thành công!');
        } catch (\Throwable $e) {
            return redirect()->back()->withInput()->with('error', $this->thongBaoLoi($e, 'Lỗi khi cập nhật toà nhà'));
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        try {
            $this->khuNhaService->delete($id);
            return redirect()->route('khu-nha.index')->with('success', 'Xóa toà nhà thành công!');
        } catch (\App\Exceptions\ServiceException | \Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        } catch (\Throwable $e) {
            report($e);
            return redirect()->back()->with('error', 'Có lỗi xảy ra khi xóa toà nhà. Vui lòng thử lại.');
        }
    }

    /**
     * Lưu phiên bản mới: lưu trữ dữ liệu cũ, tạo bản ghi mới với thay đổi.
     */
    public function versionUpdate(VersionUpdateKhuNhaRequest $request, $id)
    {
        try {
            $this->khuNhaService->createNewVersion($id, $request->validated());
            return redirect()->route('khu-nha.index')->with('success', 'Đã ghi nhận thay đổi của toà nhà (thông tin cũ đã được lưu vào lịch sử).');
        } catch (\Throwable $e) {
            return redirect()->back()->withInput()->with('error', $this->thongBaoLoi($e, 'Lỗi khi ghi nhận thay đổi'));
        }
    }

    /**
     * Xử lý import Excel cho Khu nhà.
     */
    public function import(ImportRequest $request)
    {
        try {
            $this->importService->startImport('khu_nha', $request->file('file'));
            return redirect()->back()->with('success', 'Đã đưa file vào hàng đợi');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $this->thongBaoLoi($e, 'Lỗi khi import'));
        }
    }

    /**
     * Tải xuống file Excel template mẫu cho Khu nhà.
     */
    public function downloadTemplate()
    {
        return Excel::download(new KhuNhaTemplate(), 'toa_nha_import_template.xlsx');
    }
}

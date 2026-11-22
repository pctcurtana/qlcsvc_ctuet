<?php

namespace App\Http\Controllers;

use App\Services\KhuNhaService;
use App\Services\PhongService;
use App\Services\ImportService;
use App\Http\Requests\Phong\StorePhongRequest;
use App\Http\Requests\Phong\UpdatePhongRequest;
use App\Http\Requests\Phong\VersionUpdatePhongRequest;
use App\Http\Requests\ImportRequest;
use App\Exports\Templates\PhongTemplate;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class PhongController extends Controller
{
    /**
     * @var PhongService
     */
    protected $phongService;

    /**
     * @var KhuNhaService
     */
    protected $khuNhaService;

    /**
     * @var ImportService
     */
    protected $importService;

    /**
     * PhongController constructor.
     */
    public function __construct(
        PhongService $phongService,
        KhuNhaService $khuNhaService,
        ImportService $importService
    ) {
        $this->phongService   = $phongService;
        $this->khuNhaService  = $khuNhaService;
        $this->importService  = $importService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $filters = $request->only(['search', 'khu_nha_id', 'loai_phong', 'tang', 'per_page']);
            $phongs = $this->phongService->getAllPaginated($filters, $this->perPage(10));
            $khuNhas = $this->khuNhaService->getActiveKhuNhas();
            
            // Lấy danh sách tầng unique
            $danhSachTang = $this->phongService->getDistinctTang();

            return Inertia::render('Phong/Index', [
                'phongs' => $phongs,
                'khuNhas' => $khuNhas,
                'danhSachTang' => $danhSachTang,
                'filters' => $filters,
            ]);
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $this->thongBaoLoi($e, 'Lỗi khi tải danh sách phòng'));
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        try {
            $khuNhas = $this->khuNhaService->getActiveKhuNhas();

            return Inertia::render('Phong/Create', [
                'khuNhas' => $khuNhas
            ]);
        } catch (\Throwable $e) {
            return redirect()->route('phong.index')->with('error', $this->thongBaoLoi($e, 'Lỗi khi tải trang tạo mới'));
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePhongRequest $request)
    {
        try {
            $this->phongService->create($request->validated());
            return redirect()->route('phong.index')->with('success', 'Thêm phòng thành công!');
        } catch (\Throwable $e) {
            return redirect()->back()->withInput()->with('error', $this->thongBaoLoi($e, 'Lỗi khi thêm phòng'));
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        try {
            $phong = $this->phongService->getById($id);
            $khuNhas = $this->khuNhaService->getActiveKhuNhas();

            return Inertia::render('Phong/Edit', [
                'phong' => $phong,
                'khuNhas' => $khuNhas
            ]);
        } catch (\Throwable $e) {
            return redirect()->route('phong.index')->with('error', $this->thongBaoLoi($e, 'Không tìm thấy phòng'));
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePhongRequest $request, $id)
    {
        try {
            $this->phongService->update($id, $request->validated());
            return redirect()->route('phong.index')->with('success', 'Cập nhật phòng thành công!');
        } catch (\Throwable $e) {
            return redirect()->back()->withInput()->with('error', $this->thongBaoLoi($e, 'Lỗi khi cập nhật phòng'));
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        try {
            $this->phongService->delete($id);
            return redirect()->route('phong.index')->with('success', 'Xóa phòng thành công!');
        } catch (\App\Exceptions\ServiceException | \Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        } catch (\Throwable $e) {
            report($e);
            return redirect()->back()->with('error', 'Có lỗi xảy ra khi xóa phòng. Vui lòng thử lại.');
        }
    }

    /**
     * Ngừng sử dụng phòng (chuyển sang lịch sử, không tạo phiên bản mới).
     */
    public function ngungSuDung($id)
    {
        try {
            $phong = $this->phongService->ngungSuDung($id);
            return redirect()->route('phong.index')
                ->with('success', "Đã ngừng sử dụng phòng \"{$phong->ma_phong}\".");
        } catch (\App\Exceptions\ServiceException | \Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        } catch (\Throwable $e) {
            report($e);
            return redirect()->back()->with('error', 'Có lỗi xảy ra khi ngừng sử dụng phòng. Vui lòng thử lại.');
        }
    }

    /**
     * Lưu phiên bản mới: lưu trữ dữ liệu cũ, tạo bản ghi mới với thay đổi.
     */
    public function versionUpdate(VersionUpdatePhongRequest $request, $id)
    {
        try {
            $this->phongService->createNewVersion($id, $request->validated());
            return redirect()->route('phong.index')->with('success', 'Đã ghi nhận thay đổi của phòng (thông tin cũ đã được lưu vào lịch sử).');
        } catch (\Throwable $e) {
            return redirect()->back()->withInput()->with('error', $this->thongBaoLoi($e, 'Lỗi khi ghi nhận thay đổi'));
        }
    }

    /**
     * Xử lý import Excel cho Phòng.
     */
    public function import(ImportRequest $request)
    {
        try {
            $this->importService->startImport('phong', $request->file('file'));
            return redirect()->back()->with('success', 'Đang thực hiện import trong nền');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $this->thongBaoLoi($e, 'Lỗi khi import'));
        }
    }

    /**
     * Tải xuống file Excel template mẫu cho Phòng.
     */
    public function downloadTemplate()
    {
        return Excel::download(new PhongTemplate(), 'phong_import_template.xlsx');
    }
}

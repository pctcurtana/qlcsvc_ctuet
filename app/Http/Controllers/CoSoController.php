<?php

namespace App\Http\Controllers;

use App\Services\CoSoService;
use App\Services\ImportService;
use App\Http\Requests\CoSo\StoreCoSoRequest;
use App\Http\Requests\CoSo\UpdateCoSoRequest;
use App\Http\Requests\CoSo\VersionUpdateCoSoRequest;
use App\Http\Requests\ImportRequest;
use App\Exports\Templates\CoSoTemplate;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class CoSoController extends Controller
{
    /**
     * @var CoSoService
     */
    protected $coSoService;

    /**
     * @var ImportService
     */
    protected $importService;

    /**
     * CoSoController constructor.
     */
    public function __construct(CoSoService $coSoService, ImportService $importService)
    {
        $this->coSoService   = $coSoService;
        $this->importService = $importService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $filters = $request->only(['search', 'trang_thai', 'per_page']);
            $coSos = $this->coSoService->getAllPaginated($filters, $this->perPage(10));

            return Inertia::render('CoSo/Index', [
                'coSos' => $coSos,
                'filters' => $filters,
            ]);
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $this->thongBaoLoi($e, 'Lỗi khi tải danh sách cơ sở'));
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('CoSo/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreCoSoRequest $request)
    {
        try {
            $this->coSoService->create($request->validated());
            return redirect()->route('co-so.index')->with('success', 'Thêm cơ sở thành công!');
        } catch (\Throwable $e) {
            return redirect()->back()->withInput()->with('error', $this->thongBaoLoi($e, 'Lỗi khi thêm cơ sở'));
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        try {
            $coSo = $this->coSoService->getById($id);

            return Inertia::render('CoSo/Edit', [
                'coSo' => $coSo
            ]);
        } catch (\Throwable $e) {
            return redirect()->route('co-so.index')->with('error', $this->thongBaoLoi($e, 'Không tìm thấy cơ sở'));
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateCoSoRequest $request, $id)
    {
        try {
            $this->coSoService->update($id, $request->validated());
            return redirect()->route('co-so.index')->with('success', 'Cập nhật cơ sở thành công!');
        } catch (\Throwable $e) {
            return redirect()->back()->withInput()->with('error', $this->thongBaoLoi($e, 'Lỗi khi cập nhật cơ sở'));
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        try {
            $this->coSoService->delete($id);
            return redirect()->route('co-so.index')->with('success', 'Xóa cơ sở thành công!');
        } catch (\App\Exceptions\ServiceException | \App\Exceptions\ResourceNotFoundException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        } catch (\Throwable $e) {
            report($e);
            return redirect()->back()->with('error', 'Có lỗi xảy ra khi xóa cơ sở. Vui lòng thử lại.');
        }
    }

    /**
     * Lưu phiên bản mới: lưu trữ dữ liệu cũ, tạo bản ghi mới với thay đổi.
     */
    public function versionUpdate(VersionUpdateCoSoRequest $request, $id)
    {
        try {
            $this->coSoService->createNewVersion($id, $request->validated());
            return redirect()->route('co-so.index')->with('success', 'Đã ghi nhận thay đổi của cơ sở (thông tin cũ đã được lưu vào lịch sử).');
        } catch (\Throwable $e) {
            return redirect()->back()->withInput()->with('error', $this->thongBaoLoi($e, 'Lỗi khi ghi nhận thay đổi'));
        }
    }

    /**
     * Xử lý import Excel cho Cơ sở.
     */
    public function import(ImportRequest $request)
    {
        try {
            $this->importService->startImport('co_so', $request->file('file'));
            return redirect()->back()->with('success', 'Đang thực hiện import trong nền');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $this->thongBaoLoi($e, 'Lỗi khi import'));
        }
    }

    /**
     * Tải xuống file Excel template mẫu cho Cơ sở.
     */
    public function downloadTemplate()
    {
        return Excel::download(new CoSoTemplate(), 'co_so_import_template.xlsx');
    }
}


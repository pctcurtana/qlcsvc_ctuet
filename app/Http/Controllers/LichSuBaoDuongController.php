<?php

namespace App\Http\Controllers;

use App\Services\LichSuBaoDuongService;
use App\Services\ThietBiService;
use App\Http\Requests\LichSuBaoDuong\StoreLichSuBaoDuongRequest;
use App\Http\Requests\LichSuBaoDuong\UpdateLichSuBaoDuongRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LichSuBaoDuongController extends Controller
{
    /**
     * @var LichSuBaoDuongService
     */
    protected $lichSuBaoDuongService;

    /**
     * @var ThietBiService
     */
    protected $thietBiService;

    /**
     * LichSuBaoDuongController constructor.
     *
     * @param LichSuBaoDuongServiceInterface $lichSuBaoDuongService
     * @param ThietBiServiceInterface $thietBiService
     */
    public function __construct(
        LichSuBaoDuongService $lichSuBaoDuongService,
        ThietBiService $thietBiService
    ) {
        $this->lichSuBaoDuongService = $lichSuBaoDuongService;
        $this->thietBiService = $thietBiService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $filters = $request->only(['search', 'thiet_bi_id', 'loai_bao_duong', 'trang_thai', 'per_page']);
            $lichSuBaoDuongs = $this->lichSuBaoDuongService->getAllPaginated($filters, $this->perPage(10));

            // Thống kê cho KPI cards
            $stats = $this->lichSuBaoDuongService->getStats();

            return Inertia::render('LichSuBaoDuong/Index', [
                'lichSuBaoDuongs' => $lichSuBaoDuongs,
                'filters' => $filters,
                'stats' => $stats,
            ]);
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $this->thongBaoLoi($e, 'Lỗi khi tải danh sách lịch sử bảo dưỡng'));
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
        try {
            $thietBis = $this->thietBiService->getActiveThietBis();
            $thietBiId = $request->get('thiet_bi_id');

            return Inertia::render('LichSuBaoDuong/Create', [
                'thietBis' => $thietBis,
                'thietBiId' => $thietBiId,
            ]);
        } catch (\Throwable $e) {
            return redirect()->route('lich-su-bao-duong.index')->with('error', $this->thongBaoLoi($e, 'Lỗi khi tải trang tạo mới'));
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreLichSuBaoDuongRequest $request)
    {
        try {
            $this->lichSuBaoDuongService->create($request->validated());
            return redirect()->route('lich-su-bao-duong.index')->with('success', 'Thêm lịch sử bảo dưỡng thành công!');
        } catch (\Throwable $e) {
            return redirect()->back()->withInput()->with('error', $this->thongBaoLoi($e, 'Lỗi khi thêm lịch sử bảo dưỡng'));
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        try {
            $lichSuBaoDuong = $this->lichSuBaoDuongService->getById($id);
            $thietBis = $this->thietBiService->getActiveThietBis();

            // Phiếu cũ có thể gắn với bản thiết bị đã lưu lịch sử (không có trong danh sách hiện hành):
            // thêm vào để ô thiết bị hiện tên thay vì số ID (#38)
            $thietBiCuaPhieu = $lichSuBaoDuong->thietBi;
            if ($thietBiCuaPhieu && !$thietBis->contains('id', $thietBiCuaPhieu->id)) {
                $thietBis->prepend($thietBiCuaPhieu->loadMissing('phong'));
            }

            return Inertia::render('LichSuBaoDuong/Edit', [
                'lichSuBaoDuong' => $lichSuBaoDuong,
                'thietBis' => $thietBis,
            ]);
        } catch (\Throwable $e) {
            return redirect()->route('lich-su-bao-duong.index')->with('error', $this->thongBaoLoi($e, 'Không tìm thấy lịch sử bảo dưỡng'));
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateLichSuBaoDuongRequest $request, $id)
    {
        try {
            $this->lichSuBaoDuongService->update($id, $request->validated());
            return redirect()->route('lich-su-bao-duong.index')->with('success', 'Cập nhật lịch sử bảo dưỡng thành công!');
        } catch (\Throwable $e) {
            return redirect()->back()->withInput()->with('error', $this->thongBaoLoi($e, 'Lỗi khi cập nhật lịch sử bảo dưỡng'));
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        try {
            $this->lichSuBaoDuongService->delete($id);
            return redirect()->route('lich-su-bao-duong.index')->with('success', 'Xóa lịch sử bảo dưỡng thành công!');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $this->thongBaoLoi($e, 'Lỗi khi xóa lịch sử bảo dưỡng'));
        }
    }
}

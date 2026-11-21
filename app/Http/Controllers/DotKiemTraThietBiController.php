<?php

namespace App\Http\Controllers;

use App\Services\DotKiemTraThietBiService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DotKiemTraThietBiController extends Controller
{
    /**
     * @var DotKiemTraThietBiService
     */
    protected $dotKiemTraService;

    public function __construct(DotKiemTraThietBiService $dotKiemTraService)
    {
        $this->dotKiemTraService = $dotKiemTraService;
    }

    public function index(Request $request)
    {
        $filters = $request->only(['search', 'trang_thai', 'per_page']);
        $dotKiemTras = $this->dotKiemTraService->getAllPaginated($filters, (int)$request->input('per_page', 10));
        $stats = $this->dotKiemTraService->getStats();

        return Inertia::render('DotKiemTraThietBi/Index', [
            'dotKiemTras' => $dotKiemTras,
            'filters'     => $filters,
            'stats'       => $stats,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'ten_dot'       => 'required|string|max:255',
            'ngay_bat_dau'  => 'nullable|date',
            'ngay_ket_thuc' => 'nullable|date|after_or_equal:ngay_bat_dau',
            'mo_ta'         => 'nullable|string|max:2000',
            'is_active'     => 'nullable|boolean',
        ]);

        $this->dotKiemTraService->create($validated);

        return back()->with('success', 'Tạo đợt kiểm tra thiết bị thành công!');
    }

    public function activate($dotKiemTraThietBi)
    {
        $this->dotKiemTraService->activate($dotKiemTraThietBi);

        return back()->with('success', 'Đã kích hoạt đợt kiểm tra.');
    }

    public function destroy($dotKiemTraThietBi)
    {
        try {
            $this->dotKiemTraService->delete($dotKiemTraThietBi);
            return back()->with('success', 'Đã xóa đợt kiểm tra.');
        } catch (\RuntimeException $e) {
            return back()->with('error', $this->thongBaoLoi($e, 'Không thể xoá đợt kiểm tra'));
        }
    }
}

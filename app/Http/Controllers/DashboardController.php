<?php

namespace App\Http\Controllers;

use App\Services\ThongKeSnapshotService;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * @var ThongKeSnapshotService
     */
    protected $snapshotService;

    /**
     * DashboardController constructor.
     *
     * @param ThongKeSnapshotService $snapshotService
     */
    public function __construct(ThongKeSnapshotService $snapshotService)
    {
        $this->snapshotService = $snapshotService;
    }

    /**
     * Display the dashboard.
     *
     * Đọc dữ liệu từ snapshot. Nếu snapshot chưa từng khởi tạo,
     * service sẽ tự tính trực tiếp và lưu.
     * Nếu status = failed → trả value cũ (không query lại).
     */
    public function index()
    {
        try {
            $statistics = $this->snapshotService->getSnapshot('dashboard.overview');
            $thongKeLoaiPhong = $this->snapshotService->getSnapshot('dashboard.loai_phong');
            $thongKeLoaiThietBi = $this->snapshotService->getSnapshot('dashboard.loai_thiet_bi');
            $thongKeCoSo = $this->snapshotService->getSnapshot('dashboard.co_so');
            $thongKeTrangThaiPhong = $this->snapshotService->getSnapshot('dashboard.trang_thai_phong');

            return Inertia::render('Dashboard', [
                'statistics'          => $statistics ?? [],
                'thongKeLoaiPhong'    => $thongKeLoaiPhong ?? [],
                'thongKeLoaiThietBi'  => $thongKeLoaiThietBi ?? [],
                'thongKeCoSo'         => $thongKeCoSo ?? [],
                'thongKeTrangThaiPhong' => $thongKeTrangThaiPhong ?? [],
            ]);
        } catch (\Throwable $e) {
            // Không redirect()->back(): sau khi đăng nhập "trang trước" chính là dashboard → lặp vô hạn (#31)
            session()->now('error', $this->thongBaoLoi($e, 'Lỗi khi tải dashboard'));
            return Inertia::render('Dashboard', [
                'statistics'            => [],
                'thongKeLoaiPhong'      => [],
                'thongKeLoaiThietBi'    => [],
                'thongKeCoSo'           => [],
                'thongKeTrangThaiPhong' => [],
            ]);
        }
    }
}

<?php

namespace App\Http\Controllers;

use App\Services\ThongKeSnapshotService;
use App\Services\ThongKeService;
use App\Services\CoSoService;
use App\Services\KhuNhaService;
use App\Services\PhongService;
use Inertia\Inertia;
use Illuminate\Http\Request;

class ThongKeController extends Controller
{
    protected $snapshotService;
    protected $thongKeService;
    protected $coSoService;
    protected $khuNhaService;
    protected $phongService;

    public function __construct(
        ThongKeSnapshotService $snapshotService,
        ThongKeService $thongKeService,
        CoSoService $coSoService,
        KhuNhaService $khuNhaService,
        PhongService $phongService
    ) {
        $this->snapshotService = $snapshotService;
        $this->thongKeService  = $thongKeService;
        $this->coSoService     = $coSoService;
        $this->khuNhaService   = $khuNhaService;
        $this->phongService    = $phongService;
    }

    public function index()
    {
        try {
            // Danh sách cho filter dropdown — qua Service
            $danhSachCoSo   = $this->coSoService->getActiveCoSos();
            $danhSachKhuNha = $this->khuNhaService->getActiveKhuNhas();
            $danhSachPhong  = $this->phongService->getActivePhongs();

            // Đọc từ snapshot
            $thongKeCoSo = $this->snapshotService->getSnapshot('thongke.co_so');
            $thongKeKhuNha = $this->snapshotService->getSnapshot('thongke.khu_nha');
            $thongKePhong = $this->snapshotService->getSnapshot('thongke.phong');
            $thongKeThietBi = $this->snapshotService->getSnapshot('thongke.thiet_bi');

            return Inertia::render('ThongKe/Index', [
                'thongKeCoSo'    => $thongKeCoSo ?? [],
                'thongKeKhuNha'  => $thongKeKhuNha ?? [],
                'thongKePhong'   => $thongKePhong ?? [],
                'thongKeThietBi' => $thongKeThietBi ?? [],
                'danhSachCoSo'   => $danhSachCoSo,
                'danhSachKhuNha' => $danhSachKhuNha,
                'danhSachPhong'  => $danhSachPhong,
            ]);
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $this->thongBaoLoi($e, 'Lỗi khi tải thống kê'));
        }
    }

    /**
     * Lấy dữ liệu snapshot theo danh sách keys được truyền lên.
     */
    public function getSnapshots(Request $request)
    {
        try {
            $keysParam = $request->query('keys');
            $keys = [];
            if (is_string($keysParam)) {
                $keys = array_filter(explode(',', $keysParam));
            } elseif (is_array($keysParam)) {
                $keys = $keysParam;
            }

            if (empty($keys)) {
                $keys = ThongKeSnapshotService::ALL_KEYS;
            }

            $snapshots = $this->snapshotService->getSnapshots($keys);

            return response()->json([
                'success'   => true,
                'snapshots' => $snapshots,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $this->thongBaoLoi($e, 'Lỗi khi lấy snapshot'),
            ], 500);
        }
    }

    /**
     * Tính lại tất cả snapshot thống kê từ database gốc.
     */
    public function recalculate()
    {
        try {
            $this->snapshotService->recalculateAll();
            return response()->json([
                'success' => true,
                'message' => 'Đã tính lại toàn bộ thống kê thành công.',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $this->thongBaoLoi($e, 'Lỗi khi tính lại thống kê'),
            ], 500);
        }
    }

    /**
     * Phân trang chi tiết Phòng cho trang Thống kê.
     * GET /thong-ke/chi-tiet-phong
     */
    public function chiTietPhong(Request $request)
    {
        try {
            $filters = $request->only(['search', 'co_so_id', 'khu_nha_id']);
            $perPage = (int) $request->input('per_page', 10);

            $data = $this->thongKeService->paginateChiTietPhong($filters, $perPage);

            return response()->json($data);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $this->thongBaoLoi($e, 'Lỗi khi lấy chi tiết phòng'),
            ], 500);
        }
    }

    /**
     * Phân trang chi tiết Thiết bị cho trang Thống kê.
     * GET /thong-ke/chi-tiet-thiet-bi
     */
    public function chiTietThietBi(Request $request)
    {
        try {
            $filters = $request->only(['search', 'co_so_id', 'khu_nha_id', 'phong_id']);
            $perPage = (int) $request->input('per_page', 10);

            $data = $this->thongKeService->paginateChiTietThietBi($filters, $perPage);

            return response()->json($data);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $this->thongBaoLoi($e, 'Lỗi khi lấy chi tiết thiết bị'),
            ], 500);
        }
    }
}

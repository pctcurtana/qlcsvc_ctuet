<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\CoSoController;
use App\Http\Controllers\KhuNhaController;
use App\Http\Controllers\PhongController;
use App\Http\Controllers\ThietBiController;
use App\Http\Controllers\LichSuBaoDuongController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\ThongKeController;
use App\Http\Controllers\BaoCaoSuCoController;
use App\Http\Controllers\QuanLyQrController;
use App\Http\Controllers\DotKiemTraThietBiController;
use App\Http\Controllers\XuatBaoCaoController;
use App\Http\Controllers\AiInsightController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// ==================== Public QR Routes (no auth) ====================
Route::get('/bao-cao/phong/{token}', [BaoCaoSuCoController::class, 'showPhongForm'])
    ->name('bao-cao.phong.show');
Route::post('/bao-cao/phong/{token}', [BaoCaoSuCoController::class, 'submitPhongForm'])
    ->name('bao-cao.phong.submit')
    ->middleware('throttle:5,1');

// Auth Routes - Guest only
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
});

// Logout - Auth only
Route::post('/logout', [AuthController::class, 'logout'])->name('logout')->middleware('auth');

// Protected Routes - Require Authentication
Route::middleware('auth')->group(function () {
    // Dashboard
Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    // ==================== Quản lý Cơ sở ====================
    // Routes create phải đặt TRƯỚC routes có parameter {id}
    Route::middleware('permission:co-so,can_create')->group(function () {
        Route::get('/co-so/create', [CoSoController::class, 'create'])->name('co-so.create');
        Route::post('/co-so', [CoSoController::class, 'store'])->name('co-so.store');
    });
    Route::middleware('permission:co-so,can_import')->group(function () {
        Route::post('/co-so/import', [CoSoController::class, 'import'])->name('co-so.import');
        Route::get('/co-so/template', [CoSoController::class, 'downloadTemplate'])->name('co-so.template');
    });
    Route::middleware('permission:co-so,can_view')->group(function () {
        Route::get('/co-so', [CoSoController::class, 'index'])->name('co-so.index');
    });
    Route::middleware('permission:co-so,can_edit')->group(function () {
        Route::get('/co-so/{co_so}/edit', [CoSoController::class, 'edit'])->name('co-so.edit');
        Route::put('/co-so/{co_so}', [CoSoController::class, 'update'])->name('co-so.update');
        Route::post('/co-so/{co_so}/version-update', [CoSoController::class, 'versionUpdate'])->name('co-so.version-update');
    });
    Route::middleware('permission:co-so,can_delete')->group(function () {
        Route::delete('/co-so/{co_so}', [CoSoController::class, 'destroy'])->name('co-so.destroy');
    });

    // ==================== Quản lý Khu nhà ====================
    Route::middleware('permission:khu-nha,can_create')->group(function () {
        Route::get('/khu-nha/create', [KhuNhaController::class, 'create'])->name('khu-nha.create');
        Route::post('/khu-nha', [KhuNhaController::class, 'store'])->name('khu-nha.store');
    });
    Route::middleware('permission:khu-nha,can_import')->group(function () {
        Route::post('/khu-nha/import', [KhuNhaController::class, 'import'])->name('khu-nha.import');
        Route::get('/khu-nha/template', [KhuNhaController::class, 'downloadTemplate'])->name('khu-nha.template');
    });
    Route::middleware('permission:khu-nha,can_view')->group(function () {
        Route::get('/khu-nha', [KhuNhaController::class, 'index'])->name('khu-nha.index');
    });
    Route::middleware('permission:khu-nha,can_edit')->group(function () {
        Route::get('/khu-nha/{khu_nha}/edit', [KhuNhaController::class, 'edit'])->name('khu-nha.edit');
        Route::put('/khu-nha/{khu_nha}', [KhuNhaController::class, 'update'])->name('khu-nha.update');
        Route::post('/khu-nha/{khu_nha}/version-update', [KhuNhaController::class, 'versionUpdate'])->name('khu-nha.version-update');
    });
    Route::middleware('permission:khu-nha,can_delete')->group(function () {
        Route::delete('/khu-nha/{khu_nha}', [KhuNhaController::class, 'destroy'])->name('khu-nha.destroy');
    });

    // ==================== Quản lý Phòng ====================
    Route::middleware('permission:phong,can_create')->group(function () {
        Route::get('/phong/create', [PhongController::class, 'create'])->name('phong.create');
        Route::post('/phong', [PhongController::class, 'store'])->name('phong.store');
    });
    Route::middleware('permission:phong,can_import')->group(function () {
        Route::post('/phong/import', [PhongController::class, 'import'])->name('phong.import');
        Route::get('/phong/template', [PhongController::class, 'downloadTemplate'])->name('phong.template');
    });
    Route::middleware('permission:phong,can_view')->group(function () {
        Route::get('/phong', [PhongController::class, 'index'])->name('phong.index');
    });
    Route::middleware('permission:phong,can_edit')->group(function () {
        Route::get('/phong/{phong}/edit', [PhongController::class, 'edit'])->name('phong.edit');
        Route::put('/phong/{phong}', [PhongController::class, 'update'])->name('phong.update');
        Route::post('/phong/{phong}/version-update', [PhongController::class, 'versionUpdate'])->name('phong.version-update');
    });
    Route::middleware('permission:phong,can_delete')->group(function () {
        Route::delete('/phong/{phong}', [PhongController::class, 'destroy'])->name('phong.destroy');
    });

    // ==================== Quản lý Thiết bị ====================
    Route::middleware('permission:thiet-bi,can_create')->group(function () {
        Route::get('/thiet-bi/create', [ThietBiController::class, 'create'])->name('thiet-bi.create');
        Route::post('/thiet-bi', [ThietBiController::class, 'store'])->name('thiet-bi.store');
        Route::get('/thiet-bi/{thiet_bi}/duplicate', [ThietBiController::class, 'duplicate'])->name('thiet-bi.duplicate');
    });
    Route::middleware('permission:thiet-bi,can_import')->group(function () {
        Route::post('/thiet-bi/import', [ThietBiController::class, 'import'])->name('thiet-bi.import');
        Route::get('/thiet-bi/template', [ThietBiController::class, 'downloadTemplate'])->name('thiet-bi.template');
    });
    Route::middleware('permission:thiet-bi,can_view')->group(function () {
        Route::get('/thiet-bi', [ThietBiController::class, 'index'])->name('thiet-bi.index');
        Route::get('/thiet-bi-theo-phong', [ThietBiController::class, 'indexByPhong'])->name('thiet-bi.by-phong');
    });
    Route::middleware('permission:kho,can_view')->group(function () {
        Route::get('/kho', [ThietBiController::class, 'kho'])->name('kho.index');
    });
    Route::middleware('permission:thiet-bi,can_edit')->group(function () {
        Route::get('/thiet-bi/{thiet_bi}/edit', [ThietBiController::class, 'edit'])->name('thiet-bi.edit');
        Route::put('/thiet-bi/{thiet_bi}', [ThietBiController::class, 'update'])->name('thiet-bi.update');
        Route::post('/thiet-bi/{thiet_bi}/version-update', [ThietBiController::class, 'versionUpdate'])->name('thiet-bi.version-update');
    });
    Route::middleware('permission:thiet-bi,can_delete')->group(function () {
        Route::delete('/thiet-bi/{thiet_bi}', [ThietBiController::class, 'destroy'])->name('thiet-bi.destroy');
    });

    // ==================== Quản lý Lịch sử Bảo dưỡng ====================
    Route::middleware('permission:lich-su-bao-duong,can_create')->group(function () {
        Route::get('/lich-su-bao-duong/create', [LichSuBaoDuongController::class, 'create'])->name('lich-su-bao-duong.create');
        Route::post('/lich-su-bao-duong', [LichSuBaoDuongController::class, 'store'])->name('lich-su-bao-duong.store');
    });
    Route::middleware('permission:lich-su-bao-duong,can_view')->group(function () {
        Route::get('/lich-su-bao-duong', [LichSuBaoDuongController::class, 'index'])->name('lich-su-bao-duong.index');
Route::get('/thiet-bi/{thietBi}/lich-su-bao-duong', [LichSuBaoDuongController::class, 'show'])->name('thiet-bi.lich-su-bao-duong');
    });
    Route::middleware('permission:lich-su-bao-duong,can_edit')->group(function () {
        Route::get('/lich-su-bao-duong/{lich_su_bao_duong}/edit', [LichSuBaoDuongController::class, 'edit'])->name('lich-su-bao-duong.edit');
        Route::put('/lich-su-bao-duong/{lich_su_bao_duong}', [LichSuBaoDuongController::class, 'update'])->name('lich-su-bao-duong.update');
    });
    Route::middleware('permission:lich-su-bao-duong,can_delete')->group(function () {
        Route::delete('/lich-su-bao-duong/{lich_su_bao_duong}', [LichSuBaoDuongController::class, 'destroy'])->name('lich-su-bao-duong.destroy');
    });

    // ==================== Quản lý Người dùng ====================
    Route::middleware('permission:nguoi-dung,can_create')->group(function () {
        Route::get('/nguoi-dung/create', [UserController::class, 'create'])->name('nguoi-dung.create');
        Route::post('/nguoi-dung', [UserController::class, 'store'])->name('nguoi-dung.store');
    });
    Route::middleware('permission:nguoi-dung,can_view')->group(function () {
        Route::get('/nguoi-dung', [UserController::class, 'index'])->name('nguoi-dung.index');
    });
    Route::middleware('permission:nguoi-dung,can_edit')->group(function () {
        Route::get('/nguoi-dung/{nguoi_dung}/edit', [UserController::class, 'edit'])->name('nguoi-dung.edit');
        Route::put('/nguoi-dung/{nguoi_dung}', [UserController::class, 'update'])->name('nguoi-dung.update');
    });
    Route::middleware('permission:nguoi-dung,can_delete')->group(function () {
        Route::delete('/nguoi-dung/{nguoi_dung}', [UserController::class, 'destroy'])->name('nguoi-dung.destroy');
    });

    // ==================== Thống kê chi tiết ====================
    Route::get('/thong-ke/snapshots', [ThongKeController::class, 'getSnapshots'])->name('thong-ke.snapshots');
    Route::middleware('permission:thong-ke,can_view')->group(function () {
        Route::get('/thong-ke/chi-tiet-phong', [ThongKeController::class, 'chiTietPhong'])->name('thong-ke.chi-tiet-phong');
        Route::get('/thong-ke/chi-tiet-thiet-bi', [ThongKeController::class, 'chiTietThietBi'])->name('thong-ke.chi-tiet-thiet-bi');
        Route::get('/thong-ke', [ThongKeController::class, 'index'])->name('thong-ke.index');
        Route::post('/thong-ke/recalculate', [ThongKeController::class, 'recalculate'])->name('thong-ke.recalculate');
    });

    // ==================== Phản ứng nhanh QR ====================
    // Device QR repair form — uses qr_token (not numeric ID) to avoid guessing
    Route::get('/qr/thiet-bi/{token}', [BaoCaoSuCoController::class, 'showSuaChuaForm'])->name('sua-chua.show');
    Route::post('/qr/thiet-bi/{token}', [BaoCaoSuCoController::class, 'submitSuaChua'])->name('sua-chua.submit');

    // Admin: Báo cáo sự cố
    Route::middleware('permission:bao-cao-su-co,can_view')->group(function () {
        Route::get('/bao-cao-su-co', [BaoCaoSuCoController::class, 'index'])->name('bao-cao-su-co.index');
    });
    Route::middleware('permission:bao-cao-su-co,can_delete')->group(function () {
        Route::delete('/bao-cao-su-co/{id}', [BaoCaoSuCoController::class, 'destroy'])->name('bao-cao-su-co.destroy');
    });
    Route::middleware('permission:bao-cao-su-co,can_export')->group(function () {
        Route::get('/bao-cao-su-co/export', [BaoCaoSuCoController::class, 'export'])->name('bao-cao-su-co.export');
    });

    // Admin: Quản lý Mã QR
    Route::middleware('permission:quan-ly-qr,can_view')->group(function () {
        Route::get('/quan-ly-qr', [QuanLyQrController::class, 'index'])->name('quan-ly-qr.index');
    });
    Route::middleware('permission:quan-ly-qr,can_regenerate_qr')->group(function () {
        Route::post('/quan-ly-qr/phong/{phong_id}/regenerate', [QuanLyQrController::class, 'regeneratePhongQr'])->name('quan-ly-qr.regenerate-phong');
        Route::post('/quan-ly-qr/thiet-bi/{thiet_bi_id}/regenerate', [QuanLyQrController::class, 'regenerateThietBiQr'])->name('quan-ly-qr.regenerate-thiet-bi');
    });

    // Admin: Đợt kiểm tra thiết bị
    Route::middleware('permission:dot-kiem-tra-thiet-bi,can_view')->group(function () {
        Route::get('/dot-kiem-tra-thiet-bi', [DotKiemTraThietBiController::class, 'index'])->name('dot-kiem-tra-thiet-bi.index');
    });
    Route::middleware('permission:dot-kiem-tra-thiet-bi,can_create')->group(function () {
        Route::post('/dot-kiem-tra-thiet-bi', [DotKiemTraThietBiController::class, 'store'])->name('dot-kiem-tra-thiet-bi.store');
    });
    Route::middleware('permission:dot-kiem-tra-thiet-bi,can_edit')->group(function () {
        Route::post('/dot-kiem-tra-thiet-bi/{dotKiemTraThietBi}/activate', [DotKiemTraThietBiController::class, 'activate'])->name('dot-kiem-tra-thiet-bi.activate');
    });
    Route::middleware('permission:dot-kiem-tra-thiet-bi,can_delete')->group(function () {
        Route::delete('/dot-kiem-tra-thiet-bi/{dotKiemTraThietBi}', [DotKiemTraThietBiController::class, 'destroy'])->name('dot-kiem-tra-thiet-bi.destroy');
    });

    // ==================== Phân quyền ====================
    Route::middleware('permission:phan-quyen,can_view')->group(function () {
        Route::get('/phan-quyen', [PermissionController::class, 'index'])->name('phan-quyen.index');
        Route::get('/phan-quyen/{user}/permissions', [PermissionController::class, 'getUserPermissions'])->name('phan-quyen.get');
    });
    Route::middleware('permission:phan-quyen,can_edit')->group(function () {
        Route::post('/phan-quyen/{user}/permissions', [PermissionController::class, 'updateUserPermissions'])->name('phan-quyen.update');
    });

    // ==================== Xuất báo cáo BGD ====================
    Route::middleware('permission:xuat-bao-cao,can_view')->group(function () {
        Route::get('/xuat-bao-cao', [XuatBaoCaoController::class, 'index'])->name('xuat-bao-cao.index');
        Route::get('/xuat-bao-cao/{dotBaoCao}', [XuatBaoCaoController::class, 'show'])->name('xuat-bao-cao.show');
    });
    Route::middleware('permission:xuat-bao-cao,can_create')->group(function () {
        Route::post('/xuat-bao-cao', [XuatBaoCaoController::class, 'store'])->name('xuat-bao-cao.store');
        Route::post('/xuat-bao-cao/{dotBaoCao}/tong-hop', [XuatBaoCaoController::class, 'tongHop'])->name('xuat-bao-cao.tong-hop');
    });
    Route::middleware('permission:xuat-bao-cao,can_export')->group(function () {
        Route::get('/xuat-bao-cao/{dotBaoCao}/export', [XuatBaoCaoController::class, 'export'])->name('xuat-bao-cao.export');
    });
    Route::middleware('permission:xuat-bao-cao,can_delete')->group(function () {
        Route::delete('/xuat-bao-cao/{dotBaoCao}', [XuatBaoCaoController::class, 'destroy'])->name('xuat-bao-cao.destroy');
    });

    // ==================== AI Insight ====================
    Route::post('/ai/insight', [AiInsightController::class, 'generate'])->name('ai.insight');

    // ==================== Import Kết quả & Chi tiết ====================
    Route::get('/imports/status', [\App\Http\Controllers\ImportController::class, 'status'])->name('imports.status');
    Route::get('/imports', [\App\Http\Controllers\ImportController::class, 'index'])->name('imports.index');
    Route::get('/imports/latest', [\App\Http\Controllers\ImportController::class, 'latest'])->name('imports.latest');
    Route::get('/imports/{import}', [\App\Http\Controllers\ImportController::class, 'show'])->name('imports.show');
});

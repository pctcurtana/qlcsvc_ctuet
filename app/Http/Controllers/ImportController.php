<?php

namespace App\Http\Controllers;

use App\Models\Import;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ImportController extends Controller
{
    /**
     * Kiểm tra xem hệ thống có lượt import nào đang ở trạng thái pending hoặc processing không.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function status()
    {
        Import::cleanupStaleImports();

        $user = Auth::user();
        $query = Import::whereIn('status', ['pending', 'processing']);

        // Non-admin users can only see their own imports
        if (!$user->isAdmin()) {
            $query->where('user_id', $user->id);
        }

        $active = $query->latest()->first();

        return response()->json([
            'has_active'    => !is_null($active),
            'active_import' => $active,
        ]);
    }

    /**
     * Lấy danh sách các lượt import gần đây của user hiện tại.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        Import::cleanupStaleImports();

        $module = $request->query('module');
        $userId = Auth::id();

        $query = Import::where('user_id', $userId);
        if ($module) {
            $query->where('module', $module);
        }

        $imports = $query->orderBy('created_at', 'desc')->take(20)->get();

        return response()->json($imports);
    }

    /**
     * Lấy kết quả chi tiết của 1 lượt import.
     *
     * Chỉ cho phép người thực hiện import hoặc Admin xem.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        $import = Import::findOrFail($id);
        $user = Auth::user();

        // Kiểm tra quyền truy cập: chỉ chính người tạo import hoặc Admin được xem
        if ($user->id !== $import->user_id && !$user->isAdmin()) {
            return response()->json([
                'message' => 'Bạn không có quyền xem kết quả import này.'
            ], 403);
        }

        return response()->json($import);
    }

    /**
     * Lấy kết quả import mới nhất theo module của user hiện tại.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function latest(Request $request)
    {
        $module = $request->query('module');
        $userId = Auth::id();

        $query = Import::where('user_id', $userId);
        if ($module) {
            $query->where('module', $module);
        }

        $latest = $query->latest()->first();

        return response()->json($latest);
    }
}

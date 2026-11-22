<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

/**
 * Chuông thông báo: chỉ đọc / đánh dấu thông báo của chính người đang đăng nhập.
 */
class ThongBaoController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'chuaDoc' => $user->unreadNotifications()->count(),
            'items'   => $user->notifications()->latest()->limit(10)->get()
                ->map(function ($n) {
                    return [
                        'id'         => $n->id,
                        'data'       => $n->data,
                        'read_at'    => $n->read_at,
                        'created_at' => $n->created_at->toIso8601String(),
                    ];
                }),
        ]);
    }

    public function daDoc(Request $request, string $id)
    {
        // Lọc qua quan hệ của user: không đánh dấu được thông báo của người khác
        $request->user()->notifications()->whereKey($id)->firstOrFail()->markAsRead();

        return response()->json(['chuaDoc' => $request->user()->unreadNotifications()->count()]);
    }

    public function daDocTatCa(Request $request)
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return response()->json(['chuaDoc' => 0]);
    }
}

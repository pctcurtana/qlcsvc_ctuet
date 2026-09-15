<?php

namespace App\Http\Controllers;

use App\Services\AiInsightService;
use Illuminate\Http\Request;

class AiInsightController extends Controller
{
    /**
     * @var AiInsightService
     */
    protected $aiInsightService;

    /**
     * AiInsightController constructor.
     *
     * @param AiInsightService $aiInsightService
     */
    public function __construct(AiInsightService $aiInsightService)
    {
        $this->aiInsightService = $aiInsightService;
    }

    /**
     * Phân tích dữ liệu biểu đồ bằng AI.
     *
     * POST /ai/insight
     */
    public function generate(Request $request)
    {
        try {
            $validated = $request->validate([
                'chartTitle'   => 'required|string|max:255',
                'chartType'    => 'required|string|max:50',
                'currentData'  => 'required|array',
                'previousData' => 'nullable|array',
                'filters'      => 'nullable|array',
            ]);

            $insight = $this->aiInsightService->generateInsight(
                $validated['chartTitle'],
                $validated['chartType'],
                $validated['currentData'],
                $validated['previousData'] ?? null,
                $validated['filters'] ?? null
            );

            return response()->json([
                'success' => true,
                'insight' => $insight,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ.',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Lỗi khi phân tích dữ liệu.',
            ], 500);
        }
    }
}

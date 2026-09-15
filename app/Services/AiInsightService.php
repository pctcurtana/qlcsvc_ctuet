<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiInsightService
{
    /**
     * Gemini API endpoint
     */
    protected $apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent';

    /**
     * Gọi Gemini API để phân tích dữ liệu biểu đồ.
     *
     * @param string $chartTitle  Tiêu đề biểu đồ
     * @param string $chartType   Loại biểu đồ (bar, pie, donut, radial, area, line)
     * @param array  $currentData Dữ liệu hiện tại đang hiển thị
     * @param array|null $previousData Dữ liệu kỳ trước (nếu có)
     * @param array|null $filters Bộ lọc đang áp dụng (nếu có)
     * @return string Đoạn insight bằng tiếng Việt
     *
     * @throws \Exception Khi không thể gọi API hoặc API trả lỗi
     */
    public function generateInsight(
        string $chartTitle,
        string $chartType,
        array $currentData,
        ?array $previousData = null,
        ?array $filters = null
    ): string {
        $apiKey = config('services.gemini.api_key');

        if (empty($apiKey)) {
            throw new \Exception('Chưa cấu hình AI API.');
        }

        $prompt = $this->buildPrompt($chartTitle, $chartType, $currentData, $previousData, $filters);

        $response = Http::timeout(30)->post("{$this->apiUrl}?key={$apiKey}", [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $prompt],
                    ],
                ],
            ],
            'generationConfig' => [
                'temperature'     => 0.5,
                'maxOutputTokens' => 3000,
                'topP'            => 0.9,
            ],
        ]);

        if ($response->failed()) {
            Log::error('Gemini API error', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
            throw new \Exception('Không thể kết nối đến AI. Vui lòng thử lại sau.');
        }

        $body = $response->json();

        $text = $body['candidates'][0]['content']['parts'][0]['text'] ?? null;

        if (empty($text)) {
            throw new \Exception('AI không trả về kết quả phân tích. Vui lòng thử lại');
        }

        return trim($text);
    }

    /**
     * Xây dựng prompt gửi lên Gemini.
     */
    protected function buildPrompt(
        string $chartTitle,
        string $chartType,
        array $currentData,
        ?array $previousData,
        ?array $filters
    ): string {
        $dataJson = json_encode($currentData, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

        $prompt = <<<PROMPT
Bạn là chuyên gia phân tích dữ liệu cơ sở vật chất giáo dục. Hãy phân tích dữ liệu biểu đồ sau và đưa ra nhận xét.

Tiêu đề biểu đồ: {$chartTitle}
Loại biểu đồ: {$chartType}

Dữ liệu hiện tại:
{$dataJson}
PROMPT;

        if (!empty($previousData)) {
            $prevJson = json_encode($previousData, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
            $prompt .= <<<PROMPT


Dữ liệu kỳ trước (để so sánh):
{$prevJson}
PROMPT;
        }

        if (!empty($filters)) {
            $filterJson = json_encode($filters, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
            $prompt .= <<<PROMPT


Bộ lọc đang áp dụng:
{$filterJson}
PROMPT;
        }

        $prompt .= <<<PROMPT


Yêu cầu:
- Phân tích khách quan, ngắn gọn trong 1-2 câu bằng tiếng Việt
- Nêu rõ điểm nổi bật nhất trong dữ liệu
- Nếu có dữ liệu kỳ trước, hãy so sánh và nhận xét xu hướng
- Cảnh báo nếu thật sự có phát hiện bất thường 
- Có thể đề xuất 1 hành động cụ thể ngắn gọn nếu phân tích thực sự cho thấy vấn đề cần xử lý
- CHỈ trả về nội dung phân tích, KHÔNG giải thích thêm, KHÔNG lặp lại dữ liệu, và tuyệt đối không được bịa ra hoặc thông tin sai số liệu đã có sẵn


PROMPT;

        return $prompt;
    }
}

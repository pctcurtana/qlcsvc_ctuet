import { useState, useCallback } from 'react';

/**
 * Custom hook quản lý state và logic gọi AI Insight API.
 *
 * @returns {{
 *   loading: boolean,
 *   insight: string|null,
 *   error: string|null,
 *   visible: boolean,
 *   fetchInsight: Function,
 *   close: Function,
 * }}
 */
const useAiInsight = () => {
    const [loading, setLoading] = useState(false);
    const [insight, setInsight] = useState(null);
    const [error, setError] = useState(null);
    const [visible, setVisible] = useState(false);

    /**
     * Gọi API phân tích AI Insight.
     *
     * @param {object} params
     * @param {string} params.chartTitle  - Tiêu đề biểu đồ
     * @param {string} params.chartType   - Loại biểu đồ (bar, pie, donut, radial, area, line)
     * @param {Array}  params.currentData - Dữ liệu hiện tại
     * @param {Array}  [params.previousData] - Dữ liệu kỳ trước
     * @param {object} [params.filters] - Bộ lọc đang áp dụng
     */
    const fetchInsight = useCallback(async ({ chartTitle, chartType, currentData, previousData, filters }) => {
        setLoading(true);
        setError(null);
        setInsight(null);
        setVisible(true);

        try {
            const res = await window.axios.post('/ai/insight', {
                chartTitle,
                chartType,
                currentData,
                previousData: previousData || null,
                filters: filters || null,
            });

            if (res.data && res.data.success) {
                setInsight(res.data.insight);
            } else {
                setError(res.data?.message || 'Không thể phân tích dữ liệu.');
            }
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                'Lỗi kết nối. Vui lòng thử lại sau.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Đóng insight overlay, reset state.
     */
    const close = useCallback(() => {
        setVisible(false);
        // Delay reset để animation fade-out hoàn tất
        setTimeout(() => {
            setInsight(null);
            setError(null);
        }, 300);
    }, []);

    return { loading, insight, error, visible, fetchInsight, close };
};

export default useAiInsight;

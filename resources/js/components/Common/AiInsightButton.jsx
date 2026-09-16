import React from 'react';
import { Button, message } from 'antd';
import { BulbOutlined } from '@ant-design/icons';
import AiInsightOverlay from './AiInsightOverlay';
import useAiInsight from '../../hooks/useAiInsight';

/**
 * Nút "AI Insight" tái sử dụng cho mỗi chart card.
 *
 * Props:
 * - chartTitle:   string  — Tiêu đề biểu đồ
 * - chartType:    string  — Loại biểu đồ (bar, pie, donut, radial, area, line)
 * - currentData:  array   — Dữ liệu hiện tại
 * - previousData: array   — Dữ liệu kỳ trước (optional)
 * - filters:      object  — Bộ lọc (optional)
 * - cardRef:      RefObject — Ref tới container card (để focus spotlight)
 */
const AiInsightButton = ({ chartTitle, chartType, currentData, previousData, filters, cardRef }) => {
    const { loading, insight, error, visible, fetchInsight, close } = useAiInsight();

    const handleClick = () => {
        if (!currentData || (Array.isArray(currentData) && currentData.length === 0)) {
            message.warning('Không có dữ liệu để phân tích.');
            return;
        }

        fetchInsight({ chartTitle, chartType, currentData, previousData, filters });
    };

    // Show error via antd message
    React.useEffect(() => {
        if (error) {
            message.error(error);
        }
    }, [error]);

    return (
        <>
            <Button
                size="small"
                loading={loading}
                onClick={handleClick}
                className="!rounded-[10px] !text-xs !font-semibold !border !border-[#2563EB]/25 !text-[#2563EB] !bg-[#2563EB]/10 !inline-flex !items-center !gap-1.5 hover:!bg-[#2563EB]/20 hover:!border-[#2563EB]/40 hover:!-translate-y-px hover:!shadow-[0_4px_12px_rgba(37,99,235,0.15)] !transition-all !duration-200"
            >
                <BulbOutlined className="text-sm" />
                AI Insight
            </Button>

            {/* Overlay + Insight card (Portal) */}
            <AiInsightOverlay
                visible={visible}
                onClose={close}
                cardRef={cardRef}
                loading={loading}
                insight={insight}
                error={error}
            />
        </>
    );
};

export default AiInsightButton;

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { BulbOutlined } from '@ant-design/icons';

/**
 * Overlay spotlight khi AI Insight đang hiển thị.
 * Dùng box-shadow 9999px để dimming xung quanh + border-radius tự nhiên.
 * Insight card bên cạnh chart card (phải / trái / bên dưới nếu không đủ chỗ).
 * Vị trí tính theo document (absolute) → tự cuộn theo trang.
 */
const AiInsightOverlay = ({ visible, onClose, cardRef, loading, insight, error }) => {
    const [rect, setRect] = useState(null);

    // Tính vị trí card theo document (absolute, không phải viewport)
    useEffect(() => {
        if (visible && cardRef?.current) {
            const r = cardRef.current.getBoundingClientRect();
            const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
            const scrollY = window.pageYOffset || document.documentElement.scrollTop;
            setRect({
                top: r.top + scrollY,
                left: r.left + scrollX,
                width: r.width,
                height: r.height,
                bottom: r.bottom + scrollY,
                right: r.right + scrollX,
            });

            // Cuộn mượt để chart nằm giữa viewport
            cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (!visible) {
            setRect(null);
        }
    }, [visible, cardRef]);

    if (!visible || !rect) return null;

    const pad = 6;
    const borderRadius = 18;
    const insightWidth = 340;
    const gap = 14;

    // Tính vị trí insight card
    const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1400;
    const rightSpace = viewportW - (rect.left + rect.width) - pad;
    const leftSpace = rect.left - pad;

    let insightLeft;
    let insightTop = rect.top - pad;
    let placeBelow = false;

    if (rightSpace >= insightWidth + gap + 16) {
        // Đủ chỗ bên phải
        insightLeft = rect.right + pad + gap;
    } else if (leftSpace >= insightWidth + gap + 16) {
        // Đủ chỗ bên trái
        insightLeft = rect.left - pad - gap - insightWidth;
    } else {
        // Không đủ chỗ 2 bên → hiển thị bên dưới chart
        placeBelow = true;
        insightLeft = rect.left;
        insightTop = rect.bottom + pad + gap;
    }

    return ReactDOM.createPortal(
        <>
            {/* Click-catcher: fixed toàn viewport — luôn che phủ khi cuộn */}
            <div
                className="fixed inset-0 cursor-pointer"
                style={{ zIndex: 9998 }}
                onClick={onClose}
            />

            {/* Spotlight cutout: absolute → cuộn theo chart trong document */}
            <div
                className="absolute pointer-events-none"
                style={{
                    zIndex: 9999,
                    top: `${rect.top - pad}px`,
                    left: `${rect.left - pad}px`,
                    width: `${rect.width + pad * 2}px`,
                    height: `${rect.height + pad * 2}px`,
                    borderRadius: `${borderRadius}px`,
                    boxShadow: `
                        0 0 0 2px rgba(37, 99, 235, 0.25),
                        0 0 0 9999px rgba(15, 23, 42, 0.5),
                        0 20px 60px rgba(37, 99, 235, 0.12)
                    `,
                }}
            />

            {/* Insight card — absolute → cuộn cùng spotlight */}
            <div
                className={`absolute overflow-y-auto rounded-2xl transition-all duration-300 ${insight || loading || error ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                    }`}
                style={{
                    zIndex: 10001,
                    top: `${insightTop}px`,
                    left: `${insightLeft}px`,
                    width: placeBelow ? `${rect.width}px` : `${insightWidth}px`,
                    maxHeight: placeBelow ? '300px' : `${Math.max(rect.height + pad * 2, 200)}px`,
                    background: 'rgba(255, 255, 255, 0.97)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    boxShadow: '0 12px 40px rgba(124, 58, 237, 0.12), 0 4px 12px rgba(15, 23, 42, 0.08)',
                }}
            >
                <div className="p-4 relative">
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 text-xs cursor-pointer transition-all duration-200 border-none"
                        aria-label="Đóng"
                    >
                        ✕
                    </button>

                    {/* Header */}
                    <div className="flex items-center gap-1.5 mb-3">
                        <BulbOutlined className="text-base text-[#2563eb]" />
                        <span
                            className="text-xs font-extrabold tracking-wider uppercase bg-clip-text text-transparent"
                            style={{
                                backgroundImage: 'linear-gradient(135deg, #2563eb, #38bdf8)',
                                WebkitBackgroundClip: 'text',
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                            }}
                        >
                            AI Insight
                        </span>
                    </div>

                    {/* Body */}
                    <div>
                        {loading && (
                            <div className="flex flex-col gap-2">
                                <div className="h-3.5 w-full rounded-lg animate-pulse bg-blue-100" />
                                <div className="h-3.5 w-3/5 rounded-lg animate-pulse bg-blue-50" />
                                <div className="h-3.5 w-4/5 rounded-lg animate-pulse bg-blue-100" />
                            </div>
                        )}
                        {insight && !loading && (
                            <p
                                className="m-0 text-[13.5px] font-medium leading-7 text-slate-800"
                                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                            >
                                {insight}
                            </p>
                        )}
                        {error && !loading && (
                            <p
                                className="m-0 text-sm font-medium text-red-500"
                                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                            >
                                Không thể phân tích dữ liệu lúc này. Vui lòng thử lại.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
};

export default AiInsightOverlay;

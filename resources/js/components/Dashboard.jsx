import React, { useState, useEffect, useCallback, useRef } from 'react';
import MainLayout from './Layout/MainLayout';
import { Card, Row, Col, Typography, Space, Button, message, Tooltip as AntTooltip } from 'antd';
import {
    BankOutlined, HomeOutlined, AppstoreOutlined, ToolOutlined,
    DollarOutlined, AreaChartOutlined, ReloadOutlined,
} from '@ant-design/icons';
import useThongKeChannel from '../hooks/useThongKeChannel';
import KpiCard from './Common/KpiCard';
import AiInsightButton from './Common/AiInsightButton';
import {
    PieChart, Pie, Cell, RadialBar, RadialBarChart, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, LabelList, ComposedChart, Line,
} from 'recharts';

const { Title, Text } = Typography;


// ─── Màu sắc ──────────────────────────────────────────────────────────────
const C = ['#3b82f6', '#0f766e', '#f59e0b', '#8b5cf6', '#ef4444', '#22c55e'];
const DONUT_COLORS = [
    {
        solid: "#10b981",
        grad: ["#34d399", "#10b981"],
    },
    {
        solid: "#f59e0b",
        grad: ["#fbbf24", "#f59e0b"],
    },
    {
        solid: "#ef4444",
        grad: ["#fb7185", "#ef4444"],
    },
];



const useCountUp = (target, duration = 1200) => {
    const [value, setValue] = useState(0);

    useEffect(() => {
        let raf;
        let start;

        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            setValue(Math.round(target * eased));
            if (progress < 1) raf = requestAnimationFrame(animate);
        };

        raf = requestAnimationFrame(animate);
        return () =>
            cancelAnimationFrame(raf);
    }, [target, duration]);

    return value;
};

// ─── Helpers ──────────────────────────────────────────────────────────────
const fmt = (v) => new Intl.NumberFormat('vi-VN').format(v || 0);
const fmtCrFull = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v || 0);
const fmtCr = (v) => {
    const val = Number(v) || 0;
    if (val === 0) return '0 đ';
    const absVal = Math.abs(val);
    if (absVal >= 1_000_000_000) {
        const res = (val / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 2 });
        return `${res} tỷ`;
    }
    if (absVal >= 1_000_000) {
        const res = (val / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 2 });
        return `${res} triệu`;
    }
    return fmtCrFull(val);
};
const loaiPhongLabel = (l) => ({ phong_hoc: 'Phòng học', phong_thi_nghiem: 'Thí nghiệm', phong_thuc_hanh: 'Thực hành', phong_lam_viec: 'Làm việc', phong_chuc_nang: 'Chức năng' }[l] || l);
const loaiThietBiLabel = (l) => ({ van_phong: 'Văn phòng', day_hoc: 'Dạy học', thi_nghiem: 'Thí nghiệm', thuc_hanh: 'Thực hành' }[l] || l);
const trangThaiLabel = (t) => ({ active: 'Hoạt động', maintenance: 'Bảo trì', inactive: 'Không HĐ' }[t] || t);


// ─── Chart Card ───────────────────────────────────────────────────────────
const ChartCard = React.forwardRef(({ title, children, insightButton }, ref) => (
    <div ref={ref} style={{ position: 'relative' }}>
        <Card
            bordered={false}
            className="
                overflow-hidden
                rounded-3xl
                border
                border-white/25
                bg-white/55
                backdrop-blur-xl
                shadow-[0_8px_30px_rgba(15,23,42,.05)]"
            styles={{
                body: {
                    padding: 20,
                },
            }}
        >
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <h3 className="text-[15px] font-semibold tracking-[-0.03em] text-slate-900">
                        {title}
                    </h3>
                </div>
                {insightButton && <div>{insightButton}</div>}
            </div>

            {children}
        </Card>
    </div>
));

// ─── Donut Chart ──────────────────────────────────────────────────────────
const DonutChart = ({ data }) => {
    const total = data.reduce(
        (s, d) => s + (d.value || 0),
        0
    );

    const displayTotal = useCountUp(total);

    const [activeIndex, setActiveIndex] =
        useState(null);

    return (
        <div className="flex items-center gap-1">
            <div className="relative w-[220px] shrink-0">
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <defs>
                            {DONUT_COLORS.map(
                                (c, i) => (
                                    <linearGradient key={i} id={`donutGradient${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor={c.grad[0]} />
                                        <stop offset="100%" stopColor={c.grad[1]} />
                                    </linearGradient>
                                )
                            )}
                        </defs>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={82}
                            paddingAngle={5}
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                            animationDuration={1800}
                            animationBegin={200}
                            onMouseEnter={(_, index) => setActiveIndex(index)}
                            onMouseLeave={() => setActiveIndex(null)}
                        >
                            {data.map((item, i) => {
                                const active = activeIndex === i;
                                return (
                                    <Cell
                                        key={i}
                                        fill={`url(#donutGradient${i})`}
                                        stroke="rgba(255,255,255,.8)"
                                        strokeWidth={2}
                                        style={{
                                            filter: active ? `drop-shadow(0 0 10px ${DONUT_COLORS[i].solid}55)` : "none",
                                            transition: "all .25s ease",
                                        }}
                                    />
                                );
                            })}
                        </Pie>

                        <Tooltip
                            offset={100}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const item = payload[0].payload;
                                    const colorIndex = data.findIndex(d => d.name === item.name);
                                    return (
                                        <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-4 min-w-[160px]">
                                            <div className="flex items-center justify-between gap-3 mb-2">
                                                <span className="font-semibold text-slate-800">{item.name}</span>
                                            </div>
                                            <div className="space-y-1 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: DONUT_COLORS[colorIndex]?.solid || '#94a3b8' }} />
                                                    <span className="text-slate-600">Số lượng: <strong>{fmt(item.value)}</strong> phòng</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                {/* Center */}
                <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="flex flex-col items-center justify-center w-[88px] h-[88px] rounded-full border border-white/30 bg-white/40 backdrop-blur-xl">
                        <div
                            className="text-[24px] font-black text-slate-900 leading-none"
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            {displayTotal}
                        </div>
                        <div
                            className="mt-1 text-[10px] uppercase tracking-[0.12em] text-slate-400 font-bold">
                            Tổng phòng
                        </div>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex-1 flex flex-col gap-2">
                {data.map((item, i) => {
                    const pct = total ? Math.round((item.value / total) * 100) : 0;
                    return (
                        <div
                            key={i}
                            className="rounded-xl px-3 py-2 transition-all duration-300 hover:bg-[#244380]/[0.06] hover:backdrop-blur-xl hover:shadow-[0_8px_20px_rgba(36,67,128,.08)] hover:border hover:border-[#244380]/10 hover:-translate-y-[1px]"
                            onMouseEnter={() => setActiveIndex(i)}
                            onMouseLeave={() => setActiveIndex(null)}>
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{
                                        background: DONUT_COLORS[i].solid,
                                    }} />
                                    <span className="text-[12px] font-semibold text-slate-700">
                                        {item.name}
                                    </span>
                                </div>
                                <div className="text-[13px] font-bold text-slate-900">
                                    {fmt(item.value)}
                                </div>
                            </div>
                            <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{
                                        width: `${pct}%`,
                                        background: `linear-gradient(90deg, ${DONUT_COLORS[i].grad[0]}, ${DONUT_COLORS[i].grad[1]})`,
                                    }}
                                />
                            </div>
                            <div className="mt-1 text-right text-[11px] font-semibold text-slate-400">
                                {pct}%
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ─── Main ─────────────────────────────────────────────────────────────────
const Dashboard = ({ statistics: initStats, thongKeLoaiPhong: initLoaiPhong, thongKeLoaiThietBi: initLoaiThietBi, thongKeCoSo: initCoSo, thongKeTrangThaiPhong: initTrangThai }) => {
    // State quản lý dữ liệu — khởi tạo từ Inertia props
    const [stats, setStats] = useState(initStats || {});
    const [rawLoaiPhong, setRawLoaiPhong] = useState(initLoaiPhong || []);
    const [rawLoaiThietBi, setRawLoaiThietBi] = useState(initLoaiThietBi || []);
    const [rawCoSo, setRawCoSo] = useState(initCoSo || []);
    const [rawTrangThai, setRawTrangThai] = useState(initTrangThai || []);
    const [recalculating, setRecalculating] = useState(false);

    // Lắng nghe realtime updates từ Pusher
    const handleRealtimeUpdate = useCallback(async ({ updatedKeys }) => {
        const dashboardKeys = [
            'dashboard.overview',
            'dashboard.loai_phong',
            'dashboard.loai_thiet_bi',
            'dashboard.co_so',
            'dashboard.trang_thai_phong',
        ];

        const hasDashboardUpdate = Array.isArray(updatedKeys) && updatedKeys.some((k) => dashboardKeys.includes(k));
        if (!hasDashboardUpdate) return;

        try {
            const res = await window.axios.get('/thong-ke/snapshots', {
                params: { keys: dashboardKeys.join(',') }
            });
            if (res.data && res.data.success) {
                const snapshots = res.data.snapshots || {};
                if (snapshots['dashboard.overview']) setStats(snapshots['dashboard.overview']);
                if (snapshots['dashboard.loai_phong']) setRawLoaiPhong(snapshots['dashboard.loai_phong']);
                if (snapshots['dashboard.loai_thiet_bi']) setRawLoaiThietBi(snapshots['dashboard.loai_thiet_bi']);
                if (snapshots['dashboard.co_so']) setRawCoSo(snapshots['dashboard.co_so']);
                if (snapshots['dashboard.trang_thai_phong']) setRawTrangThai(snapshots['dashboard.trang_thai_phong']);
            }
        } catch (e) {
            console.error('Lỗi khi tải snapshot mới cho Dashboard:', e);
        }
    }, []);

    useThongKeChannel(handleRealtimeUpdate);

    // Nút tính lại thống kê
    const handleRecalculate = async () => {
        setRecalculating(true);
        try {
            const res = await window.axios.post('/thong-ke/recalculate');
            if (res.data.success) {
                message.success('Đã tính lại thống kê thành công');
            }
        } catch (err) {
            message.error('Lỗi khi tính lại thống kê');
        } finally {
            setRecalculating(false);
        }
    };

    // Transform data cho charts
    const loaiPhongData = (rawLoaiPhong || []).map((d) => ({
        name: loaiPhongLabel(d.loai_phong),
        soLuong: d.so_luong,
    }));
    const loaiThietBiData = (rawLoaiThietBi || [])
        .map(d => ({ name: loaiThietBiLabel(d.loai_thiet_bi), soLuong: d.so_luong }))
        .sort((a, b) => (b.soLuong || 0) - (a.soLuong || 0));
    const coSoData = (rawCoSo || []).map(d => ({ name: d.ten_co_so, soKhuNha: d.so_khu_nha }));
    const trangThaiPhongData = (rawTrangThai || []).map(d => ({ name: trangThaiLabel(d.trang_thai), value: d.so_luong }));

    // Refs cho AI Insight focus
    const chartLoaiPhongRef = useRef(null);
    const chartTrangThaiRef = useRef(null);
    const chartCoSoRef = useRef(null);
    const chartThietBiRef = useRef(null);

    const [activeBar, setActiveBar] = useState(null);
    const [activeDeviceBar, setActiveDeviceBar] = useState(null);

    const kpis = [
        { title: 'Tổng số cơ sở', value: fmt(stats.tong_co_so), icon: <BankOutlined />, color: '#4096ff' },
        { title: 'Tổng số toà nhà', value: fmt(stats.tong_khu_nha), icon: <HomeOutlined />, color: '#52c41a' },
        { title: 'Tổng số phòng', value: fmt(stats.tong_phong), icon: <AppstoreOutlined />, color: '#13c2c2' },
        { title: 'Tổng số thiết bị', value: fmt(stats.tong_thiet_bi), icon: <ToolOutlined />, color: '#fa8c16' },
        { title: 'Tổng giá trị thiết bị', value: fmtCr(stats.tong_gia_tri_thiet_bi), tooltip: fmtCrFull(stats.tong_gia_tri_thiet_bi), icon: <DollarOutlined />, color: '#7c3aed' },
        { title: 'Diện tích đất (m²)', value: fmt(stats.dien_tich_dat), icon: <AreaChartOutlined />, color: '#13c2c2' },
    ];

    return (
        <MainLayout>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={2} style={{ margin: 0 }}>
                        <AreaChartOutlined style={{ marginRight: 10, color: '#4096ff' }} />
                        Tổng quan cơ sở vật chất
                    </Title>
                    <Button
                        icon={<ReloadOutlined spin={recalculating} />}
                        loading={recalculating}
                        onClick={handleRecalculate}
                        type="default"
                        size="small"
                        style={{
                            borderRadius: 10,
                            fontSize: 12,
                            fontWeight: 600,
                            border: '1px solid rgba(36,67,128,0.15)',
                            color: '#244380',
                        }}
                    >
                        Tính lại thống kê
                    </Button>
                </div>
                {/* ── KPI ── */}
                <Row gutter={[16, 16]}>
                    {kpis.map((k, i) => (
                        <Col xs={24} sm={12} lg={4} key={i}>
                            <KpiCard {...k} />
                        </Col>
                    ))}
                </Row>
                {/* ── Hàng 1 ── */}
                <Row gutter={[16, 16]} align="stretch">
                    {/* BarChart: loại phòng — so sánh theo nhóm */}
                    <Col xs={24} lg={14} style={{ position: 'relative' }}>
                        <ChartCard
                            ref={chartLoaiPhongRef}
                            title="Phân bố theo loại phòng"
                            insightButton={
                                <AiInsightButton
                                    chartTitle="Phân bố theo loại phòng"
                                    chartType="bar"
                                    currentData={loaiPhongData}
                                    cardRef={chartLoaiPhongRef}
                                />
                            }
                        >
                            <div onMouseLeave={() => setActiveBar(null)}>
                                <ResponsiveContainer width="100%" height={300}>
                                    <ComposedChart
                                        data={loaiPhongData.map(item => {
                                            const total = loaiPhongData.reduce((s, i) => s + i.soLuong, 0);
                                            return {
                                                ...item,
                                                percentage: total > 0 ? Number(((item.soLuong / total) * 100).toFixed(1)) : 0
                                            };
                                        })}
                                        margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
                                        onMouseMove={(state) => {
                                            const i = state?.isTooltipActive ? Number(state.activeTooltipIndex) : null;
                                            setActiveBar(Number.isNaN(i) ? null : i);
                                        }}
                                        onMouseLeave={() => setActiveBar(null)}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            horizontal={false}
                                            vertical={true}
                                            stroke="#cbd5e1"
                                        />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={{ stroke: "#cbd5e1" }}
                                            tickLine={false}
                                            tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                                            dy={8}
                                        />
                                        <YAxis
                                            yAxisId="left"
                                            axisLine={{ stroke: "#cbd5e1" }}
                                            tickLine={{ stroke: "#cbd5e1" }}
                                            tick={{ fill: "#94a3b8", fontSize: 12 }}
                                            width={36}
                                            allowDecimals={false}
                                        />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            axisLine={{ stroke: "#cbd5e1" }}
                                            tickLine={{ stroke: "#cbd5e1" }}
                                            tick={{ fill: "#94a3b8", fontSize: 12 }}
                                            width={40}
                                            unit="%"
                                        />
                                        <Tooltip
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-4 min-w-[160px]">
                                                            <div className="flex items-center justify-between gap-3 mb-2">
                                                                <span className="font-semibold text-slate-800">{label}</span>
                                                            </div>
                                                            <div className="space-y-1 text-sm">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2.5 h-2.5 rounded-sm bg-[#497CE9]" />
                                                                    <span className="text-slate-600">Số lượng: <strong>{data.soLuong}</strong></span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2.5 h-2.5 rounded-full bg-[#3FB68B]" />
                                                                    <span className="text-slate-600">Tỷ lệ: <strong>{data.percentage}%</strong></span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            iconType="circle"
                                            wrapperStyle={{ paddingTop: 12 }}
                                        />
                                        <Bar
                                            yAxisId="left"
                                            dataKey="soLuong"
                                            name="Số lượng"
                                            fill="#648FED"
                                            radius={[6, 6, 0, 0]}
                                            maxBarSize={28}
                                            isAnimationActive={false}
                                        >
                                            {loaiPhongData.map((_, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={activeBar === index ? "#497CE9" : "#648FED"}
                                                    opacity={activeBar === null || activeBar === index ? 1 : 0.55}
                                                />
                                            ))}
                                        </Bar>
                                        <Line
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="percentage"
                                            name="Tỷ lệ (%)"
                                            stroke="#3FB68B"
                                            strokeWidth={2.5}
                                            dot={{ r: 4, fill: "#3FB68B", strokeWidth: 2, stroke: "#fff" }}
                                            activeDot={{ r: 6 }}
                                            isAnimationActive={false}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </ChartCard>
                    </Col>
                    {/* Donut: trạng thái */}
                    <Col xs={24} lg={10} style={{ position: 'relative' }}>
                        <ChartCard
                            ref={chartTrangThaiRef}
                            title="Trạng thái phòng"
                            insightButton={
                                <AiInsightButton
                                    chartTitle="Trạng thái phòng"
                                    chartType="donut"
                                    currentData={trangThaiPhongData}
                                    cardRef={chartTrangThaiRef}
                                />
                            }
                        >
                            <DonutChart data={trangThaiPhongData} />
                        </ChartCard>
                    </Col>
                </Row>
                {/* ── Hàng 2 ── */}
                <Row gutter={[16, 16]} align="stretch">
                    {/* Horizontal Bar: thiết bị theo loại */}
                    <Col xs={24} lg={12} style={{ position: 'relative' }}>
                        <ChartCard
                            ref={chartCoSoRef}
                            title="Toà nhà theo cơ sở"
                            insightButton={
                                <AiInsightButton
                                    chartTitle="Toà nhà theo cơ sở"
                                    chartType="radial"
                                    currentData={coSoData}
                                    cardRef={chartCoSoRef}
                                />
                            }
                        >
                            <ResponsiveContainer width="100%" height={245}>
                                <RadialBarChart
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="25%"
                                    outerRadius="85%"
                                    barSize={16}
                                    data={coSoData.map((item, index) => ({
                                        ...item,
                                        fill: [
                                            "#244380",
                                            "#10B981",
                                            "#F59E0B",
                                            "#8B5CF6",
                                            "#EF4444",
                                        ][index % 5],
                                    }))}
                                >
                                    <RadialBar background clockWise dataKey="soKhuNha" cornerRadius={12} label={false} />
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const item = payload[0].payload;
                                                const colors = ["#244380", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444"];
                                                const colorIndex = coSoData.findIndex(d => d.name === item.name);
                                                return (
                                                    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-4 min-w-[160px]">
                                                        <div className="flex items-center justify-between gap-3 mb-2">
                                                            <span className="font-semibold text-slate-800">{item.name}</span>
                                                        </div>
                                                        <div className="space-y-1 text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: colors[colorIndex % 5] }} />
                                                                <span className="text-slate-600">Số toà nhà: <strong>{fmt(item.soKhuNha)}</strong></span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                </RadialBarChart>
                            </ResponsiveContainer>
                            <div className="space-y-2">
                                {coSoData.map((item, index) => (
                                    <div
                                        key={item.name}
                                        className="flex items-center justify-between text-sm"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{
                                                    background: [
                                                        "#244380",
                                                        "#10B981",
                                                        "#F59E0B",
                                                        "#8B5CF6",
                                                        "#EF4444",
                                                    ][index % 5],
                                                }}
                                            />

                                            <span className="font-medium text-slate-700">
                                                {item.name}
                                            </span>
                                        </div>

                                        <span className="font-bold text-slate-900">
                                            {String(item.soKhuNha).padStart(2, "0")}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </ChartCard>
                    </Col>
                    {/* BarChart: khu nhà theo cơ sở — bar dọc gradient */}
                    <Col xs={24} lg={12} style={{ position: 'relative' }}>
                        <ChartCard
                            ref={chartThietBiRef}
                            title="Thiết bị theo loại"
                            insightButton={
                                <AiInsightButton
                                    chartTitle="Thiết bị theo loại"
                                    chartType="bar-horizontal"
                                    currentData={loaiThietBiData}
                                    cardRef={chartThietBiRef}
                                />
                            }
                        >
                            <div onMouseLeave={() => setActiveDeviceBar(null)}>
                                <ResponsiveContainer width="100%" height={320}>
                                    <BarChart
                                        data={loaiThietBiData}
                                        layout="vertical"
                                        margin={{ top: 10, right: 50, left: 10, bottom: 10 }}
                                        barCategoryGap="28%"
                                        onMouseMove={(state) => {
                                            const i = state?.isTooltipActive ? Number(state.activeTooltipIndex) : null;
                                            setActiveDeviceBar(Number.isNaN(i) ? null : i);
                                        }}
                                        onMouseLeave={() => setActiveDeviceBar(null)}
                                    >
                                        <CartesianGrid
                                            horizontal={false}
                                            stroke="#cbd5e1"
                                            strokeDasharray="3 3"

                                        />
                                        <XAxis
                                            type="number"
                                            axisLine={{ stroke: "#cbd5e1" }}
                                            tickLine={{ stroke: "#cbd5e1" }}
                                            tick={{ fill: "#94a3b8", fontSize: 12 }}
                                            allowDecimals={false}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            axisLine={{ stroke: "#cbd5e1" }}
                                            tickLine={{ stroke: "#cbd5e1" }}
                                            width={90}
                                            tick={{ fill: "#475569", fontSize: 13, fontWeight: 500 }}
                                        />
                                        <Tooltip
                                            cursor={false}
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-4 min-w-[160px]">
                                                            <div className="flex items-center justify-between gap-3 mb-2">
                                                                <span className="font-semibold text-slate-800">{label}</span>
                                                            </div>
                                                            <div className="space-y-1 text-sm">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2.5 h-2.5 rounded-sm bg-[#5DBB9A]" />
                                                                    <span className="text-slate-600">Số lượng: <strong>{fmt(data.soLuong)}</strong></span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar
                                            dataKey="soLuong"
                                            radius={[0, 4, 4, 0]}
                                            maxBarSize={22}
                                            isAnimationActive={false}
                                        >
                                            {loaiThietBiData.map((_, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={activeDeviceBar === index ? "#40A17F" : "#5DBB9A"}
                                                    opacity={activeDeviceBar === null || activeDeviceBar === index ? 1 : 0.55}
                                                    style={{
                                                        transition: "fill 0.25s ease, opacity 0.2s ease ",
                                                        opacity: activeDeviceBar === null || activeDeviceBar === index ? 1 : 0.45,
                                                    }}
                                                />
                                            ))}
                                            <LabelList
                                                dataKey="soLuong"
                                                position="right"
                                                offset={10}
                                                style={{
                                                    fill: "#334155",
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                }}
                                                formatter={(value) => fmt(value)}
                                            />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </ChartCard>
                    </Col>
                </Row>
            </Space>
        </MainLayout>
    );
};

export default Dashboard;

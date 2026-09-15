import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import MainLayout from '../Layout/MainLayout';
import {
    Card, Row, Col, Statistic, Typography, Space, Table, Tag, Segmented, Tooltip, Select, Button, message, Spin,
} from 'antd';
import {
    BankOutlined, HomeOutlined, AppstoreOutlined, ToolOutlined,
    DollarOutlined, AreaChartOutlined, WarningOutlined, ReloadOutlined,
} from '@ant-design/icons';
import {
    BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
    Legend, ResponsiveContainer, LineChart, Line, Area, AreaChart,
} from 'recharts';
import KpiCard from '../Common/KpiCard';
import AiInsightButton from '../Common/AiInsightButton';
import useThongKeChannel from '../../hooks/useThongKeChannel';

// ── Helper: Card title kèm nút AI Insight ─────────────────────────────────────
const ChartCardTitle = ({ title, chartType, currentData, cardRef, previousData, filters }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <span>{title}</span>
        <AiInsightButton
            chartTitle={title}
            chartType={chartType}
            currentData={currentData}
            previousData={previousData}
            filters={filters}
            cardRef={cardRef}
        />
    </div>
);

const { Title, Text } = Typography;


// ─── Palette đồng bộ toàn trang ──────────────────────────────────────────────
const P = {
    blue:   '#4096ff',
    green:  '#52c41a',
    teal:   '#13c2c2',
    purple: '#7c3aed',
    orange: '#fa8c16',
    red:    '#f5222d',
    yellow: '#fadb14',
    pink:   '#eb2f96',
};
const PIE_COLORS = [P.blue, P.green, P.teal, P.purple, P.orange, P.red, P.pink, P.yellow];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatCurrencyFull = (v) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v || 0);

const formatCurrency = (v) => {
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
    return formatCurrencyFull(val);
};

const formatNumber = (v) => new Intl.NumberFormat('vi-VN').format(v || 0);

const trangThaiTag = (tt) => {
    const map = {
        active:       { color: 'green',   label: 'Hoạt động' },
        maintenance:  { color: 'orange',  label: 'Bảo trì' },
        inactive:     { color: 'default', label: 'Không HĐ' },
        broken:       { color: 'red',     label: 'Hỏng' },
        tot:          { color: 'green',   label: 'Tốt' },
        can_sua_chua: { color: 'orange',  label: 'Cần sửa chữa' },
        hu_hong:      { color: 'red',     label: 'Hư hỏng' },
    };
    const m = map[tt] || { color: 'default', label: tt };
    return <Tag color={m.color}>{m.label}</Tag>;
};

const loaiPhongLabel = (l) => ({
    phong_hoc: 'Phòng học', phong_thi_nghiem: 'Thí nghiệm',
    phong_thuc_hanh: 'Thực hành', phong_lam_viec: 'Làm việc', phong_chuc_nang: 'Chức năng',
}[l] || l);

const loaiKhuNhaLabel = (l) => ({
    phong_hoc: 'Phòng học', phong_lam_viec: 'Làm việc', phong_chuc_nang: 'Chức năng',
}[l] || l);

const loaiThietBiLabel = (l) => ({
    van_phong: 'Văn phòng', day_hoc: 'Dạy học', thi_nghiem: 'Thí nghiệm', thuc_hanh: 'Thực hành',
}[l] || l);

// ─── Shared chart config ──────────────────────────────────────────────────────
const CHART_HEIGHT = 280;

const axisStyle = { fill: '#8c8c8c', fontSize: 12 };

const tooltipStyle = {
    contentStyle: {
        borderRadius: 10,
        border: 'none',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        padding: '10px 16px',
        fontSize: 13,
    },
    labelStyle: { fontWeight: 600, color: '#222', marginBottom: 4 },
    itemStyle: { color: '#555' },
    cursor: { fill: 'rgba(64,150,255,0.06)' },
};

const gridStyle = {
    strokeDasharray: '0',
    stroke: '#f0f0f0',
    strokeWidth: 1,
    vertical: false,
};

// ─── Donut chart với label ở giữa ────────────────────────────────────────────
const DonutChart = ({ data, height = CHART_HEIGHT }) => {
    const total = data.reduce((s, d) => s + (d.value || 0), 0);
    return (
        <ResponsiveContainer width="100%" height={height}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%" cy="50%"
                    innerRadius="52%"
                    outerRadius="75%"
                    paddingAngle={3}
                    dataKey="value"
                >
                    {data.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
                    ))}
                </Pie>
                <RTooltip
                    {...tooltipStyle}
                    formatter={(v, name) => [`${formatNumber(v)} (${total ? ((v / total) * 100).toFixed(1) : 0}%)`, name]}
                />
                <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span style={{ color: '#555', fontSize: 12 }}>{value}</span>}
                />
                {/* Label tổng ở giữa */}
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                    <tspan x="50%" dy="-8" fontSize={22} fontWeight={700} fill="#222">{formatNumber(total)}</tspan>
                    <tspan x="50%" dy={22} fontSize={11} fill="#999">Tổng</tspan>
                </text>
            </PieChart>
        </ResponsiveContainer>
    );
};

// ─── Bar chart chuẩn ─────────────────────────────────────────────────────────
const StyledBarChart = ({ data, bars, height = CHART_HEIGHT, margin, layout, children }) => (
    <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={margin || { top: 4, right: 8, bottom: 4, left: 0 }} layout={layout}>
            <CartesianGrid {...gridStyle} />
            {children}
            <RTooltip {...tooltipStyle} />
            <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ paddingTop: 12 }}
                formatter={(value) => <span style={{ color: '#555', fontSize: 12 }}>{value}</span>}
            />
            {bars.map((b, i) => (
                <Bar
                    key={i}
                    yAxisId={b.yAxisId}
                    dataKey={b.dataKey}
                    name={b.name}
                    fill={b.fill}
                    barSize={b.barSize || 28}
                    radius={[4, 4, 0, 0]}
                    background={{ fill: '#fafafa', radius: [4, 4, 0, 0] }}
                />
            ))}
        </BarChart>
    </ResponsiveContainer>
);

// ─────────────────────────────────────────────────────
// TAB: CƠ SỞ
// ─────────────────────────────────────────────────────
const TabCoSo = ({ data }) => {
    const { tong_quan: tq, chi_tiet, bieu_do_dien_tich, bieu_do_so_luong, bieu_do_trang_thai } = data;

    // Refs cho AI Insight focus
    const refDienTich = useRef(null);
    const refTrangThai = useRef(null);
    const refSoLuong = useRef(null);

    const columns = [
        { title: 'Mã', dataIndex: 'ma_co_so', width: 100, fixed: 'left' },
        { title: 'Tên cơ sở', dataIndex: 'ten_co_so', ellipsis: true },
        { title: 'Địa chỉ', dataIndex: 'dia_chi', ellipsis: true },
        { title: 'DT đất (m²)', dataIndex: 'dien_tich_dat', align: 'right', render: v => formatNumber(v) },
        { title: 'DT quy đổi (m²)', dataIndex: 'dien_tich_quy_doi', align: 'right', render: v => formatNumber(parseFloat(v)) },
        { title: 'Toà nhà', dataIndex: 'so_khu_nha', align: 'center' },
        { title: 'Phòng', dataIndex: 'so_phong', align: 'center' },
        { title: 'Thiết bị', dataIndex: 'so_thiet_bi', align: 'center' },
        { title: 'Trạng thái', dataIndex: 'trang_thai', render: trangThaiTag },
    ];

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Row gutter={[16, 16]}>
                {[
                    { title: 'Tổng số cơ sở',   value: tq?.tong_co_so,                                           icon: <BankOutlined />,      color: P.blue },
                    { title: 'Tổng DT đất',      value: `${formatNumber(tq?.tong_dien_tich_dat)} m²`,            icon: <AreaChartOutlined />,  color: P.green },
                    { title: 'Tổng DT quy đổi', value: `${formatNumber(Math.round(tq?.tong_dien_tich_quy_doi))} m²`, icon: <AreaChartOutlined />, color: P.teal },
                    { title: 'Đang hoạt động',  value: tq?.co_so_hoat_dong,                                      icon: <BankOutlined />,       color: P.green },
                ].map((item, i) => (
                    <Col xs={24} sm={12} lg={6} key={i}>
                        <KpiCard title={item.title} value={item.value} icon={item.icon} color={item.color} />
                    </Col>
                ))}
            </Row>

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={12} style={{ position: 'relative' }}>
                    <div ref={refDienTich} style={{ position: 'relative' }}>
                        <Card title={<ChartCardTitle title="Diện tích đất theo cơ sở (m²)" chartType="bar" currentData={bieu_do_dien_tich} cardRef={refDienTich} />} bordered={false}
                            style={{ borderRadius: 10, boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
                            <StyledBarChart
                                data={bieu_do_dien_tich}
                                bars={[
                                    { dataKey: 'dienTichDat',    name: 'DT đất',       fill: P.blue,  barSize: 28 },
                                    { dataKey: 'dienTichQuyDoi', name: 'DT quy đổi',   fill: P.green, barSize: 28 },
                                ]}
                            >
                                <XAxis dataKey="name" tick={axisStyle} />
                                <YAxis tick={axisStyle} />
                            </StyledBarChart>
                        </Card>
                    </div>
                </Col>
                <Col xs={24} lg={12} style={{ position: 'relative' }}>
                    <div ref={refTrangThai} style={{ position: 'relative' }}>
                        <Card title={<ChartCardTitle title="Trạng thái cơ sở" chartType="donut" currentData={bieu_do_trang_thai} cardRef={refTrangThai} />} bordered={false}
                            style={{ borderRadius: 10, boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
                            <DonutChart data={bieu_do_trang_thai} />
                        </Card>
                    </div>
                </Col>
            </Row>

            <div ref={refSoLuong} style={{ position: 'relative' }}>
                <Card title={<ChartCardTitle title="Số lượng khu nhà, phòng, thiết bị theo cơ sở" chartType="bar" currentData={bieu_do_so_luong} cardRef={refSoLuong} />} bordered={false}
                    style={{ borderRadius: 10, boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}
                >
                    <StyledBarChart
                        data={bieu_do_so_luong}
                        height={300}
                        margin={{ bottom: 50, left: 8 }}
                        bars={[
                            { dataKey: 'soKhuNha',  name: 'Toà nhà',  fill: P.blue,   barSize: 16 },
                            { dataKey: 'soPhong',   name: 'Phòng',    fill: P.green,  barSize: 16 },
                            { dataKey: 'soThietBi', name: 'Thiết bị', fill: P.purple, barSize: 16 },
                        ]}
                    >
                        <XAxis dataKey="name" angle={-12} textAnchor="end" interval={0} tick={{ ...axisStyle, fontSize: 11 }} />
                        <YAxis tick={axisStyle} />
                    </StyledBarChart>
                </Card>
            </div>

            <Card title={`Chi tiết (${chi_tiet?.length || 0} cơ sở)`} bordered={false}
                style={{ borderRadius: 10, boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
                <Table dataSource={chi_tiet} columns={columns} rowKey="id"
                    pagination={{ pageSize: 10 }} scroll={{ x: 900 }} size="small" />
            </Card>
        </Space>
    );
};

// ─────────────────────────────────────────────────────
// TAB: TOÀ NHÀ
// ─────────────────────────────────────────────────────
const TabKhuNha = ({ data, danhSachCoSo }) => {
    const [filterCoSo, setFilterCoSo] = useState(null);
    const { chi_tiet } = data;

    // Refs cho AI Insight focus
    const refLoai = useRef(null);
    const refTrangThai = useRef(null);
    const refDienTich = useRef(null);

    // Lọc dữ liệu theo cơ sở được chọn
    const filteredData = useMemo(() => {
        const list = filterCoSo
            ? chi_tiet.filter(r => r.co_so_id === filterCoSo)
            : chi_tiet;

        // Tính toán tổng quan từ dữ liệu đã lọc
        const tong_quan = {
            tong_khu_nha: list.length,
            tong_dien_tich_san: list.reduce((s, r) => s + (parseFloat(r.tong_dien_tich_san) || 0), 0),
            tong_dt_dao_tao: list.reduce((s, r) => s + (parseFloat(r.dt_dao_tao) || 0), 0),
            khu_nha_hoat_dong: list.filter(r => r.trang_thai === 'active').length,
        };

        // Biểu đồ theo loại
        const loaiMap = {};
        list.forEach(r => {
            const k = r.loai_khu_nha || 'khac';
            if (!loaiMap[k]) loaiMap[k] = { soLuong: 0, tongDT: 0 };
            loaiMap[k].soLuong++;
            loaiMap[k].tongDT += parseFloat(r.tong_dien_tich_san) || 0;
        });
        const loaiLabels = { phong_hoc: 'Phòng học', phong_lam_viec: 'Phòng làm việc', phong_chuc_nang: 'Phòng chức năng' };
        const bieu_do_loai = Object.entries(loaiMap).map(([k, v]) => ({
            name: loaiLabels[k] || k, soLuong: v.soLuong, tongDT: v.tongDT,
        }));

        // Biểu đồ trạng thái
        const ttMap = {};
        list.forEach(r => {
            const k = r.trang_thai || 'khac';
            ttMap[k] = (ttMap[k] || 0) + 1;
        });
        const ttLabels = { active: 'Hoạt động', maintenance: 'Bảo trì', inactive: 'Không HĐ' };
        const bieu_do_trang_thai = Object.entries(ttMap).map(([k, v]) => ({
            name: ttLabels[k] || k, value: v,
        }));

        // Biểu đồ diện tích
        const bieu_do_dien_tich = list.map(r => ({
            name: r.ten_khu_nha,
            sanXD: parseFloat(r.tong_dien_tich_san) || 0,
            dtDaoTao: parseFloat(r.dt_dao_tao) || 0,
        }));

        return { tong_quan, chi_tiet: list, bieu_do_loai, bieu_do_trang_thai, bieu_do_dien_tich };
    }, [chi_tiet, filterCoSo]);

    const { tong_quan: tq, bieu_do_loai, bieu_do_dien_tich, bieu_do_trang_thai } = filteredData;

    const columns = [
        { title: 'Mã', dataIndex: 'ma_khu_nha', width: 100, fixed: 'left' },
        { title: 'Tên toà nhà', dataIndex: 'ten_khu_nha', ellipsis: true },
        { title: 'Cơ sở', dataIndex: 'ten_co_so', ellipsis: true },
        { title: 'Loại', dataIndex: 'loai_khu_nha', render: loaiKhuNhaLabel },
        { title: 'Số tầng', dataIndex: 'so_tang', align: 'center' },
        { title: 'DT sàn XD (m²)', dataIndex: 'tong_dien_tich_san', align: 'right', render: v => formatNumber(v) },
        { title: 'DT đào tạo (m²)', dataIndex: 'dt_dao_tao', align: 'right', render: v => formatNumber(parseFloat(v)) },
        { title: 'Số phòng', dataIndex: 'so_phong', align: 'center' },
        { title: 'Thiết bị', dataIndex: 'so_thiet_bi', align: 'center' },
        { title: 'Năm XD', dataIndex: 'nam_xay_dung', align: 'center' },
        { title: 'Trạng thái', dataIndex: 'trang_thai', render: trangThaiTag },
    ];

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Filter */}
            <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
                <Space wrap>
                    <span style={{ fontWeight: 600 }}>Lọc theo:</span>
                    <Select
                        placeholder="Tất cả cơ sở"
                        allowClear
                        style={{ width: 220 }}
                        value={filterCoSo}
                        onChange={setFilterCoSo}
                        options={danhSachCoSo?.map(cs => ({ value: cs.id, label: cs.ten_co_so })) || []}
                    />
                </Space>
            </Card>

            <Row gutter={[16, 16]}>
                {[
                    { title: 'Tổng toà nhà',    value: tq?.tong_khu_nha,                                          icon: <HomeOutlined />,      color: P.blue },
                    { title: 'Tổng DT sàn XD', value: `${formatNumber(tq?.tong_dien_tich_san)} m²`,              icon: <AreaChartOutlined />,  color: P.green },
                    { title: 'Tổng DT đào tạo', value: `${formatNumber(Math.round(tq?.tong_dt_dao_tao || 0))} m²`,    icon: <AreaChartOutlined />,  color: P.teal },
                    { title: 'Đang hoạt động', value: tq?.khu_nha_hoat_dong,                                       icon: <HomeOutlined />,       color: P.green },
                ].map((item, i) => (
                    <Col xs={24} sm={12} lg={6} key={i}>
                        <KpiCard title={item.title} value={item.value} icon={item.icon} color={item.color} />
                    </Col>
                ))}
            </Row>

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={12} style={{ position: 'relative' }}>
                    <div ref={refLoai} style={{ position: 'relative' }}>
                        <Card title={<ChartCardTitle title="Phân bố theo loại toà nhà" chartType="bar" currentData={bieu_do_loai} cardRef={refLoai} />} bordered={false}
                            style={{ borderRadius: 10, boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
                            <StyledBarChart
                                data={bieu_do_loai}
                                bars={[{ dataKey: 'soLuong', name: 'Số lượng', fill: P.blue, barSize: 40 }]}
                            >
                                <XAxis dataKey="name" tick={axisStyle} />
                                <YAxis tick={axisStyle} />
                            </StyledBarChart>
                        </Card>
                    </div>
                </Col>
                <Col xs={24} lg={12} style={{ position: 'relative' }}>
                    <div ref={refTrangThai} style={{ position: 'relative' }}>
                        <Card title={<ChartCardTitle title="Trạng thái toà nhà" chartType="donut" currentData={bieu_do_trang_thai} cardRef={refTrangThai} />} bordered={false}
                            style={{ borderRadius: 10, boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
                            <DonutChart data={bieu_do_trang_thai} />
                        </Card>
                    </div>
                </Col>
            </Row>

            <div ref={refDienTich} style={{ position: 'relative' }}>
                <Card title={<ChartCardTitle title="Diện tích sàn & đào tạo theo toà nhà (m²)" chartType="bar" currentData={bieu_do_dien_tich} cardRef={refDienTich} />} bordered={false}
                    style={{ borderRadius: 10, boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
                    <StyledBarChart
                        data={bieu_do_dien_tich}
                        height={300}
                        margin={{ bottom: 50, left: 8 }}
                        bars={[
                            { dataKey: 'sanXD',    name: 'DT sàn XD',    fill: P.blue,  barSize: 16 },
                            { dataKey: 'dtDaoTao', name: 'DT đào tạo',   fill: P.green, barSize: 16 },
                        ]}
                    >
                        <XAxis dataKey="name" angle={-12} textAnchor="end" interval={0} tick={{ ...axisStyle, fontSize: 11 }} />
                        <YAxis tickFormatter={v => `${Math.round(v / 1000)}k`} tick={axisStyle} />
                    </StyledBarChart>
                </Card>
            </div>

            <Card title={`Chi tiết (${filteredData.chi_tiet?.length || 0} toà nhà)`} bordered={false}
                style={{ borderRadius: 10, boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
                <Table dataSource={filteredData.chi_tiet} columns={columns} rowKey="id"
                    pagination={{ pageSize: 10 }} scroll={{ x: 1000 }} size="small" />
            </Card>
        </Space>
    );
};

// ─────────────────────────────────────────────────────
// TAB: PHÒNG (phân trang backend)
// ─────────────────────────────────────────────────────
const TabPhong = ({ data, danhSachCoSo, danhSachKhuNha, refreshSignal }) => {
    const [filterCoSo, setFilterCoSo] = useState(null);
    const [filterKhuNha, setFilterKhuNha] = useState(null);

    // Refs cho AI Insight focus
    const refLoaiPhong = useRef(null);
    const refTrangThaiPhong = useRef(null);
    const refTang = useRef(null);

    // Phân trang backend & Thống kê theo bộ lọc
    const [tableData, setTableData] = useState({ data: [], current_page: 1, per_page: 10, total: 0 });
    const [tableLoading, setTableLoading] = useState(false);
    const [filteredStats, setFilteredStats] = useState(null);

    // KPI + biểu đồ: dùng dữ liệu lọc nếu có, nếu không thì dùng snapshot gốc
    const tq = filteredStats ? filteredStats.tq : data.tong_quan;
    const bieu_do_loai = filteredStats ? filteredStats.bieu_do_loai : data.bieu_do_loai;
    const bieu_do_trang_thai = filteredStats ? filteredStats.bieu_do_trang_thai : data.bieu_do_trang_thai;
    const bieu_do_tang = filteredStats ? filteredStats.bieu_do_tang : data.bieu_do_tang;

    // Danh sách khu nhà theo cơ sở đã chọn
    const khuNhaOptions = useMemo(() => {
        if (!filterCoSo) return danhSachKhuNha || [];
        return (danhSachKhuNha || []).filter(kn => kn.co_so_id === filterCoSo);
    }, [filterCoSo, danhSachKhuNha]);

    // Fetch chi tiết phân trang
    const fetchChiTiet = useCallback(async (page = 1, perPage = 10, filters = {}) => {
        setTableLoading(true);
        try {
            const params = {
                page,
                per_page: perPage,
                ...filters,
            };
            // Loại bỏ params rỗng
            Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });

            const res = await window.axios.get('/thong-ke/chi-tiet-phong', { params });
            if (res.data && res.data.paginator) {
                setTableData(res.data.paginator);
                setFilteredStats({
                    tq: res.data.tong_quan,
                    bieu_do_loai: res.data.bieu_do_loai,
                    bieu_do_trang_thai: res.data.bieu_do_trang_thai,
                    bieu_do_tang: res.data.bieu_do_tang,
                });
            } else {
                setTableData(res.data);
            }
        } catch (e) {
            console.error('Lỗi khi tải chi tiết phòng:', e);
        } finally {
            setTableLoading(false);
        }
    }, []);

    // Lấy filters hiện tại
    const currentFilters = useCallback(() => ({
        co_so_id: filterCoSo || '',
        khu_nha_id: filterKhuNha || '',
    }), [filterCoSo, filterKhuNha]);

    // Fetch khi mount
    useEffect(() => {
        fetchChiTiet(1, 10, currentFilters());
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Refetch khi Pusher signal
    useEffect(() => {
        if (refreshSignal > 0) {
            fetchChiTiet(tableData.current_page, tableData.per_page, currentFilters());
        }
    }, [refreshSignal]); // eslint-disable-line react-hooks/exhaustive-deps

    // Handlers — reset page về 1 khi filter thay đổi
    const handleCoSoChange = (val) => {
        setFilterCoSo(val);
        setFilterKhuNha(null);
        fetchChiTiet(1, tableData.per_page, { co_so_id: val || '', khu_nha_id: '' });
    };
    const handleKhuNhaChange = (val) => {
        setFilterKhuNha(val);
        fetchChiTiet(1, tableData.per_page, { co_so_id: filterCoSo || '', khu_nha_id: val || '' });
    };

    const columns = [
        { title: 'Mã', dataIndex: 'ma_phong', width: 90, fixed: 'left' },
        { title: 'Tên phòng', dataIndex: 'ten_phong', ellipsis: true },
        { title: 'Toà nhà', dataIndex: 'ten_khu_nha', ellipsis: true },
        { title: 'Cơ sở', dataIndex: 'ten_co_so', ellipsis: true },
        { title: 'Loại', dataIndex: 'loai_phong', render: loaiPhongLabel },
        { title: 'Tầng', dataIndex: 'tang', align: 'center' },
        { title: 'DT (m²)', dataIndex: 'dien_tich', align: 'right', render: v => formatNumber(v) },
        { title: 'Sức chứa', dataIndex: 'suc_chua', align: 'center' },
        { title: 'Thiết bị', dataIndex: 'so_thiet_bi', align: 'center' },
        { title: 'Trạng thái', dataIndex: 'trang_thai', render: trangThaiTag },
    ];

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Filter cascading */}
            <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
                <Space wrap>
                    <span style={{ fontWeight: 600 }}>Lọc theo:</span>
                    <Select
                        placeholder="Tất cả cơ sở"
                        allowClear
                        style={{ width: 220 }}
                        value={filterCoSo}
                        onChange={handleCoSoChange}
                        options={danhSachCoSo?.map(cs => ({ value: cs.id, label: cs.ten_co_so })) || []}
                    />
                    <Select
                        placeholder="Tất cả toà nhà"
                        allowClear
                        style={{ width: 220 }}
                        value={filterKhuNha}
                        onChange={handleKhuNhaChange}
                        options={khuNhaOptions.map(kn => ({ value: kn.id, label: kn.ten_khu_nha }))}
                        disabled={!filterCoSo && khuNhaOptions.length === 0}
                    />
                </Space>
            </Card>

            <Row gutter={[16, 16]}>
                {[
                    { title: 'Tổng số phòng',  value: tq?.tong_phong,                          icon: <AppstoreOutlined />, color: P.blue },
                    { title: 'Tổng diện tích', value: `${formatNumber(tq?.tong_dien_tich)} m²`, icon: <AreaChartOutlined />, color: P.green },
                    { title: 'Tổng sức chứa', value: formatNumber(tq?.tong_suc_chua),           icon: <AppstoreOutlined />, color: P.teal },
                    { title: 'Đang bảo trì',  value: tq?.phong_bao_tri,                         icon: <WarningOutlined />,  color: P.orange },
                ].map((item, i) => (
                    <Col xs={24} sm={12} lg={6} key={i}>
                        <KpiCard title={item.title} value={item.value} icon={item.icon} color={item.color} />
                    </Col>
                ))}
            </Row>

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={14} style={{ position: 'relative' }}>
                    <div ref={refLoaiPhong} style={{ position: 'relative' }}>
                        <Card title={<ChartCardTitle title="Phân bố theo loại phòng" chartType="bar" currentData={bieu_do_loai} cardRef={refLoaiPhong} />} bordered={false}
                            style={{ borderRadius: 10, boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
                            <StyledBarChart
                                data={bieu_do_loai}
                                bars={[
                                    { dataKey: 'soLuong', name: 'Số phòng',  fill: P.blue,   barSize: 28 },
                                    { dataKey: 'sucChua', name: 'Sức chứa', fill: P.purple, barSize: 28 },
                                ]}
                            >
                                <XAxis dataKey="name" tick={axisStyle} />
                                <YAxis tick={axisStyle} />
                            </StyledBarChart>
                        </Card>
                    </div>
                </Col>
                <Col xs={24} lg={10} style={{ position: 'relative' }}>
                    <div ref={refTrangThaiPhong} style={{ position: 'relative' }}>
                        <Card title={<ChartCardTitle title="Trạng thái phòng" chartType="donut" currentData={bieu_do_trang_thai} cardRef={refTrangThaiPhong} />} bordered={false}
                            style={{ borderRadius: 10, boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
                            <DonutChart data={bieu_do_trang_thai} />
                        </Card>
                    </div>
                </Col>
            </Row>

            <div ref={refTang} style={{ position: 'relative' }}>
                <Card title={<ChartCardTitle title="Phân bố phòng theo tầng" chartType="bar" currentData={bieu_do_tang} cardRef={refTang} />} bordered={false}
                    style={{ borderRadius: 10, boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
                    <StyledBarChart
                        data={bieu_do_tang}
                        height={240}
                        bars={[{ dataKey: 'soPhong', name: 'Số phòng', fill: P.teal, barSize: 32 }]}
                    >
                        <XAxis dataKey="name" tick={axisStyle} />
                        <YAxis tick={axisStyle} />
                    </StyledBarChart>
                </Card>
            </div>

            <Card title={`Chi tiết (${formatNumber(tableData.total)} phòng)`} bordered={false}
                style={{ borderRadius: 10, boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
                <Table
                    dataSource={tableData.data}
                    columns={columns}
                    rowKey="id"
                    loading={tableLoading}
                    scroll={{ x: 1000 }}
                    size="small"
                    pagination={{
                        current: tableData.current_page,
                        pageSize: tableData.per_page,
                        total: tableData.total,
                        showSizeChanger: true,
                        showTotal: (total) => `Tổng số ${formatNumber(total)} phòng`,
                        onChange: (page, pageSize) => {
                            fetchChiTiet(page, pageSize, currentFilters());
                        },
                    }}
                />
            </Card>
        </Space>
    );
};

// ─────────────────────────────────────────────────────
// TAB: THIẾT BỊ (phân trang backend)
// ─────────────────────────────────────────────────────
const TabThietBi = ({ data, danhSachCoSo, danhSachKhuNha, danhSachPhong, refreshSignal }) => {
    const [filterCoSo, setFilterCoSo] = useState(null);
    const [filterKhuNha, setFilterKhuNha] = useState(null);
    const [filterPhong, setFilterPhong] = useState(null);

    // Refs cho AI Insight focus
    const refLoaiTB = useRef(null);
    const refTrangThaiTB = useRef(null);
    const refNamMua = useRef(null);
    const refHang = useRef(null);

    // Phân trang backend & Thống kê theo bộ lọc
    const [tableData, setTableData] = useState({ data: [], current_page: 1, per_page: 10, total: 0 });
    const [tableLoading, setTableLoading] = useState(false);
    const [filteredStats, setFilteredStats] = useState(null);

    // KPI + biểu đồ: dùng dữ liệu lọc nếu có, nếu không thì dùng snapshot gốc
    const tq = filteredStats ? filteredStats.tq : data.tong_quan;
    const bieu_do_loai = filteredStats ? filteredStats.bieu_do_loai : data.bieu_do_loai;
    const bieu_do_trang_thai = filteredStats ? filteredStats.bieu_do_trang_thai : data.bieu_do_trang_thai;
    const bieu_do_nam_mua = filteredStats ? filteredStats.bieu_do_nam_mua : data.bieu_do_nam_mua;
    const bieu_do_hang = filteredStats ? filteredStats.bieu_do_hang : data.bieu_do_hang;

    // Danh sách khu nhà theo cơ sở
    const khuNhaOptions = useMemo(() => {
        if (!filterCoSo) return danhSachKhuNha || [];
        return (danhSachKhuNha || []).filter(kn => kn.co_so_id === filterCoSo);
    }, [filterCoSo, danhSachKhuNha]);

    // Danh sách phòng theo khu nhà
    const phongOptions = useMemo(() => {
        if (!filterKhuNha) return danhSachPhong || [];
        return (danhSachPhong || []).filter(p => p.khu_nha_id === filterKhuNha);
    }, [filterKhuNha, danhSachPhong]);

    // Fetch chi tiết phân trang
    const fetchChiTiet = useCallback(async (page = 1, perPage = 10, filters = {}) => {
        setTableLoading(true);
        try {
            const params = {
                page,
                per_page: perPage,
                ...filters,
            };
            Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });

            const res = await window.axios.get('/thong-ke/chi-tiet-thiet-bi', { params });
            if (res.data && res.data.paginator) {
                setTableData(res.data.paginator);
                setFilteredStats({
                    tq: res.data.tong_quan,
                    bieu_do_loai: res.data.bieu_do_loai,
                    bieu_do_trang_thai: res.data.bieu_do_trang_thai,
                    bieu_do_nam_mua: res.data.bieu_do_nam_mua,
                    bieu_do_hang: res.data.bieu_do_hang,
                });
            } else {
                setTableData(res.data);
            }
        } catch (e) {
            console.error('Lỗi khi tải chi tiết thiết bị:', e);
        } finally {
            setTableLoading(false);
        }
    }, []);

    // Lấy filters hiện tại
    const currentFilters = useCallback(() => ({
        co_so_id: filterCoSo || '',
        khu_nha_id: filterKhuNha || '',
        phong_id: filterPhong || '',
    }), [filterCoSo, filterKhuNha, filterPhong]);

    // Fetch khi mount
    useEffect(() => {
        fetchChiTiet(1, 10, currentFilters());
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Refetch khi Pusher signal
    useEffect(() => {
        if (refreshSignal > 0) {
            fetchChiTiet(tableData.current_page, tableData.per_page, currentFilters());
        }
    }, [refreshSignal]); // eslint-disable-line react-hooks/exhaustive-deps

    // Handlers — reset page về 1 khi filter thay đổi
    const handleCoSoChange = (val) => {
        setFilterCoSo(val);
        setFilterKhuNha(null);
        setFilterPhong(null);
        fetchChiTiet(1, tableData.per_page, { co_so_id: val || '' });
    };
    const handleKhuNhaChange = (val) => {
        setFilterKhuNha(val);
        setFilterPhong(null);
        fetchChiTiet(1, tableData.per_page, { co_so_id: filterCoSo || '', khu_nha_id: val || '' });
    };
    const handlePhongChange = (val) => {
        setFilterPhong(val);
        fetchChiTiet(1, tableData.per_page, { co_so_id: filterCoSo || '', khu_nha_id: filterKhuNha || '', phong_id: val || '' });
    };

    const columns = [
        { title: 'Mã TB', dataIndex: 'ma_thiet_bi', width: 100, fixed: 'left' },
        { title: 'Tên thiết bị', dataIndex: 'ten_thiet_bi', ellipsis: true },
        { title: 'Loại', dataIndex: 'loai_thiet_bi', render: loaiThietBiLabel },
        { title: 'Hãng', dataIndex: 'hang_san_xuat', ellipsis: true },
        { title: 'Model', dataIndex: 'model', ellipsis: true },
        { title: 'Phòng', dataIndex: 'ten_phong', ellipsis: true },
        { title: 'Toà nhà', dataIndex: 'ten_khu_nha', ellipsis: true },
        { title: 'Năm SX', dataIndex: 'nam_san_xuat', align: 'center' },
        { title: 'Năm mua', dataIndex: 'nam_mua', align: 'center' },
        { title: 'Giá trị', dataIndex: 'gia_tri', align: 'right', render: v => formatCurrency(v) },
        {
            title: 'Bảo dưỡng', dataIndex: 'qua_han_bao_duong', align: 'center',
            render: (v) => v ? <Tooltip title="Quá hạn bảo dưỡng"><Tag color="red">Quá hạn</Tag></Tooltip> : null,
        },
        { title: 'Trạng thái', dataIndex: 'trang_thai', render: trangThaiTag },
    ];

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Filter cascading */}
            <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
                <Space wrap>
                    <span style={{ fontWeight: 600 }}>Lọc theo:</span>
                    <Select
                        placeholder="Tất cả cơ sở"
                        allowClear
                        style={{ width: 200 }}
                        value={filterCoSo}
                        onChange={handleCoSoChange}
                        options={danhSachCoSo?.map(cs => ({ value: cs.id, label: cs.ten_co_so })) || []}
                    />
                    <Select
                        placeholder="Tất cả toà nhà"
                        allowClear
                        style={{ width: 200 }}
                        value={filterKhuNha}
                        onChange={handleKhuNhaChange}
                        options={khuNhaOptions.map(kn => ({ value: kn.id, label: kn.ten_khu_nha }))}
                    />
                    <Select
                        placeholder="Tất cả phòng"
                        allowClear
                        style={{ width: 200 }}
                        value={filterPhong}
                        onChange={handlePhongChange}
                        options={phongOptions.map(p => ({ value: p.id, label: p.ten_phong }))}
                    />
                </Space>
            </Card>

            <Row gutter={[16, 16]}>
                {[
                    { title: 'Tổng thiết bị', value: tq?.tong_thiet_bi,              icon: <ToolOutlined />,    color: P.blue },
                    { title: 'Tổng giá trị',  value: formatCurrency(tq?.tong_gia_tri), tooltip: formatCurrencyFull(tq?.tong_gia_tri), icon: <DollarOutlined />, color: P.purple },
                    { title: 'Cần bảo dưỡng', value: tq?.can_bao_duong,              icon: <WarningOutlined />, color: P.red },
                    { title: 'Đang hoạt động', value: tq?.dang_hoat_dong,             icon: <ToolOutlined />,    color: P.green },
                ].map((item, i) => (
                    <Col xs={24} sm={12} lg={6} key={i}>
                        <KpiCard title={item.title} value={item.value} tooltip={item.tooltip} icon={item.icon} color={item.color} />
                    </Col>
                ))}
            </Row>

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={14} style={{ position: 'relative' }}>
                    <div ref={refLoaiTB} style={{ position: 'relative' }}>
                        <Card title={<ChartCardTitle title="Số lượng & giá trị theo loại thiết bị" chartType="bar" currentData={bieu_do_loai} cardRef={refLoaiTB} />} bordered={false}
                            style={{ borderRadius: 10, boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
                            <StyledBarChart
                                data={bieu_do_loai}
                                bars={[
                                    { dataKey: 'soLuong',    name: 'Số lượng', fill: P.blue,   barSize: 28, yAxisId: 'left' },
                                    { dataKey: 'tongGiaTri', name: 'Giá trị',  fill: P.purple, barSize: 28, yAxisId: 'right' },
                                ]}
                            >
                                <XAxis dataKey="name" tick={axisStyle} />
                                <YAxis yAxisId="left" tick={axisStyle} />
                                <YAxis yAxisId="right" orientation="right" tickFormatter={v => `${Math.round(v / 1e6)}M`} tick={axisStyle} />
                            </StyledBarChart>
                        </Card>
                    </div>
                </Col>
                <Col xs={24} lg={10} style={{ position: 'relative' }}>
                    <div ref={refTrangThaiTB} style={{ position: 'relative' }}>
                        <Card title={<ChartCardTitle title="Trạng thái thiết bị" chartType="donut" currentData={bieu_do_trang_thai} cardRef={refTrangThaiTB} />} bordered={false}
                            style={{ borderRadius: 10, boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
                            <DonutChart data={bieu_do_trang_thai} />
                        </Card>
                    </div>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={14} style={{ position: 'relative' }}>
                    <div ref={refNamMua} style={{ position: 'relative' }}>
                        <Card title={<ChartCardTitle title="Xu hướng mua sắm theo năm" chartType="area" currentData={bieu_do_nam_mua} cardRef={refNamMua} />} bordered={false}
                            style={{ borderRadius: 10, boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
                            <ResponsiveContainer width="100%" height={260}>
                                <AreaChart data={bieu_do_nam_mua} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"  stopColor={P.blue}   stopOpacity={0.2} />
                                            <stop offset="95%" stopColor={P.blue}   stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gradPurple" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"  stopColor={P.purple} stopOpacity={0.2} />
                                            <stop offset="95%" stopColor={P.purple} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid {...gridStyle} />
                                    <XAxis dataKey="name" tick={axisStyle} />
                                    <YAxis yAxisId="left"  tick={axisStyle} />
                                    <YAxis yAxisId="right" orientation="right" tickFormatter={v => `${Math.round(v / 1e6)}M`} tick={axisStyle} />
                                    <RTooltip {...tooltipStyle} formatter={(v, name) => name === 'Giá trị' ? formatCurrency(v) : v} />
                                    <Legend iconType="circle" iconSize={8}
                                        formatter={(value) => <span style={{ color: '#555', fontSize: 12 }}>{value}</span>} />
                                    <Area yAxisId="left"  type="monotone" dataKey="soLuong"    name="Số lượng"
                                        stroke={P.blue}   strokeWidth={2.5} fill="url(#gradBlue)"
                                        dot={{ r: 4, fill: P.blue,   strokeWidth: 0 }}
                                        activeDot={{ r: 6 }} />
                                    <Area yAxisId="right" type="monotone" dataKey="tongGiaTri" name="Giá trị"
                                        stroke={P.purple} strokeWidth={2.5} fill="url(#gradPurple)"
                                        dot={{ r: 4, fill: P.purple, strokeWidth: 0 }}
                                        activeDot={{ r: 6 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Card>
                    </div>
                </Col>
                <Col xs={24} lg={10} style={{ position: 'relative' }}>
                    <div ref={refHang} style={{ position: 'relative' }}>
                        <Card title={<ChartCardTitle title="Top 10 hãng sản xuất" chartType="bar-horizontal" currentData={bieu_do_hang} cardRef={refHang} />} bordered={false}
                            style={{ borderRadius: 10, boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={bieu_do_hang} layout="vertical"
                                    margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                                    <CartesianGrid strokeDasharray="0" stroke="#f0f0f0" strokeWidth={1} horizontal={false} />
                                    <XAxis type="number" tick={axisStyle} />
                                    <YAxis type="category" dataKey="name" width={85} tick={{ ...axisStyle, fontSize: 11 }} />
                                    <RTooltip {...tooltipStyle} />
                                    <Bar dataKey="soLuong" name="Số lượng" fill={P.teal} barSize={14} radius={[0, 4, 4, 0]}
                                        background={{ fill: '#f5f5f5', radius: [0, 4, 4, 0] }} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>
                    </div>
                </Col>
            </Row>

            <Card title={`Chi tiết (${formatNumber(tableData.total)} thiết bị)`} bordered={false}
                style={{ borderRadius: 10, boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
                <Table
                    dataSource={tableData.data}
                    columns={columns}
                    rowKey="id"
                    loading={tableLoading}
                    scroll={{ x: 1200 }}
                    size="small"
                    rowClassName={(r) => r.qua_han_bao_duong ? 'ant-table-row-warning' : ''}
                    pagination={{
                        current: tableData.current_page,
                        pageSize: tableData.per_page,
                        total: tableData.total,
                        showSizeChanger: true,
                        showTotal: (total) => `Tổng số ${formatNumber(total)} thiết bị`,
                        onChange: (page, pageSize) => {
                            fetchChiTiet(page, pageSize, currentFilters());
                        },
                    }}
                />
            </Card>

            <style>{`.ant-table-row-warning > td { background-color: #fff7e6 !important; }`}</style>
        </Space>
    );
};

// ─────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────
const ThongKeIndex = ({ thongKeCoSo: initCoSo, thongKeKhuNha: initKhuNha, thongKePhong: initPhong, thongKeThietBi: initThietBi, danhSachCoSo, danhSachKhuNha, danhSachPhong }) => {
    const [tab, setTab] = useState('co-so');
    const [recalculating, setRecalculating] = useState(false);

    // State quản lý dữ liệu thống kê — khởi tạo từ Inertia props
    const [dataCoSo, setDataCoSo] = useState(initCoSo || {});
    const [dataKhuNha, setDataKhuNha] = useState(initKhuNha || {});
    const [dataPhong, setDataPhong] = useState(initPhong || {});
    const [dataThietBi, setDataThietBi] = useState(initThietBi || {});

    // Signal để trigger refetch bảng chi tiết phân trang (chỉ tab đang active)
    const [refreshPhong, setRefreshPhong] = useState(0);
    const [refreshThietBi, setRefreshThietBi] = useState(0);
    const tabRef = useRef(tab);
    useEffect(() => { tabRef.current = tab; }, [tab]);

    // Lắng nghe realtime updates từ Pusher
    const handleRealtimeUpdate = useCallback(async ({ updatedKeys }) => {
        const thongKeKeys = [
            'thongke.co_so',
            'thongke.khu_nha',
            'thongke.phong',
            'thongke.thiet_bi',
        ];

        const hasThongKeUpdate = Array.isArray(updatedKeys) && updatedKeys.some((k) => thongKeKeys.includes(k));
        if (!hasThongKeUpdate) return;

        try {
            const res = await window.axios.get('/thong-ke/snapshots', {
                params: { keys: thongKeKeys.join(',') }
            });
            if (res.data && res.data.success) {
                const snapshots = res.data.snapshots || {};
                if (snapshots['thongke.co_so']) setDataCoSo(snapshots['thongke.co_so']);
                if (snapshots['thongke.khu_nha']) setDataKhuNha(snapshots['thongke.khu_nha']);
                if (snapshots['thongke.phong']) setDataPhong(snapshots['thongke.phong']);
                if (snapshots['thongke.thiet_bi']) setDataThietBi(snapshots['thongke.thiet_bi']);
            }
        } catch (e) {
            console.error('Lỗi khi tải snapshot mới cho Thống kê:', e);
        }

        // Refetch bảng chi tiết phân trang — chỉ tab đang active
        const activeTab = tabRef.current;
        if (activeTab === 'phong' && updatedKeys.includes('thongke.phong')) {
            setRefreshPhong(prev => prev + 1);
        }
        if (activeTab === 'thiet-bi' && updatedKeys.includes('thongke.thiet_bi')) {
            setRefreshThietBi(prev => prev + 1);
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

    const options = [
        { label: <Space><BankOutlined />Cơ sở</Space>,      value: 'co-so'    },
        { label: <Space><HomeOutlined />Toà nhà</Space>,    value: 'khu-nha'  },
        { label: <Space><AppstoreOutlined />Phòng</Space>,  value: 'phong'    },
        { label: <Space><ToolOutlined />Thiết bị</Space>,   value: 'thiet-bi' },
    ];

    return (
        <MainLayout>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <Title level={2} style={{ margin: 0 }}>
                            <AreaChartOutlined style={{ marginRight: 8, color: P.blue }} />
                            Thống kê chi tiết
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
                    <Segmented options={options} value={tab} onChange={setTab} size="large" />
                </div>

                {tab === 'co-so'    && <TabCoSo    data={dataCoSo}    />}
                {tab === 'khu-nha'  && <TabKhuNha  data={dataKhuNha} danhSachCoSo={danhSachCoSo} />}
                {tab === 'phong'    && <TabPhong   data={dataPhong}  danhSachCoSo={danhSachCoSo} danhSachKhuNha={danhSachKhuNha} refreshSignal={refreshPhong} />}
                {tab === 'thiet-bi' && <TabThietBi data={dataThietBi} danhSachCoSo={danhSachCoSo} danhSachKhuNha={danhSachKhuNha} danhSachPhong={danhSachPhong} refreshSignal={refreshThietBi} />}
            </Space>
        </MainLayout>
    );
};

export default ThongKeIndex;

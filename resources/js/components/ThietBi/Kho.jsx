import React, { useState, useEffect } from 'react';
import MainLayout from '../Layout/MainLayout';
import {
    Table, Space, Input, Tag, Card, Row, Col, Select, Skeleton, Statistic, Empty,
    Button, DatePicker, Modal, Typography, Descriptions, Badge, Tooltip,
} from 'antd';
import {
    SearchOutlined,
    ReloadOutlined,
    HistoryOutlined,
    SwapOutlined,
    CalendarOutlined,
    EyeOutlined,
    ToolOutlined,
    StopOutlined,
} from '@ant-design/icons';
import { router, Head } from '@inertiajs/react';
import dayjs from 'dayjs';
import KpiCard from '../Common/KpiCard';

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

const LOAI_TB_MAP = {
    van_phong: { color: 'blue', label: 'Văn phòng' },
    day_hoc: { color: 'green', label: 'Dạy học' },
    thi_nghiem: { color: 'purple', label: 'Thí nghiệm' },
    thuc_hanh: { color: 'orange', label: 'Thực hành' },
};

const Kho = ({ thietBis, stats, phongs, filters }) => {
    const [searchText, setSearchText] = useState(filters.search || '');
    const [phongFilter, setPhongFilter] = useState(filters.phong_id || '');
    const [dateRange, setDateRange] = useState(
        filters.ngay_vao_kho_tu && filters.ngay_vao_kho_den
            ? [dayjs(filters.ngay_vao_kho_tu), dayjs(filters.ngay_vao_kho_den)]
            : null
    );
    const [loading, setLoading] = useState(true);
    const [detailModal, setDetailModal] = useState(null);

    useEffect(() => {
        setLoading(false);
    }, [thietBis]);

    const doFilter = (overrides = {}) => {
        router.get('/kho', {
            search: searchText,
            phong_id: phongFilter,
            ngay_vao_kho_tu: dateRange?.[0]?.format('YYYY-MM-DD') || '',
            ngay_vao_kho_den: dateRange?.[1]?.format('YYYY-MM-DD') || '',
            per_page: thietBis.per_page,
            ...overrides,
        }, { preserveState: true, replace: true });
    };

    const handleSearch = (value) => {
        doFilter({ search: value });
    };

    const handlePhongFilter = (value) => {
        setPhongFilter(value ?? '');
        doFilter({ phong_id: value ?? '' });
    };

    const handleDateRange = (dates) => {
        setDateRange(dates);
        doFilter({
            ngay_vao_kho_tu: dates?.[0]?.format('YYYY-MM-DD') || '',
            ngay_vao_kho_den: dates?.[1]?.format('YYYY-MM-DD') || '',
        });
    };

    const handleReset = () => {
        setSearchText('');
        setPhongFilter('');
        setDateRange(null);
        router.get('/kho');
    };

    const formatCurrencyFull = (value) => {
        if (!value) return '—';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
    };

    const formatCurrency = (value) => {
        const val = Number(value) || 0;
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

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return dayjs(dateStr).format('DD/MM/YYYY');
    };

    const columns = [
        {
            title: 'STT',
            key: 'index',
            width: 60,
            align: 'center',
            render: (_, __, index) =>
                (thietBis.current_page - 1) * thietBis.per_page + index + 1,
        },
        {
            title: 'Lưu lịch sử ngày',
            dataIndex: 'hieu_luc_den',
            key: 'hieu_luc_den',
            width: 120,
            render: formatDate,
        },
        {
            title: 'Thiết bị',
            key: 'thiet_bi',
            width: 200,
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{record.ten_thiet_bi}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        {record.ma_thiet_bi}
                    </Text>
                </Space>
            ),
        },
        {
            title: 'Mã phòng',
            dataIndex: ['phong', 'ma_phong'],
            key: 'ma_phong',
            width: 120,
            ellipsis: true,
            render: (text) => text || <Tag>Chưa có</Tag>,
        },
        {
            title: 'Tên phòng',
            dataIndex: ['phong', 'ten_phong'],
            key: 'ten_phong',
            width: 150,
            ellipsis: true,
            render: (text) => text || <Tag>Chưa có</Tag>,
        },
        {
            title: 'Loại',
            dataIndex: 'loai_thiet_bi',
            key: 'loai_thiet_bi',
            width: 110,
            align: 'center',
            render: (loai) => {
                const m = LOAI_TB_MAP[loai] ?? { color: 'default', label: loai };
                return <Tag color={m.color}>{m.label}</Tag>;
            },
        },
        {
            title: 'Hiện nay',
            key: 'thiet_bi_thay_the',
            width: 200,
            render: (_, record) => {
                // thiet_bi_thay_the = bản hiện hành của CÙNG thiết bị (không phải máy khác)
                const tb = record.thiet_bi_thay_the;
                if (!tb) return <Tag color="default">Ngừng sử dụng</Tag>;
                return (
                    <Space size={4}>
                        <SwapOutlined style={{ color: '#52c41a' }} />
                        <Text style={{ fontSize: 13 }}>
                            Đang dùng tại {tb.phong?.ten_phong ?? '(chưa gán phòng)'}
                        </Text>
                    </Space>
                );
            },
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 100,
            align: 'center',
            render: (_, record) => (
                <Button
                    type="primary"
                    ghost
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => setDetailModal(record)}
                >
                    Xem
                </Button>
            ),
        },
    ];

    // KPI cards
    const kpiCards = [
        {
            title: 'Bản ghi lịch sử',
            value: stats?.tong ?? 0,
            color: '#722ed1',
            icon: <HistoryOutlined />,
            bg: '#f9f0ff',
        },
        {
            title: 'Thiết bị có thay đổi',
            value: stats?.da_thay_the ?? stats?.tong ?? 0,
            color: '#52c41a',
            icon: <SwapOutlined />,
            bg: '#f6ffed',
        },
        {
            title: 'Ghi nhận tháng này',
            value: stats?.thang_nay ?? 0,
            color: '#1890ff',
            icon: <CalendarOutlined />,
            bg: '#e6f7ff',
        },
        {
            title: 'Đã ngừng sử dụng',
            value: stats?.da_ngung ?? 0,
            color: '#fa8c16',
            icon: <StopOutlined />,
            bg: '#fff7e6',
            tooltip: 'Số thiết bị đã ngừng hẳn (không còn đang dùng ở đâu)',
        },
    ];

    return (
        <MainLayout>
            <Head title="Lịch sử Thiết bị" />
            <Space direction="vertical" size="large" style={{ width: '100%' }}>

                {/* KPI Cards */}
                <Row gutter={[16, 16]}>
                    {kpiCards.map((k, i) => (
                        <Col xs={24} sm={12} md={6} key={i}>
                            <KpiCard
                                title={k.title}
                                value={k.formatter ? k.formatter(k.value) : k.value}
                                tooltip={k.tooltip}
                                icon={k.icon}
                                color={k.color}
                            />
                        </Col>
                    ))}
                </Row>

                {/* Header */}
                <Card>
                    <Row gutter={[16, 16]} align="middle">
                        <Col flex="auto">
                            <Space>
                                <HistoryOutlined style={{ fontSize: 20 }} />
                                <Title level={4} style={{ margin: 0 }}>Lịch sử thiết bị</Title>
                            </Space>
                            <div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>
                                Thông tin cũ của thiết bị trước mỗi lần ghi nhận thay đổi (vd chuyển phòng), và các thiết bị đã ngừng sử dụng
                            </div>
                        </Col>
                    </Row>
                </Card>

                {/* Filters */}
                <Card>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={7}>
                            <Input
                                placeholder="Tìm theo mã, tên, serial..."
                                allowClear
                                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                                size="large"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                // onClear instead of empty-value check: Vietnamese IMEs briefly empty the input when composing the first char
                                onClear={() => handleSearch('')}
                                onPressEnter={(e) => handleSearch(e.target.value)}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={5}>
                            <Select
                                placeholder="Lọc theo phòng"
                                size="large"
                                style={{ width: '100%' }}
                                allowClear
                                showSearch
                                optionFilterProp="label"
                                value={phongFilter || undefined}
                                onChange={handlePhongFilter}
                                options={(phongs || []).map(p => ({
                                    value: p.id,
                                    label: `${p.ten_phong} - ${p.khu_nha?.ten_khu_nha ?? p.khuNha?.ten_khu_nha ?? ''}`,
                                }))}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <RangePicker
                                size="large"
                                style={{ width: '100%' }}
                                placeholder={['Từ ngày', 'Đến ngày']}
                                value={dateRange}
                                onChange={handleDateRange}
                                format="DD/MM/YYYY"
                            />
                        </Col>
                        <Col>
                            <Button icon={<ReloadOutlined />} size="large" onClick={handleReset}>
                                Làm mới
                            </Button>
                        </Col>
                    </Row>
                </Card>

                {/* Table */}
                <Card>
                    {loading ? (
                        <Skeleton active paragraph={{ rows: 10 }} />
                    ) : (
                        <Table
                            columns={columns}
                            dataSource={thietBis.data}
                            rowKey="id"
                            scroll={{ x: 870 }}
                            size="middle"
                            tableLayout="fixed"
                            locale={{
                                emptyText: <Empty
                                    description="Chưa có thiết bị nào trong lịch sử"
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                />
                            }}
                            pagination={{
                                current: thietBis.current_page,
                                pageSize: thietBis.per_page,
                                total: thietBis.total,
                                showSizeChanger: true,
                                showTotal: (total) => `Tổng số ${total} thiết bị`,
                                onChange: (page, pageSize) => {
                                    setLoading(true);
                                    router.get('/kho', {
                                        page,
                                        per_page: pageSize,
                                        search: searchText,
                                        phong_id: phongFilter,
                                        ngay_vao_kho_tu: dateRange?.[0]?.format('YYYY-MM-DD') || '',
                                        ngay_vao_kho_den: dateRange?.[1]?.format('YYYY-MM-DD') || '',
                                    }, { preserveState: true, replace: true });
                                },
                            }}
                        />
                    )}
                </Card>

                {/* Detail Modal */}
                <Modal
                    title={
                        <Space>
                            <HistoryOutlined />
                            <span>Chi tiết thiết bị (phiên bản cũ)</span>
                        </Space>
                    }
                    open={!!detailModal}
                    onCancel={() => setDetailModal(null)}
                    footer={<Button onClick={() => setDetailModal(null)}>Đóng</Button>}
                    width={750}
                    centered
                    style={{ top: 0 }}
                >
                    {detailModal && (
                        <Descriptions bordered column={2} size="small">
                            <Descriptions.Item label="Mã thiết bị" span={1}>
                                <Tag color="blue">{detailModal.ma_thiet_bi}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Loại thiết bị" span={1}>
                                <Tag color={LOAI_TB_MAP[detailModal.loai_thiet_bi]?.color}>
                                    {LOAI_TB_MAP[detailModal.loai_thiet_bi]?.label}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Tên thiết bị" span={2}>
                                <Text strong>{detailModal.ten_thiet_bi}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Phòng (lúc kết thúc)" span={1}>
                                {detailModal.phong?.ten_phong || '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Toà nhà" span={1}>
                                {detailModal.phong?.khu_nha?.ten_khu_nha || detailModal.phong?.khuNha?.ten_khu_nha || '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Cơ sở" span={2}>
                                {detailModal.phong?.khu_nha?.co_so?.ten_co_so || detailModal.phong?.khuNha?.coSo?.ten_co_so || '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Hãng sản xuất" span={1}>
                                {detailModal.hang_san_xuat || '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Model" span={1}>
                                {detailModal.model || '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Serial Number" span={1}>
                                {detailModal.serial_number ? <Tag color="cyan">{detailModal.serial_number}</Tag> : '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Năm sản xuất" span={1}>
                                {detailModal.nam_san_xuat || '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Năm mua" span={1}>
                                {detailModal.nam_mua || '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Giá trị" span={1}>
                                <Text strong style={{ color: '#52c41a' }}>
                                    {formatCurrency(detailModal.gia_tri)}
                                </Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Nguồn gốc" span={1}>
                                {detailModal.nguon_goc || '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Thời gian hiệu lực" span={2}>
                                <Space>
                                    <Badge status="success" text={`Từ: ${formatDate(detailModal.hieu_luc_tu)}`} />
                                    <Badge status="error" text={`Đến: ${formatDate(detailModal.hieu_luc_den)}`} />
                                </Space>
                            </Descriptions.Item>
                            {detailModal.thiet_bi_thay_the && (
                                <Descriptions.Item label="Hiện nay" span={2}>
                                    <Card size="small" style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
                                        <Space>
                                            <SwapOutlined style={{ color: '#52c41a' }} />
                                            <Text strong>{detailModal.thiet_bi_thay_the.ten_thiet_bi}</Text>
                                            <Text type="secondary">
                                                đang dùng tại {detailModal.thiet_bi_thay_the.phong?.ten_phong ?? '(chưa gán phòng)'}
                                            </Text>
                                        </Space>
                                    </Card>
                                </Descriptions.Item>
                            )}
                            {detailModal.mo_ta && (
                                <Descriptions.Item label="Mô tả" span={2}>
                                    <Card size="small" style={{ background: '#fafafa', borderRadius: 8 }}>
                                        <Text>{detailModal.mo_ta}</Text>
                                    </Card>
                                </Descriptions.Item>
                            )}
                        </Descriptions>
                    )}
                </Modal>

            </Space>
        </MainLayout>
    );
};

export default Kho;

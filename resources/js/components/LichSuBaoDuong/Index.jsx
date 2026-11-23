import React, { useState, useEffect } from 'react';
import MainLayout from '../Layout/MainLayout';
import {
    Table, Button, Space, Card, Row, Col, message, Select, Tag, Skeleton,
    Modal, Typography, Statistic, Badge, Tooltip, Descriptions, Input
} from 'antd';
import {
    PlusOutlined,
    ReloadOutlined,
    EyeOutlined,
    ToolOutlined,
    CheckCircleOutlined,
    SyncOutlined,
    DollarOutlined,
    HistoryOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import { Link, router, Head } from '@inertiajs/react';
import dayjs from 'dayjs';
import usePermission from '../../hooks/usePermission';
import KpiCard from '../Common/KpiCard';

const { Text, Title } = Typography;

const LOAI_BD_MAP = {
    'dinh_ky': { color: 'blue', label: 'Định kỳ' },
    'sua_chua': { color: 'orange', label: 'Sửa chữa' },
    'thay_the': { color: 'red', label: 'Thay thế' },
};

const TRANG_THAI_MAP = {
    'hoan_thanh': { color: 'green', label: 'Hoàn thành', icon: <CheckCircleOutlined /> },
    'dang_thuc_hien': { color: 'blue', label: 'Đang thực hiện', icon: <SyncOutlined spin /> },
    'chua_thuc_hien': { color: 'orange', label: 'Chưa thực hiện', icon: <HistoryOutlined /> },
};

const Index = ({ lichSuBaoDuongs, filters, stats }) => {
    const perm = usePermission('lich-su-bao-duong');
    const [search, setSearch] = useState(filters.search || '');
    const [loaiFilter, setLoaiFilter] = useState(filters.loai_bao_duong || '');
    const [trangThaiFilter, setTrangThaiFilter] = useState(filters.trang_thai || '');
    const [loading, setLoading] = useState(true);
    const [detailModal, setDetailModal] = useState(null);

    useEffect(() => {
        setLoading(false);
    }, [lichSuBaoDuongs]);

    const handleSearch = (value) => {
        setSearch(value);
        router.get('/lich-su-bao-duong', {
            search: value,
            loai_bao_duong: loaiFilter,
            trang_thai: trangThaiFilter,
            per_page: lichSuBaoDuongs.per_page,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleLoaiFilter = (value) => {
        setLoaiFilter(value);
        router.get('/lich-su-bao-duong', {
            search,
            loai_bao_duong: value,
            trang_thai: trangThaiFilter,
            per_page: lichSuBaoDuongs.per_page,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleTrangThaiFilter = (value) => {
        setTrangThaiFilter(value);
        router.get('/lich-su-bao-duong', {
            search,
            loai_bao_duong: loaiFilter,
            trang_thai: value,
            per_page: lichSuBaoDuongs.per_page,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleReset = () => {
        setSearch('');
        setLoaiFilter('');
        setTrangThaiFilter('');
        router.get('/lich-su-bao-duong');
    };

    const formatCurrency = (value) => {
        if (!value) return '—';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value);
    };

    const formatDate = (date) => {
        if (!date) return '—';
        return dayjs(date).format('DD/MM/YYYY');
    };

    const columns = [
        {
            title: 'STT',
            key: 'index',
            width: 60,
            align: 'center',
            render: (_, __, index) => (lichSuBaoDuongs.current_page - 1) * lichSuBaoDuongs.per_page + index + 1,
        },
        {
            title: 'Ngày bảo dưỡng',
            dataIndex: 'ngay_bao_duong',
            key: 'ngay_bao_duong',
            width: 130,
            render: formatDate,
        },
        {
            title: 'Thiết bị',
            key: 'thiet_bi',
            width: 200,
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{record.thiet_bi?.ten_thiet_bi}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        {record.thiet_bi?.ma_thiet_bi}
                    </Text>
                </Space>
            ),
        },
        {
            title: 'Mã phòng',
            dataIndex: ['thiet_bi', 'phong', 'ma_phong'],
            key: 'ma_phong',
            width: 120,
            ellipsis: true,
            render: (text) => text || <Tag>Chưa có</Tag>,
        },
        {
            title: 'Tên phòng',
            dataIndex: ['thiet_bi', 'phong', 'ten_phong'],
            key: 'ten_phong',
            width: 150,
            ellipsis: true,
            render: (text) => text || <Tag>Chưa có</Tag>,
        },
        {
            title: 'Loại',
            dataIndex: 'loai_bao_duong',
            key: 'loai_bao_duong',
            width: 110,
            align: 'center',
            render: (loai) => {
                const m = LOAI_BD_MAP[loai] ?? { color: 'default', label: loai };
                return <Tag color={m.color}>{m.label}</Tag>;
            },
        },
        {
            title: 'Trạng thái',
            dataIndex: 'trang_thai',
            key: 'trang_thai',
            width: 140,
            align: 'center',
            render: (trangThai) => {
                const m = TRANG_THAI_MAP[trangThai] ?? { color: 'default', label: trangThai };
                return <Badge color={m.color} text={m.label} />;
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

    // KPI cards config
    const kpiCards = [
        {
            title: 'Tổng lịch sử',
            value: stats?.tong ?? 0,
            color: '#244380',
            icon: <HistoryOutlined />
        },
        {
            title: 'Bảo dưỡng định kỳ',
            value: stats?.dinh_ky ?? 0,
            color: '#1890ff',
            icon: <SyncOutlined />
        },
        {
            title: 'Sửa chữa',
            value: stats?.sua_chua ?? 0,
            color: '#fa8c16',
            icon: <ToolOutlined />
        },
        {
            title: 'Tổng chi phí',
            value: stats?.tong_chi_phi ?? 0,
            color: '#52c41a',
            icon: <DollarOutlined />,
            formatter: (val) => formatCurrency(val),
        },
    ];

    return (
        <MainLayout>
            <Head title="Lịch sử Bảo dưỡng" />
            <Space direction="vertical" size="large" style={{ width: '100%' }}>

                {/* KPI Cards */}
                <Row gutter={[16, 16]}>
                    {kpiCards.map((k, i) => (
                        <Col xs={24} sm={12} md={6} key={i}>
                            <KpiCard
                                title={k.title}
                                value={k.formatter ? k.formatter(k.value) : k.value}
                                icon={k.icon}
                                color={k.color}
                            />
                        </Col>
                    ))}
                </Row>

                {/* Header + Filters */}
                <Card>
                    <Row gutter={[16, 16]} align="middle">
                        <Col flex="auto">
                            <Space>
                                <HistoryOutlined style={{ fontSize: 20 }} />
                                <Title level={4} style={{ margin: 0 }}>Lịch sử bảo dưỡng thiết bị</Title>
                            </Space>
                        </Col>
                        {perm.can_create && (
                            <Col>
                                <Link href="/lich-su-bao-duong/create">
                                    <Button type="primary" icon={<PlusOutlined />} size="large">
                                        Thêm lịch sử
                                    </Button>
                                </Link>
                            </Col>
                        )}
                    </Row>
                </Card>

                {/* Filters */}
                <Card>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={7}>
                            <Input
                                placeholder="Tìm kiếm mã TB, tên TB, serial..."
                                allowClear
                                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                                size="large"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    if (!e.target.value) handleSearch('');
                                }}
                                onPressEnter={(e) => handleSearch(e.target.value)}
                                style={{ width: '100%' }}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={5}>
                            <Select
                                placeholder="Lọc theo loại"
                                size="large"
                                style={{ width: '100%' }}
                                allowClear
                                value={loaiFilter || undefined}
                                onChange={handleLoaiFilter}
                                options={Object.entries(LOAI_BD_MAP).map(([k, v]) => ({ value: k, label: v.label }))}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={5}>
                            <Select
                                placeholder="Lọc theo trạng thái"
                                size="large"
                                style={{ width: '100%' }}
                                allowClear
                                value={trangThaiFilter || undefined}
                                onChange={handleTrangThaiFilter}
                                options={Object.entries(TRANG_THAI_MAP).map(([k, v]) => ({ value: k, label: v.label }))}
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
                            dataSource={lichSuBaoDuongs.data}
                            rowKey="id"
                            scroll={{ x: 820 }}
                            size="middle"
                            tableLayout="fixed"
                            pagination={{
                                current: lichSuBaoDuongs.current_page,
                                pageSize: lichSuBaoDuongs.per_page,
                                total: lichSuBaoDuongs.total,
                                showSizeChanger: true,
                                showTotal: (total) => `Tổng số ${total} lịch sử`,
                                onChange: (page, pageSize) => {
                                    router.get('/lich-su-bao-duong', {
                                        page,
                                        per_page: pageSize,
                                        search,
                                        loai_bao_duong: loaiFilter,
                                        trang_thai: trangThaiFilter,
                                    }, {
                                        preserveState: true,
                                        replace: true,
                                    });
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
                            <span>Chi tiết lịch sử bảo dưỡng</span>
                        </Space>
                    }
                    open={!!detailModal}
                    onCancel={() => setDetailModal(null)}
                    footer={<Button onClick={() => setDetailModal(null)}>Đóng</Button>}
                    width={700}
                    centered
                    style={{ top: 0 }}
                >
                    {detailModal && (
                        <Descriptions bordered column={2} size="small">
                            <Descriptions.Item label="Ngày bảo dưỡng" span={1}>
                                <Text strong>{formatDate(detailModal.ngay_bao_duong)}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Loại bảo dưỡng" span={1}>
                                <Tag color={LOAI_BD_MAP[detailModal.loai_bao_duong]?.color}>
                                    {LOAI_BD_MAP[detailModal.loai_bao_duong]?.label}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Thiết bị" span={2}>
                                <Space direction="vertical" size={0}>
                                    <Text strong>{detailModal.thiet_bi?.ten_thiet_bi}</Text>
                                    <Text type="secondary">{detailModal.thiet_bi?.ma_thiet_bi}</Text>
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label="Phòng" span={1}>
                                {detailModal.thiet_bi?.phong?.ten_phong || '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Toà nhà" span={1}>
                                {detailModal.thiet_bi?.phong?.khu_nha?.ten_khu_nha || '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Nội dung bảo dưỡng" span={2}>
                                <Card size="small" style={{ background: '#fafafa', borderRadius: 8 }}>
                                    <Text>{detailModal.noi_dung || '—'}</Text>
                                </Card>
                            </Descriptions.Item>
                            <Descriptions.Item label="Chi phí" span={1}>
                                <Text strong style={{ color: '#52c41a' }}>
                                    {formatCurrency(detailModal.chi_phi)}
                                </Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Trạng thái" span={1}>
                                <Badge
                                    color={TRANG_THAI_MAP[detailModal.trang_thai]?.color}
                                    text={TRANG_THAI_MAP[detailModal.trang_thai]?.label}
                                />
                            </Descriptions.Item>
                            <Descriptions.Item label="Người thực hiện" span={1}>
                                {detailModal.nguoi_thuc_hien || '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Đợt kiểm tra" span={1}>
                                {(() => {
                                    const dot = detailModal.dot_kiem_tra_thiet_bi ?? detailModal.dotKiemTraThietBi ?? null;
                                    if (!dot) return '—';
                                    const from = dot.ngay_bat_dau ? dayjs(dot.ngay_bat_dau).format('DD/MM/YYYY') : null;
                                    const to = dot.ngay_ket_thuc ? dayjs(dot.ngay_ket_thuc).format('DD/MM/YYYY') : null;
                                    return (
                                        <Space direction="vertical" size={0}>
                                            <Text>{dot.ten_dot || 'Đợt không tên'}</Text>
                                            {(from || to) ? (
                                                <Text type="secondary" style={{ fontSize: 11 }}>
                                                    {from ?? '—'} - {to ?? '—'}
                                                </Text>
                                            ) : null}
                                        </Space>
                                    );
                                })()}
                            </Descriptions.Item>
                            {detailModal.ghi_chu && (
                                <Descriptions.Item label="Ghi chú" span={2}>
                                    <Card size="small" style={{ background: '#fffbe6', borderRadius: 8 }}>
                                        <Text>{detailModal.ghi_chu}</Text>
                                    </Card>
                                </Descriptions.Item>
                            )}
                            <Descriptions.Item label="Ngày tạo" span={1}>
                                {detailModal.created_at ? dayjs(detailModal.created_at).format('DD/MM/YYYY HH:mm') : '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Cập nhật lần cuối" span={1}>
                                {detailModal.updated_at ? dayjs(detailModal.updated_at).format('DD/MM/YYYY HH:mm') : '—'}
                            </Descriptions.Item>
                        </Descriptions>
                    )}
                </Modal>

            </Space>
        </MainLayout>
    );
};

export default Index;

import React, { useState } from 'react';
import { router, usePage, Head } from '@inertiajs/react';
import MainLayout from '../Layout/MainLayout';
import usePermission from '../../hooks/usePermission';
import KpiCard from '../Common/KpiCard';
import {
    Card, Table, Typography, Space, Tag, Button, Modal,
    Input, Select, Row, Col, Statistic, Badge, Tooltip, Popconfirm,
} from 'antd';
import {
    AlertOutlined, CheckCircleOutlined, ClockCircleOutlined,
    DeleteOutlined, ExclamationCircleOutlined,
    SearchOutlined, ReloadOutlined, EyeOutlined, UserOutlined,
    FileExcelOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const MUC_DO_MAP = {
    thap: { color: 'green', label: 'Thấp' },
    trung_binh: { color: 'orange', label: 'Trung bình' },
    cao: { color: 'red', label: 'Cao' },
    khan_cap: { color: 'purple', label: 'Khẩn cấp' },
};

const TRANG_THAI_MAP = {
    yeu_cau_sua_chua: { color: 'orange', label: 'Yêu cầu sửa chữa', icon: <ClockCircleOutlined /> },
    dang_sua_chua: { color: 'blue', label: 'Đang sửa chữa', icon: <ClockCircleOutlined /> },
    hoan_thanh_sua_chua: { color: 'green', label: 'Hoàn thành sửa chữa', icon: <CheckCircleOutlined /> },
};

const BaoCaoSuCoIndex = ({ baoCaos, stats, filters, dots }) => {
    const perm = usePermission('bao-cao-su-co');
    const [search, setSearch] = useState(filters?.search || '');
    const [dotFilter, setDotFilter] = useState(filters?.dot_id || '');
    const [trangThaiFilter, setTrangThaiFilter] = useState(filters?.trang_thai || '');
    const [detailModal, setDetailModal] = useState(null);

    const doFilter = (overrides = {}) => {
        router.get('/bao-cao-su-co', {
            search,
            dot_id: dotFilter,
            trang_thai: trangThaiFilter,
            per_page: baoCaos.per_page,
            ...overrides,
        }, { preserveState: true, replace: true });
    };

    const handleReset = () => {
        setSearch(''); setDotFilter(''); setTrangThaiFilter('');
        router.get('/bao-cao-su-co');
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (dotFilter) params.append('dot_id', dotFilter);
        if (trangThaiFilter) params.append('trang_thai', trangThaiFilter);
        const qs = params.toString();
        window.location.href = `/bao-cao-su-co/export${qs ? '?' + qs : ''}`;
    };

    const handleDelete = (id) => {
        router.delete(`/bao-cao-su-co/${id}`);
    };

    const formatDate = (d) => {
        if (!d) return '—';
        return new Date(d).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
    };

    const columns = [
        {
            title: 'STT', key: 'index', width: 55, align: 'center',
            render: (_, __, i) => (baoCaos.current_page - 1) * baoCaos.per_page + i + 1,
        },
        {
            title: 'Thời gian', dataIndex: 'created_at', width: 130,
            render: formatDate,
        },
        {
            title: 'Phòng',
            render: (_, r) => {
                const phong = r.phong;
                const khuNha = phong?.khu_nha ?? phong?.khuNha;
                return (
                    <Space direction="vertical" size={2}>
                        <Text strong style={{ fontSize: 13 }}>{phong?.ten_phong}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>{khuNha?.ten_khu_nha}</Text>
                    </Space>
                );
            },
        },
        {
            title: 'Người báo',width: 110,
            render: (_, r) => (
                <Space direction="vertical" size={2}>
                    <Text>{r.ten_nguoi_bao}</Text>
                    {r.so_dien_thoai && <Text type="secondary" style={{ fontSize: 12 }}>{r.so_dien_thoai}</Text>}
                </Space>
            ),
        },
        {
            title: 'Thiết bị',
            render: (_, r) => r.thiet_bi
                ? <Tag color="blue">{r.thiet_bi.ten_thiet_bi}</Tag>
                : <Text type="secondary" style={{ fontSize: 12 }}><Tag color="red">Cơ sở vật chất khác</Tag></Text>,
        },
        {
            title: 'Mức độ', dataIndex: 'muc_do', width: 110,
            render: v => {
                const m = MUC_DO_MAP[v] ?? { color: 'default', label: v };
                return <Tag color={m.color}>{m.label}</Tag>;
            },
        },
        {
            title: 'Trạng thái', dataIndex: 'trang_thai', width: 180,
            render: (v, r) => {
                const m = TRANG_THAI_MAP[v] ?? { color: 'default', label: v };
                return (
                    <Space direction="vertical" size={2}>
                        <Badge color={m.color} text={<Text strong style={{ fontSize: 12 }}>{m.label}</Text>} />
                        {['dang_sua_chua', 'hoan_thanh_sua_chua'].includes(v) && r.nguoi_hoan_thanh && (
                            <Space size={4}>
                                <UserOutlined style={{ color: '#888', fontSize: 11 }} />
                                <Text type="secondary" style={{ fontSize: 11 }}>{r.nguoi_hoan_thanh}</Text>
                            </Space>
                        )}
                        {v === 'hoan_thanh_sua_chua' && r.ngay_hoan_thanh && (
                            <Text type="secondary" style={{ fontSize: 11 }}>{formatDate(r.ngay_hoan_thanh)}</Text>
                        )}
                    </Space>
                );
            },
        },
        {
            title: 'Thao tác', key: 'action', width: 90, align: 'center', fixed: 'right',
            render: (_, r) => (
                <Space>
                    <Tooltip title="Xem chi tiết">
                        <Button size="small" icon={<EyeOutlined />} onClick={() => setDetailModal(r)} />
                    </Tooltip>
                    {perm.can_delete && (
                        <Popconfirm
                            title="Xóa báo cáo này?"
                            okText="Xóa" cancelText="Hủy" okType="danger"
                            onConfirm={() => handleDelete(r.id)}
                        >
                            <Button size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    const kpiCards = [
        { title: 'Tổng báo cáo', value: stats?.tong ?? 0, color: '#244380', icon: <AlertOutlined /> },
        { title: 'Yêu cầu sửa chữa', value: stats?.yeu_cau ?? 0, color: '#fa8c16', icon: <ClockCircleOutlined /> },
        { title: 'Đang sửa chữa', value: stats?.dang_sua ?? 0, color: '#1890ff', icon: <ClockCircleOutlined /> },
        { title: 'Hoàn thành sửa chữa', value: stats?.hoan_thanh ?? 0, color: '#52c41a', icon: <CheckCircleOutlined /> },
    ];

    return (
        <MainLayout>
            <Head title="Báo cáo Sự cố" />
            <Space direction="vertical" size="large" style={{ width: '100%' }}>

                {/* KPIs */}
                <Row gutter={[16, 16]}>
                    {kpiCards.map((k, i) => (
                        <Col xs={24} sm={12} md={6} key={i}>
                            <KpiCard
                                title={k.title}
                                value={k.value}
                                icon={k.icon}
                                color={k.color}
                            />
                        </Col>
                    ))}
                </Row>

                {/* Filters */}
                <Card>
                    <Row gutter={[16, 12]}>
                        <Col xs={12} sm={5}>
                            <Input
                                placeholder="Tìm theo tên, SĐT, mô tả..."
                                prefix={<SearchOutlined />}
                                size="large"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onPressEnter={() => doFilter()}
                                allowClear
                            />
                        </Col>
                        <Col xs={12} sm={5}>
                            <Select
                                placeholder="Đợt kiểm tra"
                                size="large"
                                style={{ width: '100%' }}
                                allowClear
                                value={dotFilter ? Number(dotFilter) : undefined}
                                onChange={v => { setDotFilter(v ?? ''); doFilter({ dot_id: v ?? '' }); }}
                                options={(dots || []).map(d => ({
                                    value: d.id,
                                    label: d.ten_dot,
                                }))}
                            />
                        </Col>
                        <Col xs={12} sm={5}>
                            <Select
                                placeholder="Trạng thái"
                                size="large"
                                style={{ width: '100%' }}
                                allowClear
                                value={trangThaiFilter || undefined}
                                onChange={v => { setTrangThaiFilter(v ?? ''); doFilter({ trang_thai: v ?? '' }); }}
                                options={Object.entries(TRANG_THAI_MAP).map(([k, v]) => ({ value: k, label: v.label }))}
                            />
                        </Col>
                        <Col>
                            <Button icon={<SearchOutlined />} size="large" type="primary" onClick={() => doFilter()}>Lọc</Button>
                        </Col>
                        <Col>
                            <Button icon={<ReloadOutlined />} size="large" onClick={handleReset}>Làm mới</Button>
                        </Col>
                        {perm.can_export && (
                            <Col>
                                <Button
                                    icon={<FileExcelOutlined />}
                                    size="large"
                                    onClick={handleExport}
                                    style={{
                                        background: '#217346',
                                        borderColor: '#217346',
                                        color: '#fff',
                                        fontWeight: 600,
                                    }}
                                >
                                    Xuất Excel
                                </Button>
                            </Col>
                        )}
                    </Row>
                </Card>

                {/* Table */}
                <Card title={
                    <Space>
                        <AlertOutlined />
                        <Title level={4} style={{ margin: 0 }}>Danh sách Báo cáo Sự cố</Title>
                    </Space>
                }>
                    <Table
                        dataSource={baoCaos.data}
                        columns={columns}
                        rowKey="id"
                        size="small"
                        scroll={{ x: 1000 }}
                        rowClassName={r =>
                            r.muc_do === 'khan_cap' && ['yeu_cau_sua_chua', 'dang_sua_chua'].includes(r.trang_thai)
                                ? 'table-row-urgent' : ''
                        }
                        pagination={{
                            current: baoCaos.current_page,
                            pageSize: baoCaos.per_page,
                            total: baoCaos.total,
                            showSizeChanger: true,
                            showTotal: t => `Tổng ${t} báo cáo`,
                            onChange: (page, pageSize) => router.get('/bao-cao-su-co', {
                                ...filters,
                                page,
                                per_page: pageSize
                            }, { preserveState: true }),
                        }}
                    />
                </Card>

                {/* Detail modal */}
                <Modal
                    title="Chi tiết Báo cáo"
                    open={!!detailModal}
                    onCancel={() => setDetailModal(null)}
                    footer={<Button onClick={() => setDetailModal(null)}>Đóng</Button>}
                >
                    {detailModal && (
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            {[
                                ['Người báo', detailModal.ten_nguoi_bao],
                                ['SĐT', detailModal.so_dien_thoai || '—'],
                                ['Phòng', detailModal.phong?.ten_phong],
                                ['Thiết bị', detailModal.thiet_bi?.ten_thiet_bi || 'Cơ sở vật chất khác'],
                                ['Mức độ', <Tag color={MUC_DO_MAP[detailModal.muc_do]?.color}>{MUC_DO_MAP[detailModal.muc_do]?.label}</Tag>],
                                ['Trạng thái', <Badge color={TRANG_THAI_MAP[detailModal.trang_thai]?.color} text={TRANG_THAI_MAP[detailModal.trang_thai]?.label} />],
                                ['Thời gian', formatDate(detailModal.created_at)],
                                ['Đợt kiểm tra', (() => {
                                    const dot = detailModal.dot_kiem_tra_thiet_bi ?? detailModal.dotKiemTraThietBi ?? null;
                                    if (!dot) return '—';
                                    const formatSimpleDate = (dateStr) => {
                                        if (!dateStr) return null;
                                        const d = new Date(dateStr);
                                        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                                    };
                                    const from = formatSimpleDate(dot.ngay_bat_dau);
                                    const to = formatSimpleDate(dot.ngay_ket_thuc);
                                    return (
                                        <Space direction="vertical" size={0}>
                                            <Text strong>{dot.ten_dot || 'Đợt không tên'}</Text>
                                            {(from || to) ? (
                                                <Text type="secondary" style={{ fontSize: 11 }}>
                                                    {from ?? '—'} - {to ?? '—'}
                                                </Text>
                                            ) : null}
                                        </Space>
                                    );
                                })()],
                            ].map(([label, value]) => (
                                <Row key={label}>
                                    <Col span={8}><Text type="secondary">{label}:</Text></Col>
                                    <Col span={16}><Text>{value}</Text></Col>
                                </Row>
                            ))}
                            <Row>
                                <Col span={8}><Text type="secondary">Mô tả:</Text></Col>
                                <Col span={16}>
                                    <Card size="small" style={{ background: '#fafafa', borderRadius: 8 }}>
                                        <Text>{detailModal.mo_ta_su_co}</Text>
                                    </Card>
                                </Col>
                            </Row>
                            {['dang_sua_chua', 'hoan_thanh_sua_chua'].includes(detailModal.trang_thai) && (
                                <Row>
                                    <Col span={8}><Text type="secondary">Người sửa:</Text></Col>
                                    <Col span={16}>
                                        <Text>{detailModal.nguoi_hoan_thanh || '—'}</Text>
                                        {detailModal.ngay_hoan_thanh && (
                                            <div><Text type="secondary" style={{ fontSize: 12 }}>{formatDate(detailModal.ngay_hoan_thanh)}</Text></div>
                                        )}
                                    </Col>
                                </Row>
                            )}
                        </Space>
                    )}
                </Modal>

            </Space>

            <style>{`.table-row-urgent > td { background-color: #fff1f0 !important; }`}</style>
        </MainLayout>
    );
};

export default BaoCaoSuCoIndex;

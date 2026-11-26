import React, { useState, useEffect } from 'react';
import MainLayout from '../Layout/MainLayout';
import { 
    Table, 
    Button, 
    Space, 
    Input, 
    Tag, 
    Card, 
    Row, 
    Col, 
    Popconfirm, 
    message, 
    Select, 
    Skeleton, 
    Collapse,
    Statistic,
    Badge,
    Empty,
    Descriptions,
    Tooltip
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    ReloadOutlined,
    AppstoreOutlined,
    UnorderedListOutlined,
    HomeOutlined,
    ToolOutlined,
    DollarOutlined,
} from '@ant-design/icons';
import { Link, router } from '@inertiajs/react';
import usePermission from '../../hooks/usePermission';
import KpiCard from '../Common/KpiCard';

const { Panel } = Collapse;

const IndexByPhong = ({ groupedThietBis, phongs, filters }) => {
    const perm = usePermission('thiet-bi');
    const [searchText, setSearchText] = useState(filters.search || '');
    const [loaiFilter, setLoaiFilter] = useState(filters.loai_thiet_bi || '');
    const [trangThaiFilter, setTrangThaiFilter] = useState(filters.trang_thai || '');
    const [loading, setLoading] = useState(true);
    const [activeKeys, setActiveKeys] = useState([]);

    useEffect(() => {
        setLoading(false);
        // Mở tất cả panels khi load
        if (groupedThietBis && groupedThietBis.length > 0) {
            setActiveKeys(groupedThietBis.map(group => group.phong_id.toString()));
        }
    }, [groupedThietBis]);

    const handleSearch = (value) => {
        router.get('/thiet-bi-theo-phong', { 
            search: value, 
            loai_thiet_bi: loaiFilter,
            trang_thai: trangThaiFilter 
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleLoaiFilter = (value) => {
        setLoaiFilter(value);
        router.get('/thiet-bi-theo-phong', { 
            search: searchText, 
            loai_thiet_bi: value,
            trang_thai: trangThaiFilter 
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleTrangThaiFilter = (value) => {
        setTrangThaiFilter(value);
        router.get('/thiet-bi-theo-phong', { 
            search: searchText, 
            loai_thiet_bi: loaiFilter,
            trang_thai: value 
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = (id) => {
        router.delete(`/thiet-bi/${id}`, {
            onSuccess: () => {
                // success toast hiển thị qua flash ở MainLayout
            },
            onError: () => {
                message.error('Có lỗi xảy ra khi xóa thiết bị!');
            },
        });
    };

    const handleReset = () => {
        setSearchText('');
        setLoaiFilter('');
        setTrangThaiFilter('');
        router.get('/thiet-bi-theo-phong');
    };

    const formatCurrencyFull = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(value || 0);
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

    const getLoaiThietBiLabel = (loai) => {
        const labels = {
            'van_phong': 'Văn phòng',
            'day_hoc': 'Dạy học',
            'thi_nghiem': 'Thí nghiệm',
            'thuc_hanh': 'Thực hành',
        };
        return labels[loai] || loai;
    };

    const getLoaiThietBiColor = (loai) => {
        const colors = {
            'van_phong': 'blue',
            'day_hoc': 'green',
            'thi_nghiem': 'purple',
            'thuc_hanh': 'orange',
        };
        return colors[loai] || 'default';
    };

    const getTrangThaiLabel = (trangThai) => {
        const labels = {
            'tot': 'Tốt',
            'can_sua_chua': 'Cần sửa chữa',
            'hu_hong': 'Hư hỏng',
        };
        return labels[trangThai] || trangThai;
    };

    const getTrangThaiColor = (trangThai) => {
        const colors = {
            'tot': 'green',
            'can_sua_chua': 'orange',
            'hu_hong': 'red',
        };
        return colors[trangThai] || 'default';
    };

    const columns = [
        {
            title: 'STT',
            key: 'index',
            width: 60,
            align: 'center',
            render: (text, record, index) => index + 1,
        },
        {
            title: 'Mã TB',
            dataIndex: 'ma_thiet_bi',
            key: 'ma_thiet_bi',
            width: 100,
        },
        {
            title: 'Tên thiết bị',
            dataIndex: 'ten_thiet_bi',
            key: 'ten_thiet_bi',
            width: 200,
            ellipsis: true,
            render: (text) => <strong>{text}</strong>,
        },
        {
            title: 'Loại TB',
            dataIndex: 'loai_thiet_bi',
            key: 'loai_thiet_bi',
            width: 110,
            render: (loai) => (
                <Tag color={getLoaiThietBiColor(loai)}>
                    {getLoaiThietBiLabel(loai)}
                </Tag>
            ),
        },
        {
            title: 'Hãng SX',
            dataIndex: 'hang_san_xuat',
            key: 'hang_san_xuat',
            width: 120,
            ellipsis: true,
        },
        {
            title: 'Model',
            dataIndex: 'model',
            key: 'model',
            width: 100,
            ellipsis: true,
        },
        {
            title: 'Serial Number',
            dataIndex: 'serial_number',
            key: 'serial_number',
            width: 140,
            ellipsis: true,
            render: (text) => <Tag color="blue">{text}</Tag>,
        },
        {
            title: 'Năm SX',
            dataIndex: 'nam_san_xuat',
            key: 'nam_san_xuat',
            width: 80,
            align: 'center',
        },
        {
            title: 'Năm mua',
            dataIndex: 'nam_mua',
            key: 'nam_mua',
            width: 80,
            align: 'center',
        },
        {
            title: 'Giá trị',
            dataIndex: 'gia_tri',
            key: 'gia_tri',
            width: 120,
            align: 'right',
            render: (value) => formatCurrency(value),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'trang_thai',
            key: 'trang_thai',
            width: 120,
            align: 'center',
            render: (trangThai) => (
                <Tag color={getTrangThaiColor(trangThai)}>
                    {getTrangThaiLabel(trangThai)}
                </Tag>
            ),
        },
        ...(perm.can_edit || perm.can_delete ? [{
            title: 'Thao tác',
            key: 'action',
            fixed: 'right',
            width: 150,
            render: (_, record) => (
                <Space size="small">
                    {perm.can_edit && (
                        <Link href={`/thiet-bi/${record.id}/edit`}>
                            <Button type="primary" size="small" icon={<EditOutlined />}>
                                Sửa
                            </Button>
                        </Link>
                    )}
                    {perm.can_delete && (
                        <Popconfirm
                            title="Xác nhận xóa"
                            description="Bạn có chắc chắn muốn xóa thiết bị này?"
                            onConfirm={() => handleDelete(record.id)}
                            okText="Xóa"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                        >
                            <Button danger size="small" icon={<DeleteOutlined />}>
                                Xóa
                            </Button>
                        </Popconfirm>
                    )}
                </Space>
            ),
        }] : []),
    ];

    // Tính tổng thống kê
    const getTotalStats = () => {
        if (!groupedThietBis || groupedThietBis.length === 0) {
            return { tongSoPhong: 0, tongSoThietBi: 0, tongSoLuong: 0, tongGiaTri: 0 };
        }

        return {
            tongSoPhong: groupedThietBis.length,
            tongSoThietBi: groupedThietBis.reduce((sum, group) => sum + group.so_thiet_bi, 0),
            tongSoLuong: groupedThietBis.reduce((sum, group) => sum + group.tong_so_luong, 0),
            tongGiaTri: groupedThietBis.reduce((sum, group) => sum + group.tong_gia_tri, 0),
        };
    };

    const totalStats = getTotalStats();

    const getPanelHeader = (group) => {
        const phong = group.phong;
        const khuNha = phong?.khu_nha;
        const coSo = khuNha?.co_so;

        return (
            <Row gutter={16} align="middle" style={{ width: '100%' }}>
                <Col flex="auto">
                    <Space size="middle">
                        <HomeOutlined style={{ fontSize: '18px', color: '#1890ff' }} />
                        <div>
                            <strong style={{ fontSize: '16px' }}>{phong?.ten_phong || 'N/A'}</strong>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                                {khuNha?.ten_khu_nha} - {coSo?.ten_co_so}
                            </div>
                        </div>
                    </Space>
                </Col>
                <Col>
                    <Space size="large">
                        <Tooltip title="Số loại thiết bị">
                            <Badge count={group.so_thiet_bi} showZero color="blue">
                                <ToolOutlined style={{ fontSize: '18px' }} />
                            </Badge>
                        </Tooltip>
                        <Statistic 
                            title="Số thiết bị" 
                            value={group.tong_so_luong} 
                            valueStyle={{ fontSize: '16px', color: '#3f8600' }}
                        />
                        <Statistic 
                            title="Tổng giá trị" 
                            value={group.tong_gia_tri} 
                            formatter={(value) => formatCurrency(value)}
                            valueStyle={{ fontSize: '16px', color: '#cf1322' }}
                        />
                    </Space>
                </Col>
            </Row>
        );
    };

    return (
        <MainLayout>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Card>
                    <Row gutter={[16, 16]} align="middle">
                        <Col flex="auto">
                            <h2 style={{ margin: 0 }}>Quản lý thiết bị theo phòng</h2>
                        </Col>
                        <Col>
                            <Space>
                                <Link href="/thiet-bi">
                                    <Button icon={<UnorderedListOutlined />} size="large">
                                        Xem dạng danh sách
                                    </Button>
                                </Link>
                                {perm.can_create && (
                                    <Link href="/thiet-bi/create">
                                        <Button type="primary" icon={<PlusOutlined />} size="large">
                                            Thêm thiết bị
                                        </Button>
                                    </Link>
                                )}
                            </Space>
                        </Col>
                    </Row>
                </Card>

                {/* Thống kê tổng quan */}
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={6}>
                        <KpiCard
                            title="Tổng số phòng"
                            value={totalStats.tongSoPhong}
                            icon={<HomeOutlined />}
                            color="#1890ff"
                        />
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <KpiCard
                            title="Tổng loại thiết bị"
                            value={totalStats.tongSoThietBi}
                            icon={<AppstoreOutlined />}
                            color="#52c41a"
                        />
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <KpiCard
                            title="Tổng thiết bị"
                            value={totalStats.tongSoLuong}
                            icon={<ToolOutlined />}
                            color="#fa8c16"
                        />
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <KpiCard
                            title="Tổng giá trị"
                            value={formatCurrency(totalStats.tongGiaTri)}
                            tooltip={formatCurrencyFull(totalStats.tongGiaTri)}
                            icon={<DollarOutlined />}
                            color="#cf1322"
                        />
                    </Col>
                </Row>

                {/* Bộ lọc */}
                <Card>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={8}>
                            <Input
                                placeholder="Tìm kiếm theo mã, tên, hãng..."
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
                        <Col xs={24} sm={12} md={6}>
                            <Select
                                placeholder="Lọc theo loại"
                                size="large"
                                style={{ width: '100%' }}
                                allowClear
                                value={loaiFilter || undefined}
                                onChange={handleLoaiFilter}
                                options={[
                                    { value: 'van_phong', label: 'Văn phòng' },
                                    { value: 'day_hoc', label: 'Dạy học' },
                                    { value: 'thi_nghiem', label: 'Thí nghiệm' },
                                    { value: 'thuc_hanh', label: 'Thực hành' },
                                ]}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Select
                                placeholder="Lọc theo trạng thái"
                                size="large"
                                style={{ width: '100%' }}
                                allowClear
                                value={trangThaiFilter || undefined}
                                onChange={handleTrangThaiFilter}
                                options={[
                                    { value: 'tot', label: 'Tốt' },
                                    { value: 'can_sua_chua', label: 'Cần sửa chữa' },
                                    { value: 'hu_hong', label: 'Hư hỏng' },
                                ]}
                            />
                        </Col>
                        <Col>
                            <Button icon={<ReloadOutlined />} size="large" onClick={handleReset}>
                                Làm mới
                            </Button>
                        </Col>
                    </Row>
                </Card>

                {/* Danh sách thiết bị theo phòng */}
                <Card>
                    {loading ? (
                        <Skeleton active paragraph={{ rows: 10 }} />
                    ) : groupedThietBis && groupedThietBis.length > 0 ? (
                        <Collapse 
                            activeKey={activeKeys}
                            onChange={setActiveKeys}
                            expandIconPosition="end"
                        >
                            {groupedThietBis.map((group) => (
                                <Panel 
                                    header={getPanelHeader(group)} 
                                    key={group.phong_id.toString()}
                                    style={{ marginBottom: '8px' }}
                                >
                                    <Table
                                        columns={columns}
                                        dataSource={group.thiet_bis}
                                        rowKey="id"
                                        scroll={{ x: 1500 }}
                                        pagination={false}
                                        size="middle"
                                    />
                                </Panel>
                            ))}
                        </Collapse>
                    ) : (
                        <Empty 
                            description="Không có thiết bị nào"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    )}
                </Card>
            </Space>
        </MainLayout>
    );
};

export default IndexByPhong;


import React, { useState, useEffect } from 'react';
import MainLayout from '../Layout/MainLayout';
import { Table, Button, Space, Input, Tag, Card, Row, Col, Popconfirm, message, Select, Skeleton } from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    ReloadOutlined,
} from '@ant-design/icons';
import { Link, router, usePage } from '@inertiajs/react';
import usePermission from '../../hooks/usePermission';
import { ImportButton } from '../Common/ImportButton';


const Index = ({ thietBis, phongs, coSos, filters }) => {
    const perm = usePermission('thiet-bi');
    const [searchText, setSearchText] = useState(filters.search || '');
    const [phongFilter, setPhongFilter] = useState(filters.phong_id || '');
    const [loaiFilter, setLoaiFilter] = useState(filters.loai_thiet_bi || '');
    const [coSoFilter, setCoSoFilter] = useState(filters.co_so_id || '');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(false);
    }, [thietBis]);

    const handleSearch = (value) => {
        router.get('/thiet-bi', {
            search: value,
            phong_id: phongFilter,
            loai_thiet_bi: loaiFilter,
            co_so_id: coSoFilter,
            per_page: thietBis.per_page,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handlePhongFilter = (value) => {
        setPhongFilter(value);
        router.get('/thiet-bi', {
            search: searchText,
            phong_id: value,
            loai_thiet_bi: loaiFilter,
            co_so_id: coSoFilter,
            per_page: thietBis.per_page,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleLoaiFilter = (value) => {
        setLoaiFilter(value);
        router.get('/thiet-bi', {
            search: searchText,
            phong_id: phongFilter,
            loai_thiet_bi: value,
            co_so_id: coSoFilter,
            per_page: thietBis.per_page,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleCoSoFilter = (value) => {
        setCoSoFilter(value);
        router.get('/thiet-bi', {
            search: searchText,
            phong_id: phongFilter,
            loai_thiet_bi: loaiFilter,
            co_so_id: value,
            per_page: thietBis.per_page,
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
        setPhongFilter('');
        setLoaiFilter('');
        setCoSoFilter('');
        router.get('/thiet-bi');
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value);
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
            render: (text, record, index) => (thietBis.current_page - 1) * thietBis.per_page + index + 1,
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
            title: 'Phòng',
            dataIndex: ['phong', 'ten_phong'],
            key: 'phong',
            width: 150,
            ellipsis: true,
            render: (text) => text || <Tag>Chưa phân bổ</Tag>,
        },
        {
            title: 'Mã phòng',
            dataIndex: ['phong', 'ma_phong'],
            key: 'ma_phong',
            width: 110,
            ellipsis: true,
            render: (text) => text || <Tag>Chưa phân bổ</Tag>,
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

    return (
        <MainLayout>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Card>
                    <Row gutter={[16, 16]} align="middle">
                        <Col flex="auto">
                            <h2 style={{ margin: 0 }}>Thiết bị</h2>
                        </Col>
                        <Col>
                            <Space>
                                <Link href="/thiet-bi-theo-phong">
                                    <Button icon={<SearchOutlined />} size="large">
                                        Xem theo phòng
                                    </Button>
                                </Link>
                                {perm.can_create && (
                                    <Link href="/thiet-bi/create">
                                        <Button type="primary" icon={<PlusOutlined />} size="large">
                                            Thêm thiết bị
                                        </Button>
                                    </Link>
                                )}
                                {perm.can_import && (
                                    <ImportButton
                                        importUrl="/thiet-bi/import"
                                        templateUrl="/thiet-bi/template"
                                        label="Thiết bị"
                                    />
                                )}
                            </Space>
                        </Col>
                    </Row>
                </Card>

                <Card>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={6}>
                            <Input
                                placeholder="Tìm kiếm theo mã, tên, hãng..."
                                allowClear
                                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                                size="large"
                                value={searchText}
                                onChange={(e) => {
                                    setSearchText(e.target.value);
                                    if (!e.target.value) handleSearch('');
                                }}
                                onPressEnter={(e) => handleSearch(e.target.value)}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={4}>
                            <Select
                                placeholder="Lọc theo cơ sở"
                                size="large"
                                style={{ width: '100%' }}
                                allowClear
                                showSearch
                                optionFilterProp="label"
                                value={coSoFilter || undefined}
                                onChange={handleCoSoFilter}
                                options={coSos?.map(cs => ({
                                    value: cs.id,
                                    label: cs.ten_co_so
                                })) || []}
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
                                options={phongs.map(p => ({
                                    value: p.id,
                                    label: `${p.ten_phong} - ${p.khu_nha.ten_khu_nha}`
                                }))}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={4}>
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
                        <Col>
                            <Button icon={<ReloadOutlined />} size="large" onClick={handleReset}>
                                Làm mới
                            </Button>
                        </Col>
                    </Row>
                </Card>

                <Card>
                    {loading ? (
                        <Skeleton active paragraph={{ rows: 10 }} />
                    ) : (
                        <Table
                            columns={columns}
                            dataSource={thietBis.data}
                            rowKey="id"
                            scroll={{ x: 1500 }}
                            pagination={{
                                current: thietBis.current_page,
                                pageSize: thietBis.per_page,
                                total: thietBis.total,
                                showSizeChanger: true,
                                showTotal: (total) => `Tổng số ${total} thiết bị`,
                                onChange: (page, pageSize) => {
                                    router.get('/thiet-bi', {
                                        page,
                                        per_page: pageSize,
                                        search: searchText,
                                        phong_id: phongFilter,
                                        loai_thiet_bi: loaiFilter,
                                        co_so_id: coSoFilter,
                                    }, {
                                        preserveState: true,
                                        replace: true,
                                    });
                                },
                            }}
                        />
                    )}
                </Card>
            </Space>
        </MainLayout>
    );
};

export default Index;


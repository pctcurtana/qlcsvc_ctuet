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


const Index = ({ khuNhas, coSos, filters }) => {
    const perm = usePermission('khu-nha');
    const [searchText, setSearchText] = useState(filters.search || '');
    const [coSoFilter, setCoSoFilter] = useState(filters.co_so_id || '');
    const [loaiFilter, setLoaiFilter] = useState(filters.loai_khu_nha || '');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(false);
    }, [khuNhas]);

    const handleSearch = (value) => {
        router.get('/khu-nha', { 
            search: value, 
            co_so_id: coSoFilter,
            loai_khu_nha: loaiFilter,
            per_page: khuNhas.per_page,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleCoSoFilter = (value) => {
        setCoSoFilter(value);
        router.get('/khu-nha', { 
            search: searchText, 
            co_so_id: value,
            loai_khu_nha: loaiFilter,
            per_page: khuNhas.per_page,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleLoaiFilter = (value) => {
        setLoaiFilter(value);
        router.get('/khu-nha', { 
            search: searchText, 
            co_so_id: coSoFilter,
            loai_khu_nha: value,
            per_page: khuNhas.per_page,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = (id) => {
        router.delete(`/khu-nha/${id}`, {
            onSuccess: () => {
                // success toast hiển thị qua flash ở MainLayout
            },
            onError: () => {
                message.error('Có lỗi xảy ra khi xóa toà nhà!');
            },
        });
    };

    const handleReset = () => {
        setSearchText('');
        setCoSoFilter('');
        setLoaiFilter('');
        router.get('/khu-nha');
    };

    const formatNumber = (value) => {
        return new Intl.NumberFormat('vi-VN').format(value);
    };

    const getLoaiKhuNhaLabel = (loai) => {
        const labels = {
            'phong_hoc': 'Phòng học',
            'phong_lam_viec': 'Phòng làm việc',
            'phong_chuc_nang': 'Phòng chức năng',
        };
        return labels[loai] || loai;
    };

    const getLoaiKhuNhaColor = (loai) => {
        const colors = {
            'phong_hoc': 'blue',
            'phong_lam_viec': 'green',
            'phong_chuc_nang': 'orange',
        };
        return colors[loai] || 'default';
    };

    const columns = [
        {
            title: 'STT',
            key: 'index',
            width: 60,
            render: (text, record, index) => (khuNhas.current_page - 1) * khuNhas.per_page + index + 1,
        },
        {
            title: 'Mã toà nhà',
            dataIndex: 'ma_khu_nha',
            key: 'ma_khu_nha',
            width: 120,
        },
        {
            title: 'Tên toà nhà',
            dataIndex: 'ten_khu_nha',
            key: 'ten_khu_nha',
            width: 150,
            ellipsis: true,
            render: (text) => <strong>{text}</strong>,
        },
        {
            title: 'Cơ sở',
            dataIndex: ['co_so', 'ten_co_so'],
            key: 'co_so',
            width: 200,
            ellipsis: true,
        },
        {
            title: 'Loại toà nhà',
            dataIndex: 'loai_khu_nha',
            key: 'loai_khu_nha',
            width: 150,

            render: (loai) => (
                <Tag color={getLoaiKhuNhaColor(loai)}>
                    {getLoaiKhuNhaLabel(loai)}
                </Tag>
            ),
        },
        {
            title: 'Số tầng',
            dataIndex: 'so_tang',
            key: 'so_tang',
            align: 'center',
            width: 80,

        },
        {
            title: 'DT xây dựng (m²)',
            dataIndex: 'dien_tich_xay_dung',
            key: 'dien_tich_xay_dung',
            align: 'right',
            width: 120,
            render: (value) => formatNumber(value),
        },
        {
            title: 'Tổng DT sàn XD (m²)',
            dataIndex: 'tong_dien_tich_san',
            key: 'tong_dien_tich_san',
            align: 'right',
            width: 130,
            render: (value) => formatNumber(value),
        },
        {
            title: 'Hệ số ĐT',
            dataIndex: 'he_so_su_dung_dao_tao',
            key: 'he_so_su_dung_dao_tao',
            align: 'center',
            width: 90,
            render: (value) => <Tag color="blue">{value}</Tag>,
        },
        {
            title: 'DT sàn đào tạo (m²)',
            dataIndex: 'dien_tich_san_dao_tao',
            key: 'dien_tich_san_dao_tao',
            align: 'right',
            width: 130,
            render: (value) => <strong>{formatNumber(value)}</strong>,
        },
        {
            title: 'Năm XD',
            dataIndex: 'nam_xay_dung',
            key: 'nam_xay_dung',
            align: 'center',
            width: 80,
        },
        {
            title: 'Số phòng',
            dataIndex: 'phongs_count',
            key: 'phongs_count',
            align: 'center',
            width: 80,
            render: (value) => <Tag color="blue">{value}</Tag>,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'trang_thai',
            key: 'trang_thai',
            align: 'center',
            width: 100,
            render: (status) => (
                <Tag color={status === 'active' ? 'green' : 'red'}>
                    {status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
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
                        <Link href={`/khu-nha/${record.id}/edit`}>
                            <Button type="primary" size="small" icon={<EditOutlined />}>
                                Sửa
                            </Button>
                        </Link>
                    )}
                    {perm.can_delete && (
                        <Popconfirm
                            title="Xác nhận xóa"
                            description="Bạn có chắc chắn muốn xóa toà nhà này?"
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
                            <h2 style={{ margin: 0 }}>Toà nhà học, chức năng</h2>
                        </Col>
                        {perm.can_create && (
                            <Col>
                                <Link href="/khu-nha/create">
                                    <Button type="primary" icon={<PlusOutlined />} size="large">
                                        Thêm toà nhà
                                    </Button>
                                </Link>
                            </Col>
                        )}
                        {perm.can_import && (
                            <Col>
                                <ImportButton
                                    importUrl="/khu-nha/import"
                                    templateUrl="/khu-nha/template"
                                    label="Toà nhà"
                                />
                            </Col>
                        )}
                    </Row>
                </Card>

                <Card>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={8}>
                            <Input
                                placeholder="Tìm kiếm theo mã, tên..."
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
                                placeholder="Lọc theo cơ sở"
                                size="large"
                                style={{ width: '100%' }}
                                allowClear
                                value={coSoFilter || undefined}
                                onChange={handleCoSoFilter}
                                options={coSos.map(cs => ({ value: cs.id, label: cs.ten_co_so }))}
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
                                    { value: 'phong_hoc', label: 'Phòng học' },
                                    { value: 'phong_lam_viec', label: 'Phòng làm việc' },
                                    { value: 'phong_chuc_nang', label: 'Phòng chức năng' },
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
                            dataSource={khuNhas.data}
                        rowKey="id"
                        scroll={{ x: 1550 }}
                        pagination={{
                            current: khuNhas.current_page,
                            pageSize: khuNhas.per_page,
                            total: khuNhas.total,
                            showSizeChanger: true,
                            showTotal: (total) => `Tổng số ${total} toà nhà`,
                            onChange: (page, pageSize) => {
                                router.get('/khu-nha', {
                                    page,
                                    per_page: pageSize,
                                    search: searchText,
                                    co_so_id: coSoFilter,
                                    loai_khu_nha: loaiFilter,
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


import React, { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import MainLayout from '../Layout/MainLayout';
import usePermission from '../../hooks/usePermission';
import {
    Card,
    Table,
    Button,
    Input,
    Select,
    Space,
    Tag,
    Popconfirm,
    Typography,
    Avatar,
    Tooltip,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    UserOutlined,
    KeyOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const UserIndex = ({ users, filters }) => {
    const { auth } = usePage().props;
    const currentUserId = auth?.user?.id;
    // Non-admin không thao tác được trên tài khoản admin (backend cũng chặn)
    const coTheThaoTac = (record) => auth?.user?.role === 'admin' || record.role !== 'admin';
    const perm = usePermission('nguoi-dung');
    
    const [search, setSearch] = useState(filters.search || '');
    const [role, setRole] = useState(filters.role || '');

    // Đếm số admin trong danh sách hiện tại (có thể không chính xác nếu phân trang)
    const adminCount = users.data.filter(u => u.role === 'admin').length;

    const handleSearch = () => {
        router.get('/nguoi-dung', { search, role, per_page: users.per_page }, { preserveState: true });
    };

    const handleDelete = (id) => {
        router.delete(`/nguoi-dung/${id}`);
    };

    // Kiểm tra có thể xóa user không
    const canDeleteUser = (record) => {
        // Không thể xóa chính mình
        if (record.id === currentUserId) return false;
        
        return true;
    };

    // Lý do không thể xóa
    const getDeleteDisabledReason = (record) => {
        if (record.id === currentUserId) {
            return 'Không thể xóa tài khoản của chính mình';
        }
        return '';
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 70,
        },
        {
            title: 'Người dùng',
            key: 'user',
            render: (_, record) => (
                <Space>
                    <Avatar 
                        style={{ 
                            backgroundColor: record.role === 'admin' ? '#f5222d' : '#1890ff' 
                        }}
                        icon={<UserOutlined />}
                    />
                    <div>
                        <div style={{ fontWeight: 500 }}>
                            {record.name}
                            {record.id === currentUserId && (
                                <Tag color="green" style={{ marginLeft: 8, fontSize: 10 }}>Bạn</Tag>
                            )}
                        </div>
                        <div style={{ fontSize: 12, color: '#666' }}>{record.email}</div>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Vai trò',
            dataIndex: 'role',
            key: 'role',
            width: 150,
            render: (role) => (
                <Tag color={role === 'admin' ? 'red' : 'blue'}>
                    {role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                </Tag>
            ),
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 150,
            render: (date) => new Date(date).toLocaleDateString('vi-VN'),
        },
        ...(perm.can_edit || perm.can_delete ? [{
            title: 'Thao tác',
            key: 'action',
            width: 280,
            render: (_, record) => (
                <Space>
                    {perm.can_edit && coTheThaoTac(record) && (
                        <Link href={`/nguoi-dung/${record.id}/edit`}>
                            <Button type="primary" size="small" icon={<EditOutlined />}>
                                Sửa
                            </Button>
                        </Link>
                    )}
                    {perm.can_edit && record.role !== 'admin' && (
                        <Link href={`/phan-quyen?user=${record.id}`}>
                            <Button size="small" icon={<KeyOutlined />}>
                                Phân quyền
                            </Button>
                        </Link>
                    )}
                    {perm.can_delete && coTheThaoTac(record) && (
                        canDeleteUser(record) ? (
                            <Popconfirm
                                title="Xác nhận xóa"
                                description="Bạn có chắc chắn muốn xóa người dùng này?"
                                onConfirm={() => handleDelete(record.id)}
                                okText="Xóa"
                                cancelText="Hủy"
                                okButtonProps={{ danger: true }}
                            >
                                <Button danger size="small" icon={<DeleteOutlined />}>
                                    Xóa
                                </Button>
                            </Popconfirm>
                        ) : (
                            <Tooltip title={getDeleteDisabledReason(record)}>
                                <Button danger size="small" icon={<DeleteOutlined />} disabled>
                                    Xóa
                                </Button>
                            </Tooltip>
                        )
                    )}
                </Space>
            ),
        }] : []),
    ];

    return (
        <MainLayout>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={2} style={{ margin: 0 }}>Quản lý người dùng</Title>
                    {perm.can_create && (
                        <Link href="/nguoi-dung/create">
                            <Button type="primary" icon={<PlusOutlined />}>
                                Thêm người dùng
                            </Button>
                        </Link>
                    )}
                </div>

                <Card>
                    <Space style={{ marginBottom: 16 }}>
                        <Input
                            placeholder="Tìm kiếm theo tên, email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onPressEnter={handleSearch}
                            style={{ width: 250 }}
                            prefix={<SearchOutlined />}
                        />
                        <Select
                            placeholder="Lọc theo vai trò"
                            value={role || undefined}
                            onChange={(value) => setRole(value)}
                            style={{ width: 150 }}
                            allowClear
                        >
                            <Option value="admin">Quản trị viên</Option>
                            <Option value="user">Người dùng</Option>
                        </Select>
                        <Button type="primary" onClick={handleSearch}>
                            Tìm kiếm
                        </Button>
                    </Space>

                    <Table
                        columns={columns}
                        dataSource={users.data}
                        rowKey="id"
                        pagination={{
                            current: users.current_page,
                            total: users.total,
                            pageSize: users.per_page,
                            showSizeChanger: true,
                            showTotal: (total) => `Tổng ${total} người dùng`,
                            onChange: (page, pageSize) => {
                                router.get('/nguoi-dung', {
                                    ...filters,
                                    page,
                                    per_page: pageSize
                                }, { preserveState: true });
                            },
                        }}
                    />
                </Card>
            </Space>
        </MainLayout>
    );
};

export default UserIndex;



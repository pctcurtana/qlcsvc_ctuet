import React from 'react';
import { useForm, Link, usePage } from '@inertiajs/react';
import MainLayout from '../Layout/MainLayout';
import {
    Card,
    Form,
    Input,
    Select,
    Button,
    Space,
    Typography,
    Alert,
    Tooltip,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined, LockOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const UserEdit = ({ user, isSelf = false, isLastAdmin = false }) => {
    const isAdmin = usePage().props.auth?.user?.role === 'admin';
    const { data, setData, put, processing, errors } = useForm({
        name: user.name || '',
        email: user.email || '',
        password: '',
        password_confirmation: '',
        role: user.role || 'user',
    });

    const handleSubmit = () => {
        put(`/nguoi-dung/${user.id}`);
    };

    // Không cho thay đổi role nếu:
    // 1. Đang sửa chính mình
    // 2. Là admin cuối cùng trong hệ thống
    const canChangeRole = !isSelf && !isLastAdmin;

    const getRoleDisabledReason = () => {
        if (isSelf) {
            return 'Không thể thay đổi vai trò của chính mình';
        }
        if (isLastAdmin) {
            return 'Không thể thay đổi vai trò của admin cuối cùng trong hệ thống';
        }
        return '';
    };

    return (
        <MainLayout>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={2} style={{ margin: 0 }}>
                        Chỉnh sửa người dùng
                        {isSelf && <Text type="secondary" style={{ fontSize: 14, marginLeft: 8 }}>(Tài khoản của bạn)</Text>}
                    </Title>
                    <Link href="/nguoi-dung">
                        <Button icon={<ArrowLeftOutlined />}>Quay lại</Button>
                    </Link>
                </div>

                <Card style={{ maxWidth: 600 }}>
                    {isSelf && (
                        <Alert
                            message="Bạn đang chỉnh sửa tài khoản của chính mình"
                            description="Bạn có thể thay đổi thông tin cá nhân và mật khẩu, nhưng không thể thay đổi vai trò của mình."
                            type="warning"
                            showIcon
                            style={{ marginBottom: 24 }}
                        />
                    )}

                    {isLastAdmin && !isSelf && (
                        <Alert
                            message="Đây là admin cuối cùng trong hệ thống"
                            description="Không thể thay đổi vai trò của admin này. Hệ thống cần ít nhất 1 admin."
                            type="warning"
                            showIcon
                            style={{ marginBottom: 24 }}
                        />
                    )}

                    <Form layout="vertical" onFinish={handleSubmit}>
                        <Form.Item
                            label="Họ và tên"
                            validateStatus={errors.name ? 'error' : ''}
                            help={errors.name}
                            required
                        >
                            <Input
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Nhập họ và tên"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Email"
                            validateStatus={errors.email ? 'error' : ''}
                            help={errors.email}
                            required
                        >
                            <Input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="Nhập email"
                            />
                        </Form.Item>

                        <Alert
                            message="Để trống nếu không muốn thay đổi mật khẩu"
                            type="info"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />

                        <Form.Item
                            label="Mật khẩu mới"
                            validateStatus={errors.password ? 'error' : ''}
                            help={errors.password}
                        >
                            <Input.Password
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="Nhập mật khẩu mới (để trống nếu không đổi)"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Xác nhận mật khẩu mới"
                            validateStatus={errors.password_confirmation ? 'error' : ''}
                            help={errors.password_confirmation}
                        >
                            <Input.Password
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                placeholder="Nhập lại mật khẩu mới"
                            />
                        </Form.Item>

                        <Form.Item
                            label={
                                <Space>
                                    <span>Vai trò</span>
                                    {!canChangeRole && (
                                        <Tooltip title={getRoleDisabledReason()}>
                                            <LockOutlined style={{ color: '#faad14' }} />
                                        </Tooltip>
                                    )}
                                </Space>
                            }
                            validateStatus={errors.role ? 'error' : ''}
                            help={errors.role || (!canChangeRole ? getRoleDisabledReason() : '')}
                            required
                        >
                            <Select
                                value={data.role}
                                onChange={(value) => setData('role', value)}
                                disabled={!canChangeRole}
                            >
                                <Option value="user">Người dùng</Option>
                                {isAdmin && <Option value="admin">Quản trị viên</Option>}
                            </Select>
                        </Form.Item>

                        <Form.Item>
                            <Space>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={processing}
                                    icon={<SaveOutlined />}
                                >
                                    Cập nhật
                                </Button>
                                <Link href="/nguoi-dung">
                                    <Button>Hủy</Button>
                                </Link>
                            </Space>
                        </Form.Item>
                    </Form>
                </Card>
            </Space>
        </MainLayout>
    );
};

export default UserEdit;



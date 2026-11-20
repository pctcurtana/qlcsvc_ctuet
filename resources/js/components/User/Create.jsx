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
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;

const UserCreate = () => {
    const isAdmin = usePage().props.auth?.user?.role === 'admin';
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'user',
    });

    const handleSubmit = () => {
        post('/nguoi-dung');
    };

    return (
        <MainLayout>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={2} style={{ margin: 0 }}>Thêm người dùng mới</Title>
                    <Link href="/nguoi-dung">
                        <Button icon={<ArrowLeftOutlined />}>Quay lại</Button>
                    </Link>
                </div>

                <Card style={{ maxWidth: 600 }}>
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

                        <Form.Item
                            label="Mật khẩu"
                            validateStatus={errors.password ? 'error' : ''}
                            help={errors.password}
                            required
                        >
                            <Input.Password
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Xác nhận mật khẩu"
                            validateStatus={errors.password_confirmation ? 'error' : ''}
                            help={errors.password_confirmation}
                            required
                        >
                            <Input.Password
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                placeholder="Nhập lại mật khẩu"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Vai trò"
                            validateStatus={errors.role ? 'error' : ''}
                            help={errors.role}
                            required
                        >
                            <Select
                                value={data.role}
                                onChange={(value) => setData('role', value)}
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
                                    Lưu người dùng
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

export default UserCreate;



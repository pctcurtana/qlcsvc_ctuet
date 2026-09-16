import React, { useState, useEffect } from 'react';
import { usePage, router, Head } from '@inertiajs/react';
import MainLayout from '../Layout/MainLayout';
import { Grid } from 'antd';
import {
    Form, Input, Button, Card, Typography, Space, Tag, Divider, Select,
    DatePicker, InputNumber, Alert, Row, Col, Statistic, Result,
} from 'antd';
import {
    ToolOutlined, CalendarOutlined, DollarOutlined,
    UserOutlined, CheckCircleOutlined, HistoryOutlined, SyncOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

const TRANG_THAI_TB_LABELS = {
    tot: { color: 'green', label: 'Tốt' },
    can_sua_chua: { color: 'orange', label: 'Cần sửa chữa' },
    hu_hong: { color: 'red', label: 'Hư hỏng' },
};

const TRANG_THAI_SUA_CHUA = [
    { value: 'dang_sua_chua', label: 'Đang sửa chữa', color: 'blue', icon: <SyncOutlined spin /> },
    { value: 'hoan_thanh', label: 'Hoàn thành', color: 'green', icon: <CheckCircleOutlined /> },
];

const LOAI_SUA_CHUA = [
    { value: 'sua_chua', label: 'Sửa chữa' },
    { value: 'thay_the', label: 'Thay thế linh kiện' },
    { value: 'dinh_ky', label: 'Bảo dưỡng định kỳ' },
];
const HINH_THUC_SUA_CHUA = [
    { value: 'dot_xuat', label: 'Sửa chữa đột xuất' },
    { value: 'dinh_ky_kiem_tra', label: 'Sửa chữa kiểm tra định kỳ' },
];

const extractNoiDungParts = (noiDung = '') => {
    const huHongMatch = noiDung.match(/Hư hỏng:\s*([\s\S]*?)(?:\n\nSửa chữa:|$)/);
    const suaChuaMatch = noiDung.match(/Sửa chữa:\s*([\s\S]*)$/);

    return {
        hu_hong_mo_ta: huHongMatch?.[1]?.trim() ?? '',
        noi_dung: suaChuaMatch?.[1]?.trim() ?? '',
    };
};

const SuaChuaForm = ({ thietBi, soLanSuaChua, token, lichSuDangSuaChua, coPhienDangSua }) => {
    const { flash, errors: serverErrors, auth } = usePage().props;
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const phong = thietBi?.phong;
    const khuNha = phong?.khu_nha ?? phong?.khuNha;
    const coSo = khuNha?.co_so ?? khuNha?.coSo;
    const tt = TRANG_THAI_TB_LABELS[thietBi?.trang_thai] ?? { color: 'default', label: thietBi?.trang_thai };
    const phienDangSua = extractNoiDungParts(lichSuDangSuaChua?.noi_dung);

    useEffect(() => {
        if (flash?.success) {
            setSubmitted(true);
        }
    }, [flash]);

    const handleSubmit = (values) => {
        setSubmitting(true);
        router.post(`/qr/thiet-bi/${token}`, {
            ...values,
            ngay_bao_duong: values.ngay_bao_duong?.format('YYYY-MM-DD') ?? dayjs().format('YYYY-MM-DD'),
        }, { onFinish: () => setSubmitting(false) });
    };
    const screens = Grid.useBreakpoint();
    if (submitted) {
        return (
            <MainLayout>
                <Head title="Ghi nhận sửa chữa" />
                <div style={{ maxWidth: 600, margin: '0 auto' }}>
                    <Result
                        icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                        title="Ghi nhận sửa chữa thành công!"
                        subTitle={
                            <Space direction="vertical" align="center">
                                <Text>Thông tin sửa chữa đã được lưu vào lịch sử bảo dưỡng.</Text>
                                <Text strong>{thietBi?.ten_thiet_bi}</Text>
                            </Space>
                        }
                        extra={[
                            <Button key="list" onClick={() => router.visit('/lich-su-bao-duong')}>
                                Xem lịch sử
                            </Button>,
                            <Button key="again" type="primary" onClick={() => setSubmitted(false)}>
                                Ghi nhận thêm
                            </Button>,
                        ]}
                    />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <Head title={`Ghi nhận sửa chữa — ${thietBi?.ten_thiet_bi}`} />
            <div style={{ maxWidth: 680, margin: '0 auto' }}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>

                    {/* Device info card */}
                    <Card
                        style={{ borderRadius: 14, background: '#f0f5ff', border: '1.5px solid #adc6ff' }}
                        bodyStyle={{ padding: 16 }}
                    >
                        <Row gutter={screens.md ? 16 : 8}>
                            <Col flex={screens.md ? "auto" : "1"}>
                                <Space direction="vertical" size={4}>
                                    <Space align="center" wrap>
                                        <ToolOutlined style={{ color: '#244380', fontSize: 18 }} />
                                        <Title level={screens.md ? 4 : 5} style={{ margin: 0 }}>{thietBi?.ten_thiet_bi}</Title>
                                        {screens.md && <Tag color="blue">{thietBi?.ma_thiet_bi}</Tag>}
                                    </Space>
                                    {screens.md ? (
                                        <Space size="small" wrap>
                                            <Tag color={tt.color}>{tt.label}</Tag>
                                            {phong && <Text type="secondary" style={{ fontSize: 13 }}>{phong.ten_phong}</Text>}
                                            {khuNha && <Text type="secondary" style={{ fontSize: 13 }}>— {khuNha.ten_khu_nha}</Text>}
                                        </Space>
                                    ) : (
                                        <>
                                            <Space size="small">
                                                <Tag color="blue">{thietBi?.ma_thiet_bi}</Tag>
                                                <Tag color={tt.color}>{tt.label}</Tag>
                                            </Space>

                                            <Space size="small" wrap>
                                                {phong && <Text type="secondary" style={{ fontSize: 12 }}>{phong.ten_phong}</Text>}
                                                {khuNha && <Text type="secondary" style={{ fontSize: 12 }}>— {khuNha.ten_khu_nha}</Text>}
                                            </Space>
                                        </>
                                    )}
                                    {coSo && <Text type="secondary" style={{ fontSize: 12 }}>{coSo.ten_co_so}</Text>}
                                </Space>
                            </Col>
                            <Col>
                                <Statistic
                                    title={<Text style={{ fontSize: 11 }}>Lần sửa chữa</Text>}
                                    value={soLanSuaChua ?? 0}
                                    prefix={<HistoryOutlined />}
                                    valueStyle={{ color: '#244380', fontSize: screens.md ? 22 : 18 }}
                                    suffix="lần"
                                />
                            </Col>
                        </Row>
                    </Card>

                    {serverErrors && Object.keys(serverErrors).length > 0 && (
                        <Alert
                            type="error" showIcon
                            message="Vui lòng kiểm tra lại thông tin"
                            description={Object.values(serverErrors).join(', ')}
                            style={{ borderRadius: 10 }}
                        />
                    )}
                    {coPhienDangSua && (
                        <Alert
                            type="info"
                            showIcon
                            message="Thiết bị đang có phiên sửa chữa dở dang"
                            description="Biểu mẫu đã tự nạp dữ liệu đang sửa để bạn tiếp tục và cập nhật hoàn thành."
                            style={{ borderRadius: 10 }}
                        />
                    )}

                    {/* Repair form */}
                    <Card
                        title={
                            <Space>
                                <ToolOutlined />
                                <span>Ghi nhận sửa chữa</span>
                            </Space>
                        }
                        style={{ borderRadius: 14 }}
                    >
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleSubmit}
                            size="large"
                            initialValues={{
                                hu_hong_mo_ta: phienDangSua.hu_hong_mo_ta,
                                noi_dung: phienDangSua.noi_dung,
                                ngay_bao_duong: lichSuDangSuaChua?.ngay_bao_duong ? dayjs(lichSuDangSuaChua.ngay_bao_duong) : dayjs(),
                                chi_phi: lichSuDangSuaChua?.chi_phi ?? undefined,
                                nguoi_thuc_hien: auth?.user?.name ?? '',
                                trang_thai: coPhienDangSua ? 'dang_sua_chua' : 'hoan_thanh',
                                loai_bao_duong: lichSuDangSuaChua?.loai_bao_duong ?? 'sua_chua',
                                hinh_thuc_sua_chua: lichSuDangSuaChua?.hinh_thuc_sua_chua ?? 'dot_xuat',
                            }}
                        >
                            <Form.Item
                                label={<Text strong>Mô tả hư hỏng <span style={{ color: 'red' }}>*</span></Text>}
                                name="hu_hong_mo_ta"
                                rules={[
                                    { required: true, message: 'Vui lòng mô tả hư hỏng' },
                                    { min: 5, message: 'Mô tả hư hỏng phải nhập ít nhất 5 ký tự!' }
                                ]}
                            >
                                <TextArea
                                    rows={3}
                                    placeholder="Ví dụ: Màn hình không lên, cổng VGA bị lỏng..."
                                    showCount maxLength={500}
                                    style={{ borderRadius: 10 }}
                                />
                            </Form.Item>

                            <Form.Item
                                label={<Text strong>Nội dung sửa chữa <span style={{ color: 'red' }}>*</span></Text>}
                                name="noi_dung"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập nội dung sửa chữa' },
                                    { min: 5, message: 'Nội dung sửa chữa phải nhập ít nhất 5 ký tự!' }
                                ]}
                            >
                                <TextArea
                                    rows={4}
                                    placeholder="Ví dụ: Thay cổng VGA, kiểm tra bo mạch chủ, vệ sinh tổng thể..."
                                    showCount maxLength={1000}
                                    style={{ borderRadius: 10 }}
                                />
                            </Form.Item>

                            <Row gutter={16}>
                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        label={<Text strong>Ngày sửa <span style={{ color: 'red' }}>*</span></Text>}
                                        name="ngay_bao_duong"
                                        rules={[{ required: true, message: 'Chọn ngày sửa' }]}
                                    >
                                        <DatePicker
                                            style={{ width: '100%', borderRadius: 10 }}
                                            format="DD/MM/YYYY"
                                            placeholder="Chọn ngày"
                                            suffixIcon={<CalendarOutlined />}
                                            disabledDate={d => d && d > dayjs()}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        label={<Text strong>Chi phí sửa chữa (VNĐ)</Text>}
                                        name="chi_phi"
                                        rules={[
                                            {
                                                validator: (_, value) => (
                                                    value === null || value === undefined || Number(value) >= 0
                                                        ? Promise.resolve()
                                                        : Promise.reject(new Error('Chi phí phải lớn hơn hoặc bằng 0'))
                                                ),
                                            },
                                        ]}
                                    >
                                        <InputNumber
                                            style={{ width: '100%', borderRadius: 10 }}
                                            placeholder="0"
                                            formatter={v => v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                                            parser={v => (v ? v.replace(/,/g, '') : '')}
                                            prefix={<DollarOutlined />}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        label={<Text strong>Người thực hiện</Text>}
                                        name="nguoi_thuc_hien"
                                    >
                                        <Input
                                            prefix={<UserOutlined />}
                                            placeholder="Tên kỹ thuật viên"
                                            style={{ borderRadius: 10 }}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        label={<Text strong>Trạng thái <span style={{ color: 'red' }}>*</span></Text>}
                                        name="trang_thai"
                                        rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                                    >
                                        <Select
                                            size="large"
                                            placeholder="Chọn trạng thái"
                                            style={{ borderRadius: 10 }}
                                        >
                                            {TRANG_THAI_SUA_CHUA.map(item => (
                                                <Select.Option key={item.value} value={item.value}>
                                                    <Space>
                                                        {item.icon}
                                                        {item.label}
                                                    </Space>
                                                </Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        label={<Text strong>Hình thức sửa chữa <span style={{ color: 'red' }}>*</span></Text>}
                                        name="hinh_thuc_sua_chua"
                                        rules={[{ required: true, message: 'Vui lòng chọn hình thức sửa chữa' }]}
                                    >
                                        <Select
                                            size="large"
                                            placeholder="Chọn hình thức sửa chữa"
                                            style={{ borderRadius: 10 }}
                                            options={HINH_THUC_SUA_CHUA}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        label={<Text strong>Loại sửa chữa <span style={{ color: 'red' }}>*</span></Text>}
                                        name="loai_bao_duong"
                                        rules={[{ required: true, message: 'Vui lòng chọn loại sửa chữa' }]}
                                    >
                                        <Select
                                            size="large"
                                            placeholder="Chọn loại sửa chữa"
                                            style={{ borderRadius: 10 }}
                                            options={LOAI_SUA_CHUA}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Divider />

                            <Form.Item style={{ marginBottom: 0 }}>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    block
                                    loading={submitting}
                                    icon={<CheckCircleOutlined />}
                                // style={{
                                //     height: 50, borderRadius: 10, fontSize: 16,
                                //     fontWeight: 600,
                                //     background: 'linear-gradient(135deg, #244380 0%, #3d6cb8 100%)',
                                //     border: 'none',
                                // }}
                                >
                                    Lưu thông tin sửa chữa
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Space>
            </div>
        </MainLayout>
    );
};

export default SuaChuaForm;

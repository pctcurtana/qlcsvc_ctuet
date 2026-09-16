import React, { useState, useEffect, useRef } from 'react';
import { usePage, router, Head } from '@inertiajs/react';
import {
    Form, Input, Select, Button, Card, Typography, Alert, Radio,
    Space, Tag, Divider, Result,
} from 'antd';
import {
    AlertOutlined, PhoneOutlined, UserOutlined,
    CheckCircleOutlined, EnvironmentOutlined, HomeOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const MUC_DO_OPTIONS = [
    { value: 'thap', label: 'Thấp', color: 'green', desc: 'Vẫn có thể hoạt động' },
    { value: 'trung_binh', label: 'Trung bình', color: 'orange', desc: 'Ảnh hưởng một phần' },
    { value: 'cao', label: 'Cao', color: 'red', desc: 'Không thể sử dụng' },
    { value: 'khan_cap', label: 'Khẩn cấp', color: 'purple', desc: 'Cần xử lý ngay' },
];

const PhongForm = ({ phong, token }) => {
    const { flash, errors: serverErrors } = usePage().props;
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submitTime, setSubmitTime] = useState(null);
    const loadedAt = useRef(Date.now());

    useEffect(() => {
        if (flash?.success) {
            setSubmitTime(new Date().toLocaleTimeString('vi-VN'));
            setSubmitted(true);
        }
    }, [flash]);

    const handleSubmit = (values) => {
        // Client-side time check (min 3 seconds)
        if (Date.now() - loadedAt.current < 3000) {
            return;
        }
        setSubmitting(true);
        router.post(`/bao-cao/phong/${token}`, values, {
            onFinish: () => setSubmitting(false),
        });
    };

    const khuNha = phong?.khu_nha ?? phong?.khuNha;
    const coSo = khuNha?.co_so ?? khuNha?.coSo;

    if (submitted) {
        return (
            <>
                <Head title="Báo cáo đã được ghi nhận" />
                <div style={styles.wrapper}>
                    <div style={styles.container}>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <img src="/images/logoctuet.png" alt="Logo" style={styles.logo} />
                        </div>
                        <Result
                            icon={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: 72 }} />}
                            title="Báo cáo đã được ghi nhận!"
                            subTitle={
                                <Space direction="vertical" align="center">
                                    <Text>Cảm ơn bạn đã báo cáo sự cố. Bộ phận kỹ thuật sẽ xử lý sớm nhất.</Text>
                                    <Text type="secondary">Thời gian gửi: {submitTime}</Text>
                                    <Text type="secondary">
                                        Phòng: <strong>{phong?.ten_phong}</strong>
                                        {khuNha && <> — {khuNha.ten_khu_nha}</>}
                                    </Text>
                                </Space>
                            }
                        />
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={`Báo cáo sự cố — ${phong?.ten_phong || 'Phòng'}`} />
            <div style={styles.wrapper}>
                <div style={styles.container}>
                    {/* Header */}
                    <div style={styles.header}>
                        <img src="/images/logoctuet.png" alt="Logo" style={styles.logo} />
                        <Title level={4} style={{ margin: 0, color: '#244380' }}>
                            Báo cáo Sự cố Thiết bị
                        </Title>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            Trường Đại học Kỹ thuật Công nghệ Cần Thơ
                        </Text>
                    </div>

                    {/* Room info */}
                    <Card style={styles.roomCard} bodyStyle={{ padding: '12px 16px' }}>
                        <Space direction="vertical" size={2} style={{ width: '100%' }}>
                            <Space>
                                <HomeOutlined style={{ color: '#244380' }} />
                                <Text strong style={{ fontSize: 16 }}>{phong?.ten_phong}</Text>
                                <Tag color="blue">{phong?.ma_phong}</Tag>
                            </Space>
                            {khuNha && (
                                <Space>
                                    <EnvironmentOutlined style={{ color: '#888' }} />
                                    <Text type="secondary" style={{ fontSize: 13 }}>
                                        {khuNha.ten_khu_nha}
                                        {coSo && ` — ${coSo.ten_co_so}`}
                                    </Text>
                                </Space>
                            )}
                        </Space>
                    </Card>

                    {/* Server errors */}
                    {serverErrors && Object.keys(serverErrors).length > 0 && (
                        <Alert
                            type="error"
                            showIcon
                            message="Vui lòng kiểm tra lại thông tin"
                            description={Object.values(serverErrors).join(', ')}
                            style={{ marginBottom: 16, borderRadius: 10 }}
                        />
                    )}

                    {/* Form */}
                    <Card style={styles.formCard}>
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleSubmit}
                            size="large"
                            initialValues={{ muc_do: 'trung_binh' }}
                        >
                            {/* Honeypot */}
                            <Form.Item name="website" style={{ display: 'none' }}>
                                <Input tabIndex={-1} autoComplete="off" />
                            </Form.Item>

                            <Form.Item
                                label={<Text strong>Họ tên người báo cáo <span style={{ color: 'red' }}>*</span></Text>}
                                name="ten_nguoi_bao"
                                rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
                            >
                                <Input
                                    prefix={<UserOutlined />}
                                    placeholder="Nguyễn Văn A (Đại diện)"
                                    style={styles.input}
                                />
                            </Form.Item>

                            <Form.Item
                                label={<Text strong>Số điện thoại</Text>}
                                name="so_dien_thoai"
                            >
                                <Input
                                    prefix={<PhoneOutlined />}
                                    placeholder="0912 345 678 (không bắt buộc)"
                                    style={styles.input}
                                />
                            </Form.Item>

                            <Form.Item
                                label={<Text strong>Thiết bị bị hỏng</Text>}
                                name="thiet_bi_id"
                            >
                                <Select
                                    placeholder="Chọn thiết bị (nếu biết)"
                                    allowClear
                                    showSearch
                                    optionFilterProp="label"
                                    style={styles.input}
                                    options={[
                                        {
                                            value: null,
                                            label: "Khác (ghi rõ trong mô tả)",
                                        },
                                        ...(phong?.thiet_bis || phong?.thietBis || []).map(tb => ({
                                            value: tb.id,
                                            label: `${tb.ten_thiet_bi} (${tb.ma_thiet_bi})`,
                                        })),
                                    ]}
                                />
                            </Form.Item>

                            <Form.Item
                                label={<Text strong>Mô tả sự cố <span style={{ color: 'red' }}>*</span></Text>}
                                name="mo_ta_su_co"
                                rules={[
                                    { required: true, message: 'Vui lòng mô tả sự cố' },
                                    { min: 3, message: 'Mô tả quá ngắn (ít nhất 3 ký tự)' },
                                ]}
                            >
                                <TextArea
                                    rows={4}
                                    placeholder="Ví dụ: Máy chiếu không lên hình, màn hình bị tối hoàn toàn..."
                                    style={{ borderRadius: 10, fontSize: 16 }}
                                    showCount
                                    maxLength={1000}
                                />
                            </Form.Item>

                            <Form.Item
                                label={<Text strong>Mức độ nghiêm trọng <span style={{ color: 'red' }}>*</span></Text>}
                                name="muc_do"
                                rules={[{ required: true, message: 'Vui lòng chọn mức độ' }]}
                            >
                                <Radio.Group style={{ width: '100%' }}>
                                    <Space direction="vertical" style={{ width: '100%' }}>
                                        {MUC_DO_OPTIONS.map(opt => (
                                            <Radio key={opt.value} value={opt.value}
                                                style={{ padding: '8px 12px', border: '1px solid #e8e8e8', borderRadius: 8, width: '100%' }}>
                                                <Space>
                                                    <Tag color={opt.color} style={{ minWidth: 80, textAlign: 'center' }}>
                                                        {opt.label}
                                                    </Tag>
                                                    <Text type="secondary" style={{ fontSize: 13 }}>{opt.desc}</Text>
                                                </Space>
                                            </Radio>
                                        ))}
                                    </Space>
                                </Radio.Group>
                            </Form.Item>

                            <Divider />

                            <Form.Item style={{ marginBottom: 0 }}>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    block
                                    loading={submitting}
                                    icon={<AlertOutlined />}
                                    style={styles.submitBtn}
                                >
                                    Gửi báo cáo
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>

                    <div style={styles.footer}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            © Trường ĐH Kỹ thuật Công nghệ Cần Thơ — Hệ thống Quản lý CSVC
                        </Text>
                    </div>
                </div>
            </div>
        </>
    );
};

const styles = {
    wrapper: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #e8f0fe 0%, #f0f5ff 100%)',
        padding: '20px 16px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    container: {
        width: '100%',
        maxWidth: 520,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
    },
    header: {
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        paddingBottom: 8,
    },
    logo: {
        width: 72,
        height: 72,
    },
    roomCard: {
        borderRadius: 12,
        background: '#f0f5ff',
        border: '1.5px solid #adc6ff',
    },
    formCard: {
        borderRadius: 16,
        boxShadow: '0 4px 24px rgba(36,67,128,0.10)',
    },
    input: {
        borderRadius: 10,
        fontSize: 16,
    },
    submitBtn: {
        height: 52,
        borderRadius: 10,
        fontSize: 16,
        fontWeight: 600,
        background: 'linear-gradient(135deg, #244380 0%, #3d6cb8 100%)',
        border: 'none',
        boxShadow: '0 4px 16px rgba(36, 67, 128, 0.35)',
    },
    footer: {
        textAlign: 'center',
        paddingBottom: 20,
    },
};

export default PhongForm;

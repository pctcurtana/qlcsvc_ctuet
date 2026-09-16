import React, { useState, useEffect, useRef } from 'react';
import { usePage, router, Head } from '@inertiajs/react';
import { LoginBtn } from '../Common/LoginBtn';
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
                <div className="min-h-screen bg-gradient-to-br from-[#e8f0fe] to-[#f0f5ff] py-5 px-4 flex justify-center items-start">
                    <div className="w-full max-w-[520px] flex flex-col gap-4">
                        <div className="flex justify-center">
                            <img src="/images/logoctuet.png" alt="Logo" className="w-[72px] h-[72px]" />
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
            <div className="min-h-screen bg-gradient-to-br from-[#e8f0fe] to-[#f0f5ff] py-5 px-4 flex justify-center items-start">
                <div className="w-full max-w-[520px] flex flex-col gap-4">
                    {/* Header */}
                    <div className="text-center flex flex-col items-center gap-1.5 pb-2">
                        <img src="/images/logoctuet.png" alt="Logo" className="w-[72px] h-[72px]" />
                        <Title level={4} style={{ margin: 0, color: '#244380' }}>
                            Báo cáo Sự cố Thiết bị
                        </Title>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            Trường Đại học Kỹ thuật Công nghệ Cần Thơ
                        </Text>
                    </div>

                    {/* Room info */}
                    <Card style={{ borderRadius: 12, background: '#f0f5ff', border: '1.5px solid #adc6ff' }} bodyStyle={{ padding: '12px 16px' }}>
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
                    <Card style={{ borderRadius: 16, boxShadow: '0 4px 24px rgba(36,67,128,0.10)' }}>
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleSubmit}
                            size="large"
                            initialValues={{ muc_do: 'trung_binh' }}
                        >
                            {/* Honeypot */}
                            <Form.Item name="website" className="hidden">
                                <Input tabIndex={-1} autoComplete="off" />
                            </Form.Item>

                            <Form.Item
                                label={<Text strong>Họ tên người báo cáo <span className="text-red-500">*</span></Text>}
                                name="ten_nguoi_bao"
                                rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
                            >
                                <Input
                                    prefix={<UserOutlined />}
                                    placeholder="Nguyễn Văn A (Đại diện)"
                                    style={{ borderRadius: 10, fontSize: 16 }}
                                />
                            </Form.Item>

                            <Form.Item
                                label={<Text strong>Số điện thoại</Text>}
                                name="so_dien_thoai"
                            >
                                <Input
                                    prefix={<PhoneOutlined />}
                                    placeholder="0912 345 678 (không bắt buộc)"
                                    style={{ borderRadius: 10, fontSize: 16 }}
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
                                    style={{ borderRadius: 10, fontSize: 16 }}
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
                                label={<Text strong>Mô tả sự cố <span className="text-red-500">*</span></Text>}
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
                                label={<Text strong>Mức độ nghiêm trọng <span className="text-red-500">*</span></Text>}
                                name="muc_do"
                                rules={[{ required: true, message: 'Vui lòng chọn mức độ' }]}
                            >
                                <Radio.Group className="w-full">
                                    <Space direction="vertical" className="w-full">
                                        {MUC_DO_OPTIONS.map(opt => (
                                            <Radio key={opt.value} value={opt.value}
                                                className="w-full !py-2 !px-3 border border-solid border-[#e8e8e8] !rounded-lg">
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

                            <Form.Item className="!mb-0">
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    block
                                    loading={submitting}
                                    icon={<AlertOutlined />}
                                >
                                    Gửi báo cáo
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>

                    <div className="text-center pb-5">
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            © Trường ĐH Kỹ thuật Công nghệ Cần Thơ — Hệ thống Quản lý CSVC
                        </Text>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PhongForm;

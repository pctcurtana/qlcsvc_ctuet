import React, { useState } from 'react';
import MainLayout from '../Layout/MainLayout';
import { Form, Input, InputNumber, Button, Card, Space, Select, message, Row, Col, Alert, Statistic, Modal, Tag, Tooltip } from 'antd';
import { SaveOutlined, RollbackOutlined, InfoCircleOutlined, HistoryOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { router, Link } from '@inertiajs/react';
import dayjs from 'dayjs';

const { TextArea } = Input;

const Edit = ({ coSo }) => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [versionModalVisible, setVersionModalVisible] = useState(false);
    const [pendingValues, setPendingValues] = useState(null);
    const [dienTichQuyDoi, setDienTichQuyDoi] = useState(
        (coSo.dien_tich_dat || 0) * (coSo.vi_tri_khuon_vien || 2.5)
    );

    const handleDienTichChange = () => {
        const dienTichDat = form.getFieldValue('dien_tich_dat') || 0;
        const viTriKhuonVien = form.getFieldValue('vi_tri_khuon_vien') || 2.5;
        setDienTichQuyDoi(dienTichDat * viTriKhuonVien);
    };

    // Kiểm tra thay đổi cho version update (không tính ma_co_so vì backend luôn giữ gốc)
    const checkHasChanges = (formValues) => {
        const fields = {
            ten_co_so: (v) => String(v ?? '').trim(),
            dia_chi: (v) => String(v ?? '').trim(),
            dien_tich_dat: (v) => parseFloat(v) || 0,
            vi_tri_khuon_vien: (v) => parseFloat(v) || 0,
            mo_ta: (v) => String(v ?? '').trim(),
            trang_thai: (v) => String(v ?? ''),
        };
        return Object.keys(fields).some(key => {
            const norm = fields[key];
            return norm(formValues[key]) !== norm(coSo[key]);
        });
    };

    // Sửa lỗi nhập liệu — thực thi submit
    const handleDirectUpdate = (values) => {
        setSubmitting(true);
        router.put(`/co-so/${coSo.id}`, values, {
            onError: (errors) => {
                Object.keys(errors).forEach(key => message.error(errors[key]));
                setSubmitting(false);
            },
            onFinish: () => setSubmitting(false),
        });
    };

    // Nút Sửa lỗi nhập liệu — validate trước khi submit
    const handleDirectUpdateClick = () => {
        form.validateFields().then(values => {
            const allFields = {
                ma_co_so: (v) => String(v ?? '').trim(),
                ten_co_so: (v) => String(v ?? '').trim(),
                dia_chi: (v) => String(v ?? '').trim(),
                dien_tich_dat: (v) => parseFloat(v) || 0,
                vi_tri_khuon_vien: (v) => parseFloat(v) || 0,
                mo_ta: (v) => String(v ?? '').trim(),
                trang_thai: (v) => String(v ?? ''),
            };
            const hasChanges = Object.keys(allFields).some(key => {
                const norm = allFields[key];
                return norm(values[key]) !== norm(coSo[key]);
            });
            if (!hasChanges) {
                message.info('Không có thay đổi nào để cập nhật.');
                return;
            }
            handleDirectUpdate(values);
        }).catch(() => {
            message.error('Vui lòng kiểm tra lại các trường bắt buộc.');
        });
    };

    // Mở modal xác nhận ghi nhận thay đổi
    const handleVersionUpdateClick = () => {
        form.validateFields().then(values => {
            const maChanged = String(values.ma_co_so ?? '').trim() !== String(coSo.ma_co_so ?? '').trim();
            if (!checkHasChanges(values)) {
                if (maChanged) {
                    message.warning('Mã cơ sở chỉ thay đổi được bằng "Sửa lỗi nhập liệu". "Ghi nhận thay đổi" không đổi mã.');
                } else {
                    message.warning('Không có thay đổi nào để ghi nhận.');
                }
                return;
            }
            if (maChanged) {
                message.info('Lưu ý: Mã cơ sở được giữ nguyên khi "Ghi nhận thay đổi". Nếu muốn đổi mã, hãy dùng "Sửa lỗi nhập liệu".');
            }
            setPendingValues(values);
            setVersionModalVisible(true);
        }).catch(() => {
            message.error('Vui lòng kiểm tra lại các trường bắt buộc.');
        });
    };

    // Xác nhận ghi nhận thay đổi
    const handleVersionUpdateConfirm = () => {
        if (!pendingValues) return;
        setSubmitting(true);
        setVersionModalVisible(false);
        router.post(`/co-so/${coSo.id}/version-update`, pendingValues, {
            onError: (errors) => {
                Object.keys(errors).forEach(key => message.error(errors[key]));
                setSubmitting(false);
            },
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <MainLayout>
            <Card
                title={
                    <Space>
                        <span>Chỉnh sửa cơ sở: {coSo.ten_co_so}</span>
                        <Tag color="blue">Phiên bản {coSo.phien_ban ?? 1}</Tag>
                        {coSo.hieu_luc_tu && (
                            <Tooltip title="Ngày bắt đầu hiệu lực">
                                <Tag color="green">Từ: {dayjs(coSo.hieu_luc_tu).format('DD/MM/YYYY')}</Tag>
                            </Tooltip>
                        )}
                    </Space>
                }
            >
                <Alert
                    message="Chọn cách cập nhật"
                    description={
                        <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                            <li><strong>Sửa lỗi nhập liệu:</strong> Ghi đè thông tin hiện tại, không lưu lịch sử. Chỉ dùng khi lỡ nhập sai.</li>
                            <li><strong>Ghi nhận thay đổi:</strong> Dùng khi có thay đổi thực tế. Thông tin cũ được lưu vào lịch sử (hiệu lực đến hôm nay), thông tin mới áp dụng từ hôm nay, nên báo cáo theo mốc thời gian vẫn đúng.</li>
                        </ul>
                    }
                    type="info"
                    showIcon
                    style={{ marginBottom: 12 }}
                />
                <Alert
                    message="Công thức tính diện tích quy đổi (theo BGD)"
                    description="Diện tích quy đổi = Diện tích đất × Vị trí khuôn viên. Hệ số vị trí khuôn viên mặc định là 2.5 theo quy định của Bộ Giáo dục."
                    type="warning"
                    icon={<InfoCircleOutlined />}
                    showIcon
                    style={{ marginBottom: 24 }}
                    closable
                />

                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{ ...coSo, vi_tri_khuon_vien: coSo.vi_tri_khuon_vien || 2.5 }}
                >
                    <Form.Item
                        label="Mã cơ sở"
                        name="ma_co_so"
                        rules={[{ required: true, message: 'Vui lòng nhập mã cơ sở!' }]}
                        tooltip="Mã cơ sở chỉ đổi được bằng Sửa lỗi nhập liệu; khi ghi nhận thay đổi, mã được giữ nguyên"
                    >
                        <Input placeholder="Ví dụ: CS01" size="large" />
                    </Form.Item>

                    <Form.Item
                        label="Tên cơ sở"
                        name="ten_co_so"
                        rules={[{ required: true, message: 'Vui lòng nhập tên cơ sở!' }]}
                    >
                        <Input placeholder="Nhập tên cơ sở" size="large" />
                    </Form.Item>

                    <Form.Item
                        label="Địa chỉ"
                        name="dia_chi"
                        rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}
                    >
                        <Input placeholder="Nhập địa chỉ cơ sở" size="large" />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col xs={24} md={8}>
                            <Form.Item
                                label="Diện tích đất (m²)"
                                name="dien_tich_dat"
                                rules={[{ required: true, message: 'Vui lòng nhập diện tích đất!' }]}
                                tooltip="Diện tích đất thực tế của cơ sở"
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    size="large"
                                    min={0}
                                    placeholder="Nhập diện tích đất"
                                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                    onChange={handleDienTichChange}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item
                                label="Vị trí khuôn viên"
                                name="vi_tri_khuon_vien"
                                rules={[{ required: true, message: 'Vui lòng nhập hệ số vị trí khuôn viên!' }]}
                                tooltip="Hệ số vị trí khuôn viên theo BGD (mặc định 2.5)"
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    size="large"
                                    min={0}
                                    step={0.1}
                                    placeholder="Mặc định: 2.5"
                                    onChange={handleDienTichChange}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label="Diện tích quy đổi (m²)">
                                <Card size="small" style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                                    <Statistic
                                        value={dienTichQuyDoi}
                                        precision={2}
                                        suffix="m²"
                                        valueStyle={{ color: '#3f8600', fontSize: '20px' }}
                                    />
                                    <small style={{ color: '#666' }}>= DT đất × Vị trí KV</small>
                                </Card>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item label="Mô tả" name="mo_ta">
                        <TextArea rows={4} placeholder="Nhập mô tả về cơ sở" />
                    </Form.Item>

                    <Form.Item
                        label="Trạng thái"
                        name="trang_thai"
                        rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
                    >
                        <Select size="large">
                            <Select.Option value="active">Hoạt động</Select.Option>
                            <Select.Option value="inactive">Không hoạt động</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item>
                        <Space wrap>
                            <Button
                                type="primary"
                                icon={<SaveOutlined />}
                                size="large"
                                loading={submitting}
                                onClick={handleDirectUpdateClick}
                            >
                                Sửa lỗi nhập liệu
                            </Button>
                            <Button
                                type="default"
                                icon={<HistoryOutlined />}
                                size="large"
                                loading={submitting}
                                onClick={handleVersionUpdateClick}
                                style={{ borderColor: '#fa8c16', color: '#fa8c16' }}
                            >
                                Ghi nhận thay đổi
                            </Button>
                            <Link href="/co-so">
                                <Button icon={<RollbackOutlined />} size="large">Quay lại</Button>
                            </Link>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>

            <Modal
                title={
                    <Space>
                        <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />
                        <span>Xác nhận ghi nhận thay đổi</span>
                    </Space>
                }
                open={versionModalVisible}
                onOk={handleVersionUpdateConfirm}
                onCancel={() => setVersionModalVisible(false)}
                okText="Xác nhận ghi nhận thay đổi"
                cancelText="Hủy"
                okButtonProps={{ style: { background: '#fa8c16', borderColor: '#fa8c16' } }}
            >
                <p>
                    Thông tin hiện tại của cơ sở <strong>{coSo.ten_co_so}</strong> sẽ được <strong>lưu vào lịch sử</strong> (hiệu lực đến hôm nay). Thông tin mới áp dụng từ hôm nay (<strong>phiên bản {(coSo.phien_ban ?? 1) + 1}</strong>).
                </p>
                <Alert
                    message="Thông tin cũ được giữ lại để xuất báo cáo theo mốc thời gian."
                    type="success"
                    showIcon
                    style={{ marginTop: 12 }}
                />
                <Alert
                    message="Các toà nhà đang dùng thuộc cơ sở này tự động chuyển theo thông tin mới."
                    type="info"
                    showIcon
                    style={{ marginTop: 8 }}
                />
            </Modal>
        </MainLayout>
    );
};

export default Edit;

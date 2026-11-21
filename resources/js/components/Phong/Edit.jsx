import React, { useState } from 'react';
import MainLayout from '../Layout/MainLayout';
import { Form, Input, InputNumber, Button, Card, Space, Select, message, Modal, Alert, Tag, Tooltip } from 'antd';
import { SaveOutlined, RollbackOutlined, HistoryOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { router, Link } from '@inertiajs/react';
import dayjs from 'dayjs';

const { TextArea } = Input;

const Edit = ({ phong, khuNhas }) => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [versionModalVisible, setVersionModalVisible] = useState(false);
    const [pendingValues, setPendingValues] = useState(null);

    // Kiểm tra thay đổi cho version update (không tính ma_phong vì backend luôn giữ gốc)
    const checkHasChanges = (formValues) => {
        const fields = {
            khu_nha_id: (v) => Number(v),
            ten_phong: (v) => String(v ?? '').trim(),
            loai_phong: (v) => String(v ?? ''),
            tang: (v) => Number(v),
            dien_tich: (v) => parseFloat(v) || 0,
            suc_chua: (v) => Number(v),
            trang_thiet_bi: (v) => String(v ?? '').trim(),
            mo_ta: (v) => String(v ?? '').trim(),
            trang_thai: (v) => String(v ?? ''),
        };
        return Object.keys(fields).some(key => {
            const norm = fields[key];
            return norm(formValues[key]) !== norm(phong[key]);
        });
    };

    // Sửa lỗi nhập liệu — thực thi submit
    const handleDirectUpdate = (values) => {
        setSubmitting(true);
        router.put(`/phong/${phong.id}`, values, {
            onError: (errors) => {
                if (errors && typeof errors === 'object') {
                    Object.keys(errors).forEach(key => message.error(errors[key]));
                }
                setSubmitting(false);
            },
            onFinish: () => setSubmitting(false),
        });
    };

    // Nút Sửa lỗi nhập liệu — validate trước khi submit
    const handleDirectUpdateClick = () => {
        form.validateFields().then(values => {
            const allFields = {
                ma_phong: (v) => String(v ?? '').trim(),
                khu_nha_id: (v) => Number(v),
                ten_phong: (v) => String(v ?? '').trim(),
                loai_phong: (v) => String(v ?? ''),
                tang: (v) => Number(v),
                dien_tich: (v) => parseFloat(v) || 0,
                suc_chua: (v) => Number(v),
                trang_thiet_bi: (v) => String(v ?? '').trim(),
                mo_ta: (v) => String(v ?? '').trim(),
                trang_thai: (v) => String(v ?? ''),
            };
            const hasChanges = Object.keys(allFields).some(key => {
                const norm = allFields[key];
                return norm(values[key]) !== norm(phong[key]);
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
            const maChanged = String(values.ma_phong ?? '').trim() !== String(phong.ma_phong ?? '').trim();
            if (!checkHasChanges(values)) {
                if (maChanged) {
                    message.warning('Mã phòng chỉ thay đổi được bằng "Sửa lỗi nhập liệu". "Ghi nhận thay đổi" không đổi mã.');
                } else {
                    message.warning('Không có thay đổi nào để ghi nhận.');
                }
                return;
            }
            if (maChanged) {
                message.info('Lưu ý: Mã phòng được giữ nguyên khi "Ghi nhận thay đổi". Nếu muốn đổi mã, hãy dùng "Sửa lỗi nhập liệu".');
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
        router.post(`/phong/${phong.id}/version-update`, pendingValues, {
            onError: (errors) => {
                if (errors && typeof errors === 'object') {
                    Object.keys(errors).forEach(key => message.error(errors[key]));
                }
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
                        <span>Chỉnh sửa phòng: {phong.ten_phong}</span>
                        <Tag color="blue">Phiên bản {phong.phien_ban ?? 1}</Tag>
                        {phong.hieu_luc_tu && (
                            <Tooltip title="Ngày bắt đầu hiệu lực">
                                <Tag color="green">
                                    Từ: {dayjs(phong.hieu_luc_tu).format('DD/MM/YYYY')}
                                </Tag>
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
                    style={{ marginBottom: 24 }}
                />

                <Form
                    form={form}
                    layout="vertical"
                    initialValues={phong}
                >
                    <Form.Item
                        label="Mã phòng"
                        name="ma_phong"
                        rules={[{ required: true, message: 'Vui lòng nhập mã phòng!' }]}
                        tooltip="Mã phòng chỉ đổi được bằng Sửa lỗi nhập liệu; khi ghi nhận thay đổi, mã được giữ nguyên"
                    >
                        <Input placeholder="Ví dụ: P101" size="large" />
                    </Form.Item>

                    <Form.Item
                        label="Toà nhà"
                        name="khu_nha_id"
                        rules={[{ required: true, message: 'Vui lòng chọn toà nhà!' }]}
                    >
                        <Select
                            size="large"
                            placeholder="Chọn toà nhà"
                            showSearch
                            optionFilterProp="label"
                            options={khuNhas.map(kn => ({
                                value: kn.id,
                                label: `${kn.ten_khu_nha} - ${kn.co_so.ten_co_so}`
                            }))}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Tên phòng"
                        name="ten_phong"
                        rules={[{ required: true, message: 'Vui lòng nhập tên phòng!' }]}
                    >
                        <Input placeholder="Nhập tên phòng" size="large" />
                    </Form.Item>

                    <Form.Item
                        label="Loại phòng"
                        name="loai_phong"
                        rules={[{ required: true, message: 'Vui lòng chọn loại phòng!' }]}
                    >
                        <Select size="large" placeholder="Chọn loại phòng">
                            <Select.Option value="phong_hoc">Phòng học</Select.Option>
                            <Select.Option value="phong_thi_nghiem">Phòng thí nghiệm</Select.Option>
                            <Select.Option value="phong_thuc_hanh">Phòng thực hành</Select.Option>
                            <Select.Option value="phong_lam_viec">Phòng làm việc</Select.Option>
                            <Select.Option value="phong_chuc_nang">Phòng chức năng</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Tầng"
                        name="tang"
                        rules={[{ required: true, message: 'Vui lòng nhập tầng!' }]}
                    >
                        <InputNumber style={{ width: '100%' }} size="large" min={1} placeholder="Nhập số tầng" />
                    </Form.Item>

                    <Form.Item
                        label="Diện tích (m²)"
                        name="dien_tich"
                        rules={[{ required: true, message: 'Vui lòng nhập diện tích!' }]}
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            size="large"
                            min={0}
                            placeholder="Nhập diện tích"
                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value.replace(/\$\s?|(,*)/g, '')}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Sức chứa (người)"
                        name="suc_chua"
                        rules={[{ required: true, message: 'Vui lòng nhập sức chứa!' }]}
                    >
                        <InputNumber style={{ width: '100%' }} size="large" min={0} placeholder="Nhập sức chứa" />
                    </Form.Item>

                    <Form.Item label="Trang thiết bị" name="trang_thiet_bi">
                        <TextArea rows={3} placeholder="Nhập danh sách trang thiết bị" />
                    </Form.Item>

                    <Form.Item label="Mô tả" name="mo_ta">
                        <TextArea rows={4} placeholder="Nhập mô tả về phòng" />
                    </Form.Item>

                    <Form.Item
                        label="Trạng thái"
                        name="trang_thai"
                        rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
                    >
                        <Select size="large">
                            <Select.Option value="active">Hoạt động</Select.Option>
                            <Select.Option value="maintenance">Bảo trì</Select.Option>
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
                            <Link href="/phong">
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
                    Thông tin hiện tại của phòng <strong>{phong.ten_phong}</strong> sẽ được <strong>lưu vào lịch sử</strong> (hiệu lực đến hôm nay). Thông tin mới áp dụng từ hôm nay (<strong>phiên bản {(phong.phien_ban ?? 1) + 1}</strong>).
                </p>
                <Alert
                    message="Thông tin cũ được giữ lại để xuất báo cáo theo mốc thời gian."
                    type="success"
                    showIcon
                    style={{ marginTop: 12 }}
                />
                <Alert
                    message="Các thiết bị đang dùng trong phòng tự động chuyển theo thông tin mới. Mã QR dán ở cửa phòng được giữ nguyên."
                    type="info"
                    showIcon
                    style={{ marginTop: 8 }}
                />
            </Modal>
        </MainLayout>
    );
};

export default Edit;

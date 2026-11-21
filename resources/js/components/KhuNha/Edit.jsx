import React, { useState } from 'react';
import MainLayout from '../Layout/MainLayout';
import { Form, Input, InputNumber, Button, Card, Space, Select, message, Row, Col, Alert, Statistic, Modal, Tag, Tooltip } from 'antd';
import { SaveOutlined, RollbackOutlined, InfoCircleOutlined, HistoryOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { router, Link } from '@inertiajs/react';
import dayjs from 'dayjs';

const { TextArea } = Input;

const Edit = ({ khuNha, coSos }) => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [versionModalVisible, setVersionModalVisible] = useState(false);
    const [pendingValues, setPendingValues] = useState(null);

    const initDienTichXayDung = khuNha.dien_tich_xay_dung || 0;
    const initSoTang = khuNha.so_tang || 1;
    const initHeSo = khuNha.he_so_su_dung_dao_tao || 0.7;
    const initTongDTSan = initDienTichXayDung * initSoTang;
    const initDTDaoTao = initTongDTSan * initHeSo;

    const [tongDienTichSan, setTongDienTichSan] = useState(initTongDTSan);
    const [dienTichSanDaoTao, setDienTichSanDaoTao] = useState(initDTDaoTao);

    const handleDienTichChange = () => {
        const dienTichXayDung = form.getFieldValue('dien_tich_xay_dung') || 0;
        const soTang = form.getFieldValue('so_tang') || 1;
        const heSoSuDung = form.getFieldValue('he_so_su_dung_dao_tao') || 0.7;
        const tongDTSan = dienTichXayDung * soTang;
        const dtDaoTao = tongDTSan * heSoSuDung;
        setTongDienTichSan(tongDTSan);
        setDienTichSanDaoTao(dtDaoTao);
    };

    // Kiểm tra thay đổi cho version update (không tính ma_khu_nha vì backend luôn giữ gốc)
    const checkHasChanges = (formValues) => {
        const fields = {
            co_so_id: (v) => Number(v),
            ten_khu_nha: (v) => String(v ?? '').trim(),
            loai_khu_nha: (v) => String(v ?? ''),
            so_tang: (v) => Number(v),
            dien_tich_xay_dung: (v) => parseFloat(v) || 0,
            he_so_su_dung_dao_tao: (v) => parseFloat(v) || 0,
            nam_xay_dung: (v) => v ? Number(v) : null,
            mo_ta: (v) => String(v ?? '').trim(),
            trang_thai: (v) => String(v ?? ''),
        };
        return Object.keys(fields).some(key => {
            const norm = fields[key];
            return norm(formValues[key]) !== norm(khuNha[key]);
        });
    };

    // Sửa lỗi nhập liệu — thực thi submit
    const handleDirectUpdate = (values) => {
        setSubmitting(true);
        router.put(`/khu-nha/${khuNha.id}`, values, {
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
                ma_khu_nha: (v) => String(v ?? '').trim(),
                co_so_id: (v) => Number(v),
                ten_khu_nha: (v) => String(v ?? '').trim(),
                loai_khu_nha: (v) => String(v ?? ''),
                so_tang: (v) => Number(v),
                dien_tich_xay_dung: (v) => parseFloat(v) || 0,
                he_so_su_dung_dao_tao: (v) => parseFloat(v) || 0,
                nam_xay_dung: (v) => v ? Number(v) : null,
                mo_ta: (v) => String(v ?? '').trim(),
                trang_thai: (v) => String(v ?? ''),
            };
            const hasChanges = Object.keys(allFields).some(key => {
                const norm = allFields[key];
                return norm(values[key]) !== norm(khuNha[key]);
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
            const maChanged = String(values.ma_khu_nha ?? '').trim() !== String(khuNha.ma_khu_nha ?? '').trim();
            if (!checkHasChanges(values)) {
                if (maChanged) {
                    message.warning('Mã toà nhà chỉ thay đổi được bằng "Sửa lỗi nhập liệu". "Ghi nhận thay đổi" không đổi mã.');
                } else {
                    message.warning('Không có thay đổi nào để ghi nhận.');
                }
                return;
            }
            if (maChanged) {
                message.info('Lưu ý: Mã toà nhà được giữ nguyên khi "Ghi nhận thay đổi". Nếu muốn đổi mã, hãy dùng "Sửa lỗi nhập liệu".');
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
        router.post(`/khu-nha/${khuNha.id}/version-update`, pendingValues, {
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
                        <span>Chỉnh sửa toà nhà: {khuNha.ten_khu_nha}</span>
                        <Tag color="blue">Phiên bản {khuNha.phien_ban ?? 1}</Tag>
                        {khuNha.hieu_luc_tu && (
                            <Tooltip title="Ngày bắt đầu hiệu lực">
                                <Tag color="green">Từ: {dayjs(khuNha.hieu_luc_tu).format('DD/MM/YYYY')}</Tag>
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
                    message="Công thức tính diện tích"
                    description="Tổng DT sàn XD = DT xây dựng × Số tầng. DT sàn đào tạo = Tổng DT sàn XD × Hệ số sử dụng cho đào tạo. Hệ số mặc định là 0.7 (70%)."
                    type="warning"
                    icon={<InfoCircleOutlined />}
                    showIcon
                    style={{ marginBottom: 24 }}
                    closable
                />

                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{ ...khuNha, he_so_su_dung_dao_tao: khuNha.he_so_su_dung_dao_tao || 0.7 }}
                >
                    <Form.Item
                        label="Mã toà nhà"
                        name="ma_khu_nha"
                        rules={[{ required: true, message: 'Vui lòng nhập mã toà nhà!' }]}
                        tooltip="Mã toà nhà chỉ đổi được bằng Sửa lỗi nhập liệu; khi ghi nhận thay đổi, mã được giữ nguyên"
                    >
                        <Input placeholder="Ví dụ: KNA" size="large" />
                    </Form.Item>

                    <Form.Item
                        label="Cơ sở"
                        name="co_so_id"
                        rules={[{ required: true, message: 'Vui lòng chọn cơ sở!' }]}
                    >
                        <Select
                            size="large"
                            placeholder="Chọn cơ sở"
                            options={coSos.map(cs => ({ value: cs.id, label: cs.ten_co_so }))}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Tên toà nhà"
                        name="ten_khu_nha"
                        rules={[{ required: true, message: 'Vui lòng nhập tên toà nhà!' }]}
                    >
                        <Input placeholder="Nhập tên toà nhà" size="large" />
                    </Form.Item>

                    <Form.Item
                        label="Loại toà nhà"
                        name="loai_khu_nha"
                        rules={[{ required: true, message: 'Vui lòng chọn loại toà nhà!' }]}
                    >
                        <Select size="large" placeholder="Chọn loại toà nhà">
                            <Select.Option value="phong_hoc">Phòng học</Select.Option>
                            <Select.Option value="phong_lam_viec">Phòng làm việc</Select.Option>
                            <Select.Option value="phong_chuc_nang">Phòng chức năng</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Số tầng"
                        name="so_tang"
                        rules={[{ required: true, message: 'Vui lòng nhập số tầng!' }]}
                    >
                        <InputNumber style={{ width: '100%' }} size="large" min={1} placeholder="Nhập số tầng" onChange={handleDienTichChange} />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col xs={24} md={6}>
                            <Form.Item
                                label="Diện tích xây dựng (m²)"
                                name="dien_tich_xay_dung"
                                rules={[{ required: true, message: 'Vui lòng nhập diện tích xây dựng!' }]}
                                tooltip="Diện tích xây dựng 1 tầng của toà nhà"
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    size="large"
                                    min={0}
                                    placeholder="Nhập DT xây dựng"
                                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                    onChange={handleDienTichChange}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={6}>
                            <Form.Item label="Tổng DT sàn XD (m²)">
                                <Card size="small" style={{ background: '#e6f7ff', border: '1px solid #91d5ff' }}>
                                    <Statistic
                                        value={tongDienTichSan}
                                        precision={2}
                                        suffix="m²"
                                        valueStyle={{ color: '#1890ff', fontSize: '20px' }}
                                    />
                                    <small style={{ color: '#666' }}>= DT xây dựng × Số tầng</small>
                                </Card>
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={6}>
                            <Form.Item
                                label="Hệ số sử dụng cho đào tạo"
                                name="he_so_su_dung_dao_tao"
                                rules={[{ required: true, message: 'Vui lòng nhập hệ số!' }]}
                                tooltip="Hệ số phần diện tích sử dụng cho đào tạo (mặc định 0.7 = 70%)"
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    size="large"
                                    min={0}
                                    max={1}
                                    step={0.05}
                                    placeholder="Mặc định: 0.7"
                                    onChange={handleDienTichChange}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={6}>
                            <Form.Item label="DT sàn sử dụng cho đào tạo (m²)">
                                <Card size="small" style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                                    <Statistic
                                        value={dienTichSanDaoTao}
                                        precision={2}
                                        suffix="m²"
                                        valueStyle={{ color: '#3f8600', fontSize: '20px' }}
                                    />
                                    <small style={{ color: '#666' }}>= Tổng DT sàn × Hệ số</small>
                                </Card>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item label="Năm xây dựng" name="nam_xay_dung">
                        <InputNumber
                            style={{ width: '100%' }}
                            size="large"
                            min={1900}
                            max={new Date().getFullYear() + 10}
                            placeholder="Nhập năm xây dựng"
                        />
                    </Form.Item>

                    <Form.Item label="Mô tả" name="mo_ta">
                        <TextArea rows={4} placeholder="Nhập mô tả về toà nhà" />
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
                            <Link href="/khu-nha">
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
                    Thông tin hiện tại của toà nhà <strong>{khuNha.ten_khu_nha}</strong> sẽ được <strong>lưu vào lịch sử</strong> (hiệu lực đến hôm nay). Thông tin mới áp dụng từ hôm nay (<strong>phiên bản {(khuNha.phien_ban ?? 1) + 1}</strong>).
                </p>
                <Alert
                    message="Thông tin cũ được giữ lại để xuất báo cáo theo mốc thời gian."
                    type="success"
                    showIcon
                    style={{ marginTop: 12 }}
                />
                <Alert
                    message="Các phòng đang dùng thuộc toà nhà này tự động chuyển theo thông tin mới."
                    type="info"
                    showIcon
                    style={{ marginTop: 8 }}
                />
            </Modal>
        </MainLayout>
    );
};

export default Edit;

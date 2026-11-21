import React, { useState, useRef } from 'react';
import MainLayout from '../Layout/MainLayout';
import { Form, Input, InputNumber, Button, Card, Space, Select, message, Row, Col, DatePicker, Divider, Tag, Alert, Tooltip, Modal } from 'antd';
import { SaveOutlined, RollbackOutlined, HistoryOutlined, PlusOutlined, CopyOutlined, ExclamationCircleOutlined, DownloadOutlined, PrinterOutlined } from '@ant-design/icons';
import { router, Link } from '@inertiajs/react';
import dayjs from 'dayjs';
import { QRCodeCanvas } from 'qrcode.react';

const { TextArea } = Input;

const Edit = ({ thietBi, phongs, baseUrl }) => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [versionModalVisible, setVersionModalVisible] = useState(false);
    const [pendingValues, setPendingValues] = useState(null);
    const qrRef = useRef(null);

    // QR URL của thiết bị
    const qrUrl = thietBi.qr_token ? `${baseUrl || ''}/qr/thiet-bi/${thietBi.qr_token}` : null;

    // Download QR
    const handleDownloadQr = () => {
        const canvas = qrRef.current?.querySelector('canvas');
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `QR-${thietBi.ma_thiet_bi}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    // Print QR
    const handlePrintQr = () => {
        const canvas = qrRef.current?.querySelector('canvas');
        if (!canvas) return;
        const win = window.open('', '_blank');
        win.document.write(`
            <html><head><title>In QR - ${thietBi.ma_thiet_bi}</title>
            <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;}
            img{width:200px;height:200px;} h3{margin:16px 0 4px;} p{margin:4px 0;color:#666;}</style></head>
            <body><img src="${canvas.toDataURL('image/png')}"/><h3>${thietBi.ten_thiet_bi}</h3><p>${thietBi.ma_thiet_bi}</p>
            <script>window.onload=()=>{window.print();window.close();}</script></body></html>
        `);
        win.document.close();
    };

    const initialValues = {
        ...thietBi,
        ngay_mua: thietBi.ngay_mua ? dayjs(thietBi.ngay_mua) : null,
        ngay_bao_duong_cuoi: thietBi.ngay_bao_duong_cuoi ? dayjs(thietBi.ngay_bao_duong_cuoi) : null,
        ngay_bao_duong_tiep_theo: thietBi.ngay_bao_duong_tiep_theo ? dayjs(thietBi.ngay_bao_duong_tiep_theo) : null,
    };

    const formatDates = (values) => ({
        ...values,
        ngay_mua: values.ngay_mua ? dayjs(values.ngay_mua).format('YYYY-MM-DD') : null,
        ngay_bao_duong_cuoi: values.ngay_bao_duong_cuoi ? dayjs(values.ngay_bao_duong_cuoi).format('YYYY-MM-DD') : null,
    });

    // Kiểm tra thay đổi cho version update (không tính ma_thiet_bi + serial_number vì backend luôn giữ gốc)
    const checkHasChanges = (formValues) => {
        const fields = {
            phong_id:           (v) => v ? Number(v) : null,
            ten_thiet_bi:       (v) => String(v ?? '').trim(),
            loai_thiet_bi:      (v) => String(v ?? ''),
            hang_san_xuat:      (v) => String(v ?? '').trim(),
            model:              (v) => String(v ?? '').trim(),
            nam_san_xuat:       (v) => v ? Number(v) : null,
            nam_mua:            (v) => v ? Number(v) : null,
            ngay_mua:           (v) => v ? (dayjs.isDayjs(v) ? v.format('YYYY-MM-DD') : String(v)) : null,
            gia_tri:            (v) => parseFloat(v) || 0,
            chu_ky_bao_duong:   (v) => v ? Number(v) : null,
            thong_so_ky_thuat:  (v) => String(v ?? '').trim(),
            mo_ta:              (v) => String(v ?? '').trim(),
            trang_thai:         (v) => String(v ?? ''),
        };
        return Object.keys(fields).some(key => {
            const norm = fields[key];
            const origVal = key === 'ngay_mua' && thietBi[key]
                ? dayjs(thietBi[key]).format('YYYY-MM-DD')
                : thietBi[key];
            return norm(formValues[key]) !== norm(origVal);
        });
    };

    // Sửa lỗi nhập liệu — thực thi submit
    const handleDirectUpdate = (values) => {
        setSubmitting(true);
        router.put(`/thiet-bi/${thietBi.id}`, formatDates(values), {
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
                ma_thiet_bi:        (v) => String(v ?? '').trim(),
                serial_number:      (v) => String(v ?? '').trim(),
                phong_id:           (v) => v ? Number(v) : null,
                ten_thiet_bi:       (v) => String(v ?? '').trim(),
                loai_thiet_bi:      (v) => String(v ?? ''),
                hang_san_xuat:      (v) => String(v ?? '').trim(),
                model:              (v) => String(v ?? '').trim(),
                nam_san_xuat:       (v) => v ? Number(v) : null,
                nam_mua:            (v) => v ? Number(v) : null,
                ngay_mua:           (v) => v ? (dayjs.isDayjs(v) ? v.format('YYYY-MM-DD') : String(v)) : null,
                gia_tri:            (v) => parseFloat(v) || 0,
                chu_ky_bao_duong:   (v) => v ? Number(v) : null,
                thong_so_ky_thuat:  (v) => String(v ?? '').trim(),
                mo_ta:              (v) => String(v ?? '').trim(),
                trang_thai:         (v) => String(v ?? ''),
            };
            const hasChanges = Object.keys(allFields).some(key => {
                const norm = allFields[key];
                const origVal = key === 'ngay_mua' && thietBi[key]
                    ? dayjs(thietBi[key]).format('YYYY-MM-DD')
                    : thietBi[key];
                return norm(values[key]) !== norm(origVal);
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
            const maChanged = String(values.ma_thiet_bi ?? '').trim() !== String(thietBi.ma_thiet_bi ?? '').trim()
                || String(values.serial_number ?? '').trim() !== String(thietBi.serial_number ?? '').trim();
            if (!checkHasChanges(values)) {
                if (maChanged) {
                    message.warning('Mã thiết bị / Số serial chỉ thay đổi được bằng "Sửa lỗi nhập liệu". "Ghi nhận thay đổi" không đổi mã.');
                } else {
                    message.warning('Không có thay đổi nào để ghi nhận.');
                }
                return;
            }
            if (maChanged) {
                message.info('Lưu ý: Mã thiết bị và Số serial được giữ nguyên khi "Ghi nhận thay đổi". Nếu muốn đổi, hãy dùng "Sửa lỗi nhập liệu".');
            }
            setPendingValues(formatDates(values));
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
        router.post(`/thiet-bi/${thietBi.id}/version-update`, pendingValues, {
            onError: (errors) => {
                Object.keys(errors).forEach(key => message.error(errors[key]));
                setSubmitting(false);
            },
            onFinish: () => setSubmitting(false),
        });
    };

    const ngayDenBaoDuong = thietBi.ngay_bao_duong_tiep_theo
        ? dayjs(thietBi.ngay_bao_duong_tiep_theo).diff(dayjs(), 'day')
        : null;
    const canBaoDuong = ngayDenBaoDuong !== null && ngayDenBaoDuong <= 0;

    const formContent = (
        <Form form={form} layout="vertical" initialValues={initialValues}>
            <Alert
                message="Chọn cách cập nhật"
                description={
                    <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                        <li><strong>Sửa lỗi nhập liệu:</strong> Ghi đè thông tin hiện tại, không lưu lịch sử. Chỉ dùng khi lỡ nhập sai.</li>
                        <li><strong>Ghi nhận thay đổi:</strong> Dùng khi có thay đổi thực tế (vd chuyển sang phòng khác). Thông tin cũ được lưu vào lịch sử (hiệu lực đến hôm nay), thông tin mới áp dụng từ hôm nay. Mã thiết bị, Serial và mã QR giữ nguyên.</li>
                    </ul>
                }
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
            />

            {canBaoDuong && (
                <Card style={{ marginBottom: 16, background: '#fff2e8', borderColor: '#ff7a45' }}>
                    <Space>
                        <HistoryOutlined style={{ fontSize: 20, color: '#ff7a45' }} />
                        <span style={{ fontWeight: 'bold', color: '#ff7a45' }}>
                            {ngayDenBaoDuong < 0 ? `Đã quá hạn bảo dưỡng ${Math.abs(ngayDenBaoDuong)} ngày!` : 'Đến hạn bảo dưỡng hôm nay!'}
                        </span>
                        <Link href={`/lich-su-bao-duong/create?thiet_bi_id=${thietBi.id}`}>
                            <Button type="primary" icon={<PlusOutlined />}>Tạo lịch bảo dưỡng</Button>
                        </Link>
                    </Space>
                </Card>
            )}

            <Row gutter={16}>
                <Col xs={24} md={8}>
                    <Form.Item
                        label="Mã thiết bị"
                        name="ma_thiet_bi"
                        rules={[{ required: true, message: 'Vui lòng nhập mã thiết bị!' }]}
                        tooltip="Mã thiết bị và Serial chỉ đổi được bằng Sửa lỗi nhập liệu; khi ghi nhận thay đổi, chúng được giữ nguyên"
                    >
                        <Input placeholder="Ví dụ: TB001" size="large" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item
                        label="Số Serial"
                        name="serial_number"
                        rules={[{ required: true, message: 'Vui lòng nhập số serial!' }]}
                        tooltip="Số serial duy nhất để phân biệt từng thiết bị"
                    >
                        <Input placeholder="Ví dụ: SN123456789" size="large" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item
                        label="Tên thiết bị"
                        name="ten_thiet_bi"
                        rules={[{ required: true, message: 'Vui lòng nhập tên thiết bị!' }]}
                    >
                        <Input placeholder="Nhập tên thiết bị" size="large" />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col xs={24} md={12}>
                    <Form.Item label="Phòng" name="phong_id">
                        <Select
                            size="large"
                            placeholder="Chọn phòng (có thể bỏ trống)"
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            options={phongs.map(p => ({ value: p.id, label: `${p.ten_phong} - ${p.khu_nha.ten_khu_nha}` }))}
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item
                        label="Loại thiết bị"
                        name="loai_thiet_bi"
                        rules={[{ required: true, message: 'Vui lòng chọn loại thiết bị!' }]}
                    >
                        <Select size="large" placeholder="Chọn loại thiết bị">
                            <Select.Option value="van_phong">Văn phòng</Select.Option>
                            <Select.Option value="day_hoc">Dạy học</Select.Option>
                            <Select.Option value="thi_nghiem">Thí nghiệm</Select.Option>
                            <Select.Option value="thuc_hanh">Thực hành</Select.Option>
                        </Select>
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col xs={24} md={12}>
                    <Form.Item label="Hãng sản xuất" name="hang_san_xuat">
                        <Input placeholder="Nhập hãng sản xuất" size="large" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item label="Model" name="model">
                        <Input placeholder="Nhập model" size="large" />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col xs={24} md={6}>
                    <Form.Item label="Năm sản xuất" name="nam_san_xuat"
                        rules={[
                            { type: 'number', min: 1900, message: 'Năm sản xuất phải từ 1900!' },
                            { type: 'number', max: new Date().getFullYear(), message: `Năm sản xuất không được vượt quá ${new Date().getFullYear()}!` },
                        ]}
                    >
                        <InputNumber style={{ width: '100%' }} size="large" placeholder="Năm SX" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                    <Form.Item label="Năm mua" name="nam_mua">
                        <InputNumber style={{ width: '100%' }} size="large" min={1900} max={new Date().getFullYear() + 10} placeholder="Năm mua" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                    <Form.Item
                        label="Ngày mua"
                        name="ngay_mua"
                        rules={[{ required: true, message: 'Vui lòng chọn ngày mua!' }]}
                        tooltip="Ngày mua để tính chu kỳ bảo dưỡng"
                    >
                        <DatePicker style={{ width: '100%' }} size="large" placeholder="Chọn ngày mua" format="DD/MM/YYYY" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item
                        label="Giá trị (VNĐ)"
                        name="gia_tri"
                        rules={[{ required: true, message: 'Vui lòng nhập giá trị!' }]}
                        tooltip="Giá trị của 1 thiết bị này"
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            size="large"
                            min={0}
                            placeholder="Nhập giá trị"
                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value.replace(/\$\s?|(,*)/g, '')}
                        />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item label="Thông số kỹ thuật" name="thong_so_ky_thuat">
                <TextArea rows={3} placeholder="Nhập thông số kỹ thuật" />
            </Form.Item>

            <Form.Item label="Mô tả" name="mo_ta">
                <TextArea rows={4} placeholder="Nhập mô tả về thiết bị" />
            </Form.Item>

            <Divider orientation="left">Thông tin bảo dưỡng</Divider>

            <Row gutter={16}>
                <Col xs={24} md={8}>
                    <Form.Item
                        label="Chu kỳ bảo dưỡng (tháng)"
                        name="chu_ky_bao_duong"
                        tooltip="Số tháng giữa các lần bảo dưỡng"
                    >
                        <InputNumber style={{ width: '100%' }} size="large" min={1} placeholder="Ví dụ: 6" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item label="Ngày bảo dưỡng cuối" name="ngay_bao_duong_cuoi" tooltip="Ngày bảo dưỡng gần nhất">
                        <DatePicker style={{ width: '100%' }} size="large" placeholder="Chọn ngày" format="DD/MM/YYYY" disabled />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item label="Trạng thái" name="trang_thai" rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}>
                        <Select size="large">
                            <Select.Option value="tot">Tốt</Select.Option>
                            <Select.Option value="can_sua_chua">Cần sửa chữa</Select.Option>
                            <Select.Option value="hu_hong">Hư hỏng</Select.Option>
                        </Select>
                    </Form.Item>
                </Col>
            </Row>

            {thietBi.ngay_bao_duong_tiep_theo && (
                <Card style={{ marginBottom: 16, background: canBaoDuong ? '#fff1f0' : '#f6ffed' }}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <strong>Ngày bảo dưỡng tiếp theo:</strong> {dayjs(thietBi.ngay_bao_duong_tiep_theo).format('DD/MM/YYYY')}
                        </Col>
                        <Col span={12}>
                            <strong>Còn lại:</strong>
                            <Tag color={canBaoDuong ? 'red' : 'green'} style={{ marginLeft: 8 }}>
                                {ngayDenBaoDuong > 0 ? `${ngayDenBaoDuong} ngày` : ngayDenBaoDuong === 0 ? 'Hôm nay' : `Quá hạn ${Math.abs(ngayDenBaoDuong)} ngày`}
                            </Tag>
                        </Col>
                    </Row>
                </Card>
            )}

            <Form.Item label="Ghi chú bảo dưỡng" name="ghi_chu_bao_duong">
                <TextArea rows={2} placeholder="Ghi chú về lịch bảo dưỡng" />
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
                    <Link href={`/thiet-bi/${thietBi.id}/duplicate`}>
                        <Tooltip title="Tạo thiết bị mới với thông tin giống thiết bị này">
                            <Button icon={<CopyOutlined />} size="large">Sao chép thiết bị</Button>
                        </Tooltip>
                    </Link>
                    <Link href="/thiet-bi">
                        <Button icon={<RollbackOutlined />} size="large">Quay lại</Button>
                    </Link>
                </Space>
            </Form.Item>
        </Form>
    );

    return (
        <MainLayout>
            <Row gutter={16}>
                {/* Form chính */}
                <Col xs={24} lg={qrUrl ? 18 : 24}>
                    <Card
                        title={
                            <Space>
                                <span>Chỉnh sửa thiết bị: {thietBi.ten_thiet_bi}</span>
                                <Tag color="blue">Phiên bản {thietBi.phien_ban ?? 1}</Tag>
                                {thietBi.hieu_luc_tu && (
                                    <Tooltip title="Ngày bắt đầu hiệu lực">
                                        <Tag color="green">Từ: {dayjs(thietBi.hieu_luc_tu).format('DD/MM/YYYY')}</Tag>
                                    </Tooltip>
                                )}
                            </Space>
                        }
                    >
                        {formContent}
                    </Card>
                </Col>

                {/* QR Code */}
                {qrUrl && (
                    <Col xs={24} lg={6}>
                        <Card 
                            title="Mã QR thiết bị" 
                            style={{ textAlign: 'center', position: 'sticky', top: 16 }}
                            styles={{ body: { padding: '16px 12px' } }}
                        >
                            <div ref={qrRef} style={{ marginBottom: 12 }}>
                                <QRCodeCanvas 
                                    value={qrUrl} 
                                    size={160} 
                                    level="M"
                                    includeMargin
                                    style={{ display: 'block', margin: '0 auto' }}
                                />
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{thietBi.ten_thiet_bi}</div>
                            <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>{thietBi.ma_thiet_bi}</div>
                            <Space>
                                <Button size="small" icon={<DownloadOutlined />} onClick={handleDownloadQr}>Tải</Button>
                                <Button size="small" icon={<PrinterOutlined />} onClick={handlePrintQr}>In</Button>
                            </Space>
                        </Card>
                    </Col>
                )}
            </Row>

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
                    Thông tin hiện tại của thiết bị <strong>{thietBi.ten_thiet_bi}</strong> sẽ được <strong>lưu vào lịch sử</strong> (hiệu lực đến hôm nay). Thông tin mới áp dụng từ hôm nay (<strong>phiên bản {(thietBi.phien_ban ?? 1) + 1}</strong>).
                </p>
                <Alert
                    message="Thông tin cũ được giữ lại để xuất báo cáo theo mốc thời gian."
                    type="success"
                    showIcon
                    style={{ marginTop: 12 }}
                />
                <Alert
                    message="Mã thiết bị, Số Serial và mã QR dán trên thiết bị được giữ nguyên."
                    type="info"
                    showIcon
                    style={{ marginTop: 8 }}
                />
            </Modal>
        </MainLayout>
    );
};

export default Edit;

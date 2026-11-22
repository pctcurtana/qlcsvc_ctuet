import React from 'react';
import MainLayout from '../Layout/MainLayout';
import { Form, Input, InputNumber, Button, Card, Space, Select, message, Row, Col, DatePicker } from 'antd';
import { SaveOutlined, RollbackOutlined } from '@ant-design/icons';
import { router, Link, usePage } from '@inertiajs/react';
import dayjs from 'dayjs';

const { TextArea } = Input;

const Create = ({ thietBis, thietBiId }) => {
    const [form] = Form.useForm();
    const { url } = usePage();

    const handleSubmit = (values) => {
        // Format dates
        const formattedValues = {
            ...values,
            ngay_bao_duong: values.ngay_bao_duong ? dayjs(values.ngay_bao_duong).format('YYYY-MM-DD') : null,
        };

        router.post('/lich-su-bao-duong', formattedValues, {
            // success toast hiển thị qua flash ở MainLayout
            onError: (errors) => {
                Object.keys(errors).forEach(key => {
                    message.error(errors[key]);
                });
            },
        });
    };

    return (
        <MainLayout>
            <Card title="Thêm lịch sử bảo dưỡng">
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                        thiet_bi_id: thietBiId,
                        trang_thai: 'hoan_thanh',
                        ngay_bao_duong: dayjs(),
                        chi_phi: 0,
                    }}
                >
                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Thiết bị"
                                name="thiet_bi_id"
                                rules={[
                                    { required: true, message: 'Vui lòng chọn thiết bị!' },
                                ]}
                            >
                                <Select 
                                    size="large" 
                                    placeholder="Chọn thiết bị cần bảo dưỡng"
                                    showSearch
                                    optionFilterProp="label"
                                    options={thietBis.map(tb => ({ 
                                        value: tb.id, 
                                        label: `${tb.ma_thiet_bi} - ${tb.ten_thiet_bi}${tb.phong ? ` (${tb.phong.ten_phong})` : ''}` 
                                    }))}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Ngày bảo dưỡng"
                                name="ngay_bao_duong"
                                rules={[
                                    { required: true, message: 'Vui lòng chọn ngày bảo dưỡng!' },
                                ]}
                            >
                                <DatePicker 
                                    style={{ width: '100%' }}
                                    size="large"
                                    placeholder="Chọn ngày bảo dưỡng"
                                    format="DD/MM/YYYY"
                                    disabledDate={(d) => d && d.isAfter(dayjs(), 'day')}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col xs={24} md={8}>
                            <Form.Item
                                label="Loại bảo dưỡng"
                                name="loai_bao_duong"
                                rules={[
                                    { required: true, message: 'Vui lòng chọn loại bảo dưỡng!' },
                                ]}
                            >
                                <Select size="large" placeholder="Chọn loại bảo dưỡng">
                                    <Select.Option value="dinh_ky">Định kỳ</Select.Option>
                                    <Select.Option value="sua_chua">Sửa chữa</Select.Option>
                                    <Select.Option value="thay_the">Thay thế</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                            <Form.Item
                                label="Chi phí (VNĐ)"
                                name="chi_phi"
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    size="large"
                                    min={0}
                                    placeholder="Nhập chi phí"
                                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                            <Form.Item
                                label="Trạng thái"
                                name="trang_thai"
                                rules={[
                                    { required: true, message: 'Vui lòng chọn trạng thái!' },
                                ]}
                            >
                                <Select size="large">
                                    <Select.Option value="hoan_thanh">Hoàn thành</Select.Option>
                                    <Select.Option value="dang_thuc_hien">Đang thực hiện</Select.Option>
                                    <Select.Option value="chua_thuc_hien">Chưa thực hiện</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        label="Nội dung công việc"
                        name="noi_dung"
                        rules={[
                            { required: true, message: 'Vui lòng nhập nội dung!' },
                        ]}
                    >
                        <TextArea 
                            rows={4} 
                            placeholder="Mô tả chi tiết công việc bảo dưỡng đã thực hiện"
                        />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Người thực hiện"
                                name="nguoi_thuc_hien"
                            >
                                <Input placeholder="Nhập tên người thực hiện" size="large" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Đơn vị thực hiện"
                                name="don_vi_thuc_hien"
                            >
                                <Input placeholder="Nhập tên đơn vị thực hiện" size="large" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        label="Ghi chú"
                        name="ghi_chu"
                    >
                        <TextArea rows={3} placeholder="Ghi chú thêm (nếu có)" />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="large">
                                Lưu
                            </Button>
                            <Link href="/lich-su-bao-duong">
                                <Button icon={<RollbackOutlined />} size="large">
                                    Quay lại
                                </Button>
                            </Link>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </MainLayout>
    );
};

export default Create;


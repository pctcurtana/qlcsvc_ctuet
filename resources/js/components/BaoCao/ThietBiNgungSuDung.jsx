import React from 'react';
import { Head, router } from '@inertiajs/react';
import { Result, Button, Typography, Space } from 'antd';
import MainLayout from '../Layout/MainLayout';

const { Text } = Typography;

// Trang hiển thị khi quét QR của thiết bị đã ngừng sử dụng hoặc của phiên bản cũ
const ThietBiNgungSuDung = ({ thietBi }) => (
    <MainLayout>
        <Head title="Thiết bị đã ngừng sử dụng" />
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <Result
                status="warning"
                title="Thiết bị đã ngừng sử dụng"
                subTitle={
                    <Space direction="vertical" align="center">
                        <Text strong>
                            {thietBi?.ten_thiet_bi} ({thietBi?.ma_thiet_bi})
                        </Text>
                        {thietBi?.ngay_ngung && (
                            <Text type="secondary">Mã QR này hết hiệu lực từ ngày {thietBi.ngay_ngung}.</Text>
                        )}
                        <Text type="secondary">Không thể ghi nhận sửa chữa cho thiết bị này.</Text>
                    </Space>
                }
                extra={
                    <Button type="primary" onClick={() => router.visit('/')}>
                        Về trang chủ
                    </Button>
                }
            />
        </div>
    </MainLayout>
);

export default ThietBiNgungSuDung;

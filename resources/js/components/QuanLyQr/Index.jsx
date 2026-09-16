import React, { useState, useRef, useCallback, forwardRef } from 'react';
import { router, Head } from '@inertiajs/react';
import usePermission from '../../hooks/usePermission';
import MainLayout from '../Layout/MainLayout';
import { QRCodeCanvas } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import {
    Card, Tabs, Table, Typography, Space, Tag, Input, Button, Select,
    Tooltip, Modal, message, Row, Col,
} from 'antd';
import {
    QrcodeOutlined, DownloadOutlined, ReloadOutlined, PrinterOutlined,
    HomeOutlined, ToolOutlined, SearchOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { confirm } = Modal;

const LOAI_TB_LABELS = {
    van_phong: 'Văn phòng', day_hoc: 'Dạy học',
    thi_nghiem: 'Thí nghiệm', thuc_hanh: 'Thực hành',
};

const QR_SIZE = 160;

// ─── Component In Hàng Loạt ────────────────────────────────────────────
const PrintQRBatch = forwardRef(({ items, type }, ref) => {
    if (!items || items.length === 0) return <div ref={ref} />;
    
    return (
        <div ref={ref} className="print-wrapper">
            <style>{`
                .print-wrapper {
                    position: fixed;
                    left: -9999px;
                    top: 0;
                    width: 210mm;
                }
                @media print {
                    .print-wrapper {
                        position: static;
                        left: auto;
                    }
                    .print-qr-grid {
                        display: grid !important;
                        grid-template-columns: repeat(3, 1fr) !important;
                        gap: 10mm !important;
                    }
                    .print-qr-item {
                        break-inside: avoid;
                        page-break-inside: avoid;
                        text-align: center;
                        padding: 5mm;
                        border: 1px solid #ccc;
                        border-radius: 4px;
                    }
                    .print-qr-item h4 {
                        margin: 5mm 0 2mm 0 !important;
                        font-size: 11pt !important;
                    }
                    .print-qr-item p {
                        margin: 2mm 0 !important;
                        font-size: 9pt !important;
                    }
                }
            `}</style>
            <div style={{ padding: '10mm' }}>
                <div style={{ textAlign: 'center', marginBottom: '10mm' }}>
                    <h2 style={{ margin: '0 0 5px 0' }}>
                        {type === 'phong' ? 'QR Báo Cáo Sự Cố - Phòng' : 'QR Sửa Chữa - Thiết Bị'}
                    </h2>
                    <p style={{ margin: 0, color: '#666' }}>In ngày: {new Date().toLocaleDateString('vi-VN')}</p>
                </div>
                <div className="print-qr-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10mm' }}>
                    {items.map(item => (
                        <div key={item.id} className="print-qr-item" style={{ textAlign: 'center', padding: '5mm', border: '1px solid #ccc', borderRadius: '4px' }}>
                            <QRCodeCanvas 
                                value={item.url} 
                                size={100}
                                level="M"
                                includeMargin={false}
                            />
                            <h4 style={{ margin: '8px 0 4px 0', fontSize: '12px' }}>{item.name}</h4>
                            {item.code && <p style={{ margin: '2px 0', fontSize: '11px', color: '#333' }}>Mã: {item.code}</p>}
                            {item.extra && <p style={{ margin: '2px 0', fontSize: '10px', color: '#666' }}>{item.extra}</p>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
});

PrintQRBatch.displayName = 'PrintQRBatch';

// Single QR preview component with download and print buttons
const QrCell = ({ url, filename, onPrint }) => {
    const canvasRef = useRef(null);

    const handleDownload = useCallback(() => {
        const canvas = canvasRef.current?.querySelector('canvas');
        if (!canvas) return;
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${filename}.png`;
        a.click();
    }, [filename]);

    return (
        <Space direction="vertical" align="center" size={6}>
            <div ref={canvasRef}>
                <QRCodeCanvas
                    value={url}
                    size={QR_SIZE}
                    level="M"
                    includeMargin={true}
                    imageSettings={{
                        src: '/images/logoctuet.png',
                        x: undefined,
                        y: undefined,
                        height: 28,
                        width: 28,
                        excavate: true,
                    }}
                />
            </div>
            <Space size={4}>
                <Tooltip title="Tải xuống PNG">
                    <Button size="small" icon={<DownloadOutlined />} onClick={handleDownload}>
                        Tải
                    </Button>
                </Tooltip>
                <Tooltip title="In QR này">
                    <Button size="small" icon={<PrinterOutlined />} onClick={onPrint}>
                        In
                    </Button>
                </Tooltip>
            </Space>
        </Space>
    );
};

// ─── Tab Phòng ─────────────────────────────────────────────────────────────
const TabPhong = ({ phongs, baseUrl, perm, coSos, khuNhas, filters }) => {
    const [search, setSearch] = useState(filters.search || '');
    const [coSoFilter, setCoSoFilter] = useState(filters.co_so_id || null);
    const [khuNhaFilter, setKhuNhaFilter] = useState(filters.khu_nha_id || null);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [printModalOpen, setPrintModalOpen] = useState(false);
    const printRef = useRef(null);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `QR_Phong_${new Date().getTime()}.pdf`,
    });

    const fetchData = (params = {}) => {
        router.get('/quan-ly-qr', {
            tab: 'phong',
            search: params.search ?? search,
            co_so_id: params.co_so_id ?? coSoFilter,
            khu_nha_id: params.khu_nha_id ?? khuNhaFilter,
            per_page: params.per_page ?? phongs.per_page,
            page: params.page ?? 1,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleSearch = (value) => {
        fetchData({ search: value, page: 1 });
    };

    const handleCoSoFilter = (value) => {
        setCoSoFilter(value);
        setKhuNhaFilter(null);
        fetchData({ co_so_id: value, khu_nha_id: null, page: 1 });
    };

    const handleKhuNhaFilter = (value) => {
        setKhuNhaFilter(value);
        fetchData({ khu_nha_id: value, page: 1 });
    };

    const filteredKhuNhas = (khuNhas || []).filter(kn => 
        !coSoFilter || kn.co_so_id === coSoFilter
    );

    const handlePrintBatch = () => {
        if (selectedRowKeys.length === 0) {
            message.warning('Vui lòng chọn ít nhất 1 phòng!');
            return;
        }
        setPrintModalOpen(true);
    };

    const handleConfirmPrint = () => {
        setPrintModalOpen(false);
        handlePrint();
    };

    const handlePrintSingle = (phong) => {
        const printWindow = window.open('', '_blank', 'height=500,width=400');
        const qrValue = `${baseUrl}/bao-cao/phong/${phong.qr_token}`;
        printWindow.document.write(`
            <html>
                <head>
                    <title>In QR - ${phong.ten_phong}</title>
                    <style>
                        body { margin: 20mm; text-align: center; font-family: Arial; }
                        h2 { margin: 0 0 10px 0; }
                        p { margin: 5px 0; color: #666; }
                        .qr-container { margin: 20px auto; }
                        @media print { body { margin: 10mm; } }
                    </style>
                </head>
                <body onload="window.print()">
                    <h2>${phong.ten_phong}</h2>
                    <p>Mã: ${phong.ma_phong}</p>
                    <p>${phong.ten_khu_nha} - ${phong.ten_co_so}</p>
                    <div class="qr-container">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrValue)}" alt="QR Code" />
                    </div>
                    <p style="margin-top: 15px; font-size: 11px;">Quét để báo cáo sự cố</p>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleRegenerate = (phong) => {
        confirm({
            title: 'Tạo lại mã QR?',
            icon: <ExclamationCircleOutlined />,
            content: (
                <Space direction="vertical" size={4}>
                    <Text>Mã QR cũ sẽ <strong>ngừng hoạt động</strong> ngay lập tức.</Text>
                    <Text type="secondary">Phòng: <strong>{phong.ten_phong}</strong></Text>
                </Space>
            ),
            okText: 'Tạo lại',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk() {
                router.post(`/quan-ly-qr/phong/${phong.id}/regenerate`);
            },
        });
    };

    const columns = [
        {
            title: 'Mã QR',
            key: 'qr',
            width: 200,
            align: 'center',
            render: (_, r) => r.qr_token ? (
                <QrCell
                    url={`${baseUrl}/bao-cao/phong/${r.qr_token}`}
                    filename={`qr-phong-${r.ma_phong}`}
                    onPrint={() => handlePrintSingle(r)}
                />
            ) : <Tag color="red">Chưa có token</Tag>,
        },
        {
            title: 'Phòng',
            key: 'phong',
            render: (_, r) => (
                <Space direction="vertical" size={2}>
                    <Space>
                        <Text strong>{r.ten_phong}</Text>
                        <Tag color="blue">{r.ma_phong}</Tag>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {r.ten_khu_nha} — {r.ten_co_so}
                    </Text>
                </Space>
            ),
        },
        {
            title: 'URL Báo cáo',
            key: 'url',
            render: (_, r) => r.qr_token ? (
                <Text copyable style={{ fontSize: 12, color: '#244380', wordBreak: 'break-all' }}>
                    {baseUrl}/bao-cao/phong/{r.qr_token}
                </Text>
            ) : '—',
        },
        ...(perm.can_regenerate_qr ? [{
            title: 'Thao tác',
            key: 'action',
            width: 100,
            align: 'center',
            render: (_, r) => (
                <Tooltip title="Tạo lại QR">
                    <Button size="small" danger icon={<ReloadOutlined />} onClick={() => handleRegenerate(r)}>
                        Tạo lại
                    </Button>
                </Tooltip>
            ),
        }] : []),
    ];

    const phongData = phongs?.data ?? [];

    const printData = selectedRowKeys
        .map(id => phongData.find(p => p.id === id))
        .filter(Boolean)
        .map(p => ({
            id: p.id,
            name: p.ten_phong,
            code: p.ma_phong,
            extra: `${p.ten_khu_nha} - ${p.ten_co_so}`,
            url: `${baseUrl}/bao-cao/phong/${p.qr_token}`,
        }));

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Row gutter={[16, 12]}>
                <Col xs={24} sm={12} md={6}>
                    <Input
                        placeholder="Tìm phòng, mã..."
                        allowClear
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        size="large"
                        value={search}
                        onChange={e => {
                            setSearch(e.target.value);
                            if (!e.target.value) handleSearch('');
                        }}
                        onPressEnter={e => handleSearch(e.target.value)}
                    />
                </Col>
                <Col xs={24} sm={12} md={5}>
                    <Select
                        placeholder="Lọc theo cơ sở"
                        size="large"
                        allowClear
                        value={coSoFilter || undefined}
                        onChange={handleCoSoFilter}
                        options={(coSos || []).map(cs => ({ value: cs.id, label: cs.ten_co_so }))}
                        style={{ width: '100%' }}
                    />
                </Col>
                <Col xs={24} sm={12} md={5}>
                    <Select
                        placeholder="Lọc theo toà nhà"
                        size="large"
                        allowClear
                        value={khuNhaFilter || undefined}
                        onChange={handleKhuNhaFilter}
                        options={filteredKhuNhas.map(kn => ({ value: kn.id, label: kn.ten_khu_nha }))}
                        style={{ width: '100%' }}
                    />
                </Col>
                <Col>
                    <Button
                        icon={<PrinterOutlined />}
                        size="large"
                        type={selectedRowKeys.length > 0 ? 'primary' : 'default'}
                        onClick={handlePrintBatch}
                        disabled={selectedRowKeys.length === 0}
                    >
                        In hàng loạt ({selectedRowKeys.length})
                    </Button>
                </Col>
            </Row>
            <Table
                dataSource={phongData}
                columns={columns}
                rowKey="id"
                pagination={{
                    current: phongs.current_page,
                    pageSize: phongs.per_page,
                    total: phongs.total,
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng ${total} phòng`,
                    onChange: (page, pageSize) => {
                        fetchData({ page, per_page: pageSize });
                    },
                }}
                scroll={{ x: 900 }}
                size="small"
                rowSelection={{
                    selectedRowKeys,
                    onChange: setSelectedRowKeys,
                }}
            />

            <Modal
                title={`In Hàng Loạt (${selectedRowKeys.length} phòng)`}
                open={printModalOpen}
                onCancel={() => setPrintModalOpen(false)}
                width={900}
                footer={[
                    <Button key="cancel" onClick={() => setPrintModalOpen(false)}>Hủy</Button>,
                    <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handleConfirmPrint}>
                        In Ngay
                    </Button>,
                ]}
            >
                <div style={{ maxHeight: '500px', overflowY: 'auto', padding: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                        {printData.map(item => (
                            <div key={item.id} style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
                                <QRCodeCanvas value={item.url} size={90} />
                                <p style={{ margin: '8px 0 0 0', fontSize: '12px', fontWeight: 'bold' }}>{item.name}</p>
                                <p style={{ margin: '4px 0', fontSize: '11px', color: '#666' }}>Mã: {item.code}</p>
                                <p style={{ margin: '4px 0', fontSize: '10px', color: '#999' }}>{item.extra}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>

            <PrintQRBatch ref={printRef} items={printData} type="phong" />
        </Space>
    );
};

// ─── Tab Thiết bị ──────────────────────────────────────────────────────────
const TabThietBi = ({ thietBis, baseUrl, perm, coSos, khuNhas, phongsList, filters }) => {
    const [search, setSearch] = useState(filters.search || '');
    const [coSoFilter, setCoSoFilter] = useState(filters.co_so_id || null);
    const [khuNhaFilter, setKhuNhaFilter] = useState(filters.khu_nha_id || null);
    const [phongFilter, setPhongFilter] = useState(filters.phong_id || null);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [printModalOpen, setPrintModalOpen] = useState(false);
    const printRef = useRef(null);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `QR_ThietBi_${new Date().getTime()}.pdf`,
    });

    const fetchData = (params = {}) => {
        router.get('/quan-ly-qr', {
            tab: 'thiet-bi',
            search: params.search ?? search,
            co_so_id: params.co_so_id ?? coSoFilter,
            khu_nha_id: params.khu_nha_id ?? khuNhaFilter,
            phong_id: params.phong_id ?? phongFilter,
            per_page: params.per_page ?? thietBis.per_page,
            page: params.page ?? 1,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleSearch = (value) => {
        fetchData({ search: value, page: 1 });
    };

    const handleCoSoFilter = (value) => {
        setCoSoFilter(value);
        setKhuNhaFilter(null);
        setPhongFilter(null);
        fetchData({ co_so_id: value, khu_nha_id: null, phong_id: null, page: 1 });
    };

    const handleKhuNhaFilter = (value) => {
        setKhuNhaFilter(value);
        setPhongFilter(null);
        fetchData({ khu_nha_id: value, phong_id: null, page: 1 });
    };

    const handlePhongFilter = (value) => {
        setPhongFilter(value);
        fetchData({ phong_id: value, page: 1 });
    };

    const filteredKhuNhas = (khuNhas || []).filter(kn => !coSoFilter || kn.co_so_id === coSoFilter);
    const filteredPhongs = (phongsList || []).filter(p => !khuNhaFilter || p.khu_nha_id === khuNhaFilter);

    const handlePrintBatch = () => {
        if (selectedRowKeys.length === 0) {
            message.warning('Vui lòng chọn ít nhất 1 thiết bị!');
            return;
        }
        setPrintModalOpen(true);
    };

    const handleConfirmPrint = () => {
        setPrintModalOpen(false);
        handlePrint();
    };

    const handlePrintSingle = (tb) => {
        const printWindow = window.open('', '_blank', 'height=500,width=400');
        const qrValue = `${baseUrl}/qr/thiet-bi/${tb.qr_token}`;
        printWindow.document.write(`
            <html>
                <head>
                    <title>In QR - ${tb.ten_thiet_bi}</title>
                    <style>
                        body { margin: 20mm; text-align: center; font-family: Arial; }
                        h2 { margin: 0 0 10px 0; }
                        p { margin: 5px 0; color: #666; }
                        .qr-container { margin: 20px auto; }
                        @media print { body { margin: 10mm; } }
                    </style>
                </head>
                <body onload="window.print()">
                    <h2>${tb.ten_thiet_bi}</h2>
                    <p>Mã: ${tb.ma_thiet_bi}</p>
                    <p>Loại: ${LOAI_TB_LABELS[tb.loai_thiet_bi] ?? tb.loai_thiet_bi}</p>
                    <p>${tb.ten_phong || ''} ${tb.ten_khu_nha ? '- ' + tb.ten_khu_nha : ''}</p>
                    <div class="qr-container">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrValue)}" alt="QR Code" />
                    </div>
                    <p style="margin-top: 15px; font-size: 11px;">Quét để ghi nhận sửa chữa</p>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleRegenerate = (tb) => {
        confirm({
            title: 'Tạo lại mã QR?',
            icon: <ExclamationCircleOutlined />,
            content: (
                <Space direction="vertical" size={4}>
                    <Text>Mã QR cũ sẽ <strong>ngừng hoạt động</strong> ngay lập tức.</Text>
                    <Text type="secondary">Thiết bị: <strong>{tb.ten_thiet_bi}</strong></Text>
                </Space>
            ),
            okText: 'Tạo lại',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk() {
                router.post(`/quan-ly-qr/thiet-bi/${tb.id}/regenerate`);
            },
        });
    };

    const columns = [
        {
            title: 'Mã QR',
            key: 'qr',
            width: 200,
            align: 'center',
            render: (_, r) => r.qr_token ? (
                <QrCell 
                    url={`${baseUrl}/qr/thiet-bi/${r.qr_token}`} 
                    filename={`qr-thietbi-${r.ma_thiet_bi}`}
                    onPrint={() => handlePrintSingle(r)}
                />
            ) : <Tag color="red">Chưa có token</Tag>,
        },
        {
            title: 'Thiết bị',
            key: 'thiet_bi',
            render: (_, r) => (
                <Space direction="vertical" size={2}>
                    <Space>
                        <Text strong>{r.ten_thiet_bi}</Text>
                        <Tag color="blue">{r.ma_thiet_bi}</Tag>
                    </Space>
                    <Tag color="default" style={{ fontSize: 11 }}>
                        {LOAI_TB_LABELS[r.loai_thiet_bi] ?? r.loai_thiet_bi}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {r.ten_phong && `${r.ten_phong} — `}{r.ten_khu_nha}
                        {r.ten_co_so && ` — ${r.ten_co_so}`}
                    </Text>
                </Space>
            ),
        },
        {
            title: 'URL Sửa chữa',
            key: 'url',
            render: (_, r) => (
                <Text copyable style={{ fontSize: 12, color: '#244380', wordBreak: 'break-all' }}>
                    {baseUrl}/qr/thiet-bi/{r.qr_token}
                </Text>
            ),
        },
        ...(perm.can_regenerate_qr ? [{
            title: 'Thao tác',
            key: 'action',
            width: 100,
            align: 'center',
            render: (_, r) => (
                <Tooltip title="Tạo lại QR">
                    <Button size="small" danger icon={<ReloadOutlined />} onClick={() => handleRegenerate(r)}>
                        Tạo lại
                    </Button>
                </Tooltip>
            ),
        }] : []),
    ];

    const tbData = thietBis?.data ?? [];

    const printData = selectedRowKeys
        .map(id => tbData.find(tb => tb.id === id))
        .filter(Boolean)
        .map(tb => ({
            id: tb.id,
            name: tb.ten_thiet_bi,
            code: tb.ma_thiet_bi,
            extra: `${LOAI_TB_LABELS[tb.loai_thiet_bi] ?? tb.loai_thiet_bi} - ${tb.ten_phong || 'Chưa phân bổ'}`,
            url: `${baseUrl}/qr/thiet-bi/${tb.qr_token}`,
        }));

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Row gutter={[16, 12]}>
                <Col xs={24} sm={12} md={5}>
                    <Input
                        placeholder="Tìm thiết bị, mã..."
                        allowClear
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        size="large"
                        value={search}
                        onChange={e => {
                            setSearch(e.target.value);
                            if (!e.target.value) handleSearch('');
                        }}
                        onPressEnter={e => handleSearch(e.target.value)}
                    />
                </Col>
                <Col xs={24} sm={12} md={4}>
                    <Select
                        placeholder="Cơ sở"
                        size="large"
                        allowClear
                        value={coSoFilter || undefined}
                        onChange={handleCoSoFilter}
                        options={(coSos || []).map(cs => ({ value: cs.id, label: cs.ten_co_so }))}
                        style={{ width: '100%' }}
                    />
                </Col>
                <Col xs={24} sm={12} md={4}>
                    <Select
                        placeholder="Toà nhà"
                        size="large"
                        allowClear
                        value={khuNhaFilter || undefined}
                        onChange={handleKhuNhaFilter}
                        options={filteredKhuNhas.map(kn => ({ value: kn.id, label: kn.ten_khu_nha }))}
                        style={{ width: '100%' }}
                    />
                </Col>
                <Col xs={24} sm={12} md={4}>
                    <Select
                        placeholder="Phòng"
                        size="large"
                        allowClear
                        value={phongFilter || undefined}
                        onChange={handlePhongFilter}
                        options={filteredPhongs.map(p => ({ value: p.id, label: p.ten_phong }))}
                        style={{ width: '100%' }}
                        disabled={!khuNhaFilter}
                    />
                </Col>
                <Col>
                    <Button
                        icon={<PrinterOutlined />}
                        size="large"
                        type={selectedRowKeys.length > 0 ? 'primary' : 'default'}
                        onClick={handlePrintBatch}
                        disabled={selectedRowKeys.length === 0}
                    >
                        In hàng loạt ({selectedRowKeys.length})
                    </Button>
                </Col>
            </Row>
            <Table
                dataSource={tbData}
                columns={columns}
                rowKey="id"
                pagination={{
                    current: thietBis.current_page,
                    pageSize: thietBis.per_page,
                    total: thietBis.total,
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng ${total} thiết bị`,
                    onChange: (page, pageSize) => {
                        fetchData({ page, per_page: pageSize });
                    },
                }}
                scroll={{ x: 900 }}
                size="small"
                rowSelection={{
                    selectedRowKeys,
                    onChange: setSelectedRowKeys,
                }}
            />

            <Modal
                title={`In Hàng Loạt (${selectedRowKeys.length} thiết bị)`}
                open={printModalOpen}
                onCancel={() => setPrintModalOpen(false)}
                width={900}
                footer={[
                    <Button key="cancel" onClick={() => setPrintModalOpen(false)}>Hủy</Button>,
                    <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handleConfirmPrint}>
                        In Ngay
                    </Button>,
                ]}
            >
                <div style={{ maxHeight: '500px', overflowY: 'auto', padding: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                        {printData.map(item => (
                            <div key={item.id} style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
                                <QRCodeCanvas value={item.url} size={90} />
                                <p style={{ margin: '8px 0 0 0', fontSize: '12px', fontWeight: 'bold' }}>{item.name}</p>
                                <p style={{ margin: '4px 0', fontSize: '11px', color: '#666' }}>Mã: {item.code}</p>
                                <p style={{ margin: '4px 0', fontSize: '10px', color: '#999' }}>{item.extra}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>

            <PrintQRBatch ref={printRef} items={printData} type="thiet-bi" />
        </Space>
    );
};

// ─── Main Page ─────────────────────────────────────────────────────────────
const QuanLyQrIndex = ({ phongs, thietBis, baseUrl, coSos, khuNhas, phongsList, filters = {}, activeTab = 'phong' }) => {
    const perm = usePermission('quan-ly-qr');

    const handleTabChange = (key) => {
        router.get('/quan-ly-qr', { tab: key }, {
            preserveState: false,
            replace: true,
        });
    };

    const tabItems = [
        {
            key: 'phong',
            label: <Space><HomeOutlined />Phòng ({phongs?.total ?? 0})</Space>,
            children: <TabPhong phongs={phongs ?? { data: [] }} baseUrl={baseUrl} perm={perm} coSos={coSos} khuNhas={khuNhas} filters={activeTab === 'phong' ? filters : {}} />,
        },
        {
            key: 'thiet-bi',
            label: <Space><ToolOutlined />Thiết bị ({thietBis?.total ?? 0})</Space>,
            children: <TabThietBi thietBis={thietBis ?? { data: [] }} baseUrl={baseUrl} perm={perm} coSos={coSos} khuNhas={khuNhas} phongsList={phongsList} filters={activeTab === 'thiet-bi' ? filters : {}} />,
        },
    ];

    return (
        <MainLayout>
            <Head title="Quản lý Mã QR" />
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Card bodyStyle={{ padding: '16px 24px' }}>
                    <Row align="middle" gutter={16}>
                        <Col>
                            <QrcodeOutlined style={{ fontSize: 32, color: '#244380' }} />
                        </Col>
                        <Col flex="auto">
                            <Title level={3} style={{ margin: 0 }}>Quản lý Mã QR</Title>
                            <Text type="secondary">
                                Tạo và quản lý mã QR cho phòng (báo cáo sự cố) và thiết bị (ghi nhận sửa chữa)
                            </Text>
                        </Col>
                    </Row>
                </Card>

                <Card>
                    <Tabs activeKey={activeTab} onChange={handleTabChange} items={tabItems} size="large" />
                </Card>
            </Space>
        </MainLayout>
    );
};

export default QuanLyQrIndex;

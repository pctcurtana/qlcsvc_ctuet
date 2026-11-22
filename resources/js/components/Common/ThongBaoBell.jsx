import React, { useEffect, useState } from 'react';
import { Badge, Button, Empty, List, Popover, Spin, Tag, Tooltip, Typography, message } from 'antd';
import { BellOutlined, SoundOutlined, MutedOutlined, CheckOutlined } from '@ant-design/icons';
import { router, usePage } from '@inertiajs/react';
import dayjs from 'dayjs';
import {
    SU_KIEN_BAO_CAO_MOI, MUC_DO, amThanhDangBat, datAmThanh, phatThu,
} from '../../realtime/thongBaoBaoCao';

const { Text } = Typography;

const thoiGian = (iso) => (iso ? dayjs(iso).format('HH:mm DD/MM/YYYY') : '');

/**
 * Chuông thông báo ở header: số chưa đọc, danh sách 10 thông báo gần nhất, đánh dấu đã đọc, bật/tắt âm thanh.
 * Đăng ký kênh realtime nằm ở module realtime/thongBaoBaoCao.js (MainLayout gọi dangKy).
 */
const ThongBaoBell = () => {
    const { thongBaoChuaDoc } = usePage().props;
    const [chuaDoc, setChuaDoc] = useState(thongBaoChuaDoc ?? 0);
    const [items, setItems] = useState([]);
    const [dangTai, setDangTai] = useState(false);
    const [mo, setMo] = useState(false);
    const [amThanh, setAmThanh] = useState(amThanhDangBat());

    // Mỗi lần tải trang server trả số mới nhất
    useEffect(() => setChuaDoc(thongBaoChuaDoc ?? 0), [thongBaoChuaDoc]);

    // Báo cáo mới đến (realtime) → tăng số, đưa lên đầu danh sách
    useEffect(() => {
        const khiCoMoi = (e) => {
            const tb = e.detail;
            setChuaDoc((n) => n + 1);
            setItems((ds) => [{ id: tb.id, data: tb, read_at: null, created_at: tb.created_at }, ...ds].slice(0, 10));
        };
        window.addEventListener(SU_KIEN_BAO_CAO_MOI, khiCoMoi);
        return () => window.removeEventListener(SU_KIEN_BAO_CAO_MOI, khiCoMoi);
    }, []);

    const taiDanhSach = async () => {
        setDangTai(true);
        try {
            const { data } = await window.axios.get('/thong-bao');
            setItems(data.items);
            setChuaDoc(data.chuaDoc);
        } catch (e) {
            message.error('Không tải được danh sách thông báo.');
        } finally {
            setDangTai(false);
        }
    };

    const moThongBao = async (item) => {
        if (!item.read_at && item.id) {
            try {
                const { data } = await window.axios.post(`/thong-bao/${item.id}/da-doc`);
                setChuaDoc(data.chuaDoc);
            } catch (e) {
                // không đánh dấu được vẫn cho mở trang
            }
        }
        setMo(false);
        router.visit(item.data?.url || '/bao-cao-su-co');
    };

    const docTatCa = async () => {
        try {
            await window.axios.post('/thong-bao/da-doc-tat-ca');
            setChuaDoc(0);
            setItems((ds) => ds.map((i) => ({ ...i, read_at: i.read_at || new Date().toISOString() })));
        } catch (e) {
            message.error('Không đánh dấu được. Vui lòng thử lại.');
        }
    };

    const doiAmThanh = () => {
        const bat = !amThanh;
        datAmThanh(bat);
        setAmThanh(bat);
        if (bat) phatThu(); // cho nghe thử, đồng thời mở khoá âm thanh của trình duyệt
    };

    const noiDung = (
        <div style={{ width: 340, maxWidth: 'calc(100vw - 32px)' }}>
            <div className="flex items-center justify-between mb-2">
                <Text strong>Thông báo</Text>
                <div className="flex items-center gap-1">
                    <Tooltip title={amThanh ? 'Tắt âm thanh' : 'Bật âm thanh'}>
                        <Button
                            size="small"
                            type="text"
                            aria-label={amThanh ? 'Tắt âm thanh thông báo' : 'Bật âm thanh thông báo'}
                            icon={amThanh ? <SoundOutlined /> : <MutedOutlined />}
                            onClick={doiAmThanh}
                        />
                    </Tooltip>
                    <Button size="small" type="link" icon={<CheckOutlined />} disabled={chuaDoc === 0} onClick={docTatCa}>
                        Đã đọc tất cả
                    </Button>
                </div>
            </div>
            <Spin spinning={dangTai}>
                {items.length === 0 && !dangTai ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có thông báo" />
                ) : (
                    <List
                        size="small"
                        style={{ maxHeight: 380, overflowY: 'auto' }}
                        dataSource={items}
                        renderItem={(item) => {
                            const d = item.data || {};
                            const mucDo = MUC_DO[d.muc_do];
                            return (
                                <List.Item
                                    onClick={() => moThongBao(item)}
                                    style={{
                                        cursor: 'pointer',
                                        background: item.read_at ? 'transparent' : 'rgba(24, 144, 255, 0.06)',
                                        borderRadius: 8,
                                        padding: '8px 10px',
                                    }}
                                >
                                    <div style={{ width: '100%' }}>
                                        <div className="flex items-center justify-between gap-2">
                                            <Text strong={!item.read_at} ellipsis>
                                                {d.thiet_bi}{d.phong ? ` – ${d.phong}` : ''}
                                            </Text>
                                            {mucDo && <Tag color={mucDo.color} style={{ marginInlineEnd: 0 }}>{mucDo.label}</Tag>}
                                        </div>
                                        <Text type="secondary" style={{ fontSize: 13 }} ellipsis={{ rows: 2 }}>
                                            {d.mo_ta}
                                        </Text>
                                        <div><Text type="secondary" style={{ fontSize: 12 }}>{thoiGian(item.created_at)}</Text></div>
                                    </div>
                                </List.Item>
                            );
                        }}
                    />
                )}
            </Spin>
        </div>
    );

    return (
        <Popover
            content={noiDung}
            trigger="click"
            placement="bottomRight"
            open={mo}
            onOpenChange={(o) => { setMo(o); if (o) taiDanhSach(); }}
        >
            <Badge count={chuaDoc} size="small" overflowCount={99}>
                <Button
                    type="text"
                    shape="circle"
                    aria-label={`Thông báo${chuaDoc ? `, ${chuaDoc} chưa đọc` : ''}`}
                    icon={<BellOutlined style={{ fontSize: 18 }} />}
                />
            </Badge>
        </Popover>
    );
};

export default ThongBaoBell;

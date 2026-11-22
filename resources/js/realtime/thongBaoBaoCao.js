import React from 'react';
import { notification, Button } from 'antd';
import { router } from '@inertiajs/react';

/**
 * Thông báo realtime "báo cáo sự cố mới".
 *
 * Module dùng chung (sống suốt phiên trình duyệt): MainLayout bị gắn lại mỗi lần chuyển trang,
 * nên trạng thái đăng ký, toast và âm thanh được giữ ở đây thay vì trong component.
 */

export const SU_KIEN_BAO_CAO_MOI = 'thong-bao-bao-cao-moi';
const KHOA_AM_THANH = 'qlcsvc.thongBao.amThanh';
const KHOANG_CHONG_KEU_DON = 5000; // nhiều báo cáo đến trong 5 giây → chỉ kêu 1 lần

export const MUC_DO = {
    thap: { color: 'green', label: 'Thấp', hex: '#52c41a' },
    trung_binh: { color: 'orange', label: 'Trung bình', hex: '#fa8c16' },
    cao: { color: 'red', label: 'Cao', hex: '#f5222d' },
    khan_cap: { color: 'purple', label: 'Khẩn cấp', hex: '#722ed1' },
};

const kenhCuaUser = (id) => `App.Models.User.${id}`;

// Hiện dưới header (sticky top 16 + cao 48) để không che chuông/avatar
notification.config({ top: 76 });

let userIdDaDangKy = null;
let audioCtx = null;
let lanKeuCuoi = 0;
let nguonReng = null;      // chuông đang reo (tab ẩn)
let bufferReng = null;
let lanCoTabDangXem = 0; // lần gần nhất một tab đang hiển thị nhận báo cáo (và tự reo)
let lanNguoiDungDaXem = 0; // lần gần nhất người dùng thao tác / mở tab ở bất kỳ tab nào

// ─── Đăng ký kênh ─────────────────────────────────────────────────────────

/** Gọi mỗi lần MainLayout gắn; chỉ đăng ký thật khi chưa đăng ký hoặc đổi tài khoản. */
export function dangKy(userId) {
    if (!userId || !window.Echo) return;
    const id = Number(userId);
    if (userIdDaDangKy === id) return;
    if (userIdDaDangKy !== null) huyDangKy(); // đổi tài khoản: rời kênh cũ trước

    userIdDaDangKy = id;
    // Server gửi gộp 1 lần cho mọi người nhận nên payload không có id thông báo riêng (chuông tải lại khi mở)
    window.Echo.private(kenhCuaUser(id)).listen('.bao-cao-su-co.moi', (tb) => {
        // Reo liên tục đến khi người dùng thao tác (click / bấm phím) hoặc mở lại tab ẩn
        batDauReng();
        hienToast(tb);
        window.dispatchEvent(new CustomEvent(SU_KIEN_BAO_CAO_MOI, { detail: tb }));
    });
}

/** Rời kênh (đăng xuất / đổi tài khoản). */
export function huyDangKy() {
    if (userIdDaDangKy === null) return;
    try {
        window.Echo?.leave(kenhCuaUser(userIdDaDangKy));
    } catch (e) {
        // Echo đã ngắt kết nối: không cần làm gì thêm
    }
    userIdDaDangKy = null;
    dungReng();
}

// ─── Toast ────────────────────────────────────────────────────────────────

function hienToast(tb) {
    const key = `bao-cao-${tb.bao_cao_id ?? tb.id}`;
    const mucDo = MUC_DO[tb.muc_do];
    notification.open({
        key,
        className: 'thong-bao-toast',
        icon: null,
        message: (
            <div className="thong-bao-toast__nhan">
                Báo cáo sự cố mới
                {mucDo && (
                    <>
                        <span className="thong-bao-toast__cham" style={{ background: mucDo.hex }} />
                        {mucDo.label}
                    </>
                )}
            </div>
        ),
        description: (
            <div>
                <div className="thong-bao-toast__vi-tri">
                    {tb.thiet_bi}{tb.phong ? ` · ${tb.phong}` : ''}
                </div>
                {tb.mo_ta && <div className="thong-bao-toast__mo-ta">{tb.mo_ta}</div>}
            </div>
        ),
        actions: (
            <Button
                size="small"
                className="thong-bao-toast__nut"
                onClick={() => {
                    notification.destroy(key);
                    router.visit(tb.url || '/bao-cao-su-co');
                }}
            >
                Xem
            </Button>
        ),
        placement: 'topRight',
        duration: 8,
    });
}

// ─── Âm thanh ─────────────────────────────────────────────────────────────

export function amThanhDangBat() {
    try {
        return localStorage.getItem(KHOA_AM_THANH) !== '0';
    } catch (e) {
        return true; // không đọc được localStorage (chế độ riêng tư...) → mặc định bật
    }
}

export function datAmThanh(bat) {
    try {
        localStorage.setItem(KHOA_AM_THANH, bat ? '1' : '0');
    } catch (e) {
        // không lưu được thì chỉ có tác dụng trong phiên này
    }
    if (!bat) dungReng();
}

function layAudioCtx() {
    if (!audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        audioCtx = new Ctx();
    }
    return audioCtx;
}

// Chạy fn khi AudioContext đã được phép phát; trình duyệt chặn (chưa click lần nào) thì bỏ qua
function khiPhatDuoc(fn) {
    try {
        const ctx = layAudioCtx();
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume().then(() => fn(ctx)).catch(() => {});
        else fn(ctx);
    } catch (e) {
        // Trình duyệt chặn / không hỗ trợ Web Audio: bỏ qua, toast vẫn hiện
    }
}

// Trình duyệt chỉ cho phát âm thanh sau thao tác của người dùng: mở khoá ở lần click đầu tiên trên trang
function moKhoaAmThanh() {
    try {
        const ctx = layAudioCtx();
        if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    } catch (e) {
        // trình duyệt không hỗ trợ Web Audio
    }
}

/** Tiếng "ting ting" ngắn khi đang xem tab. */
function phatAmThanh() {
    if (!amThanhDangBat()) return;
    const bay = Date.now();
    if (bay - lanKeuCuoi < KHOANG_CHONG_KEU_DON) return;
    lanKeuCuoi = bay;

    khiPhatDuoc((ctx) => {
        [880, 1320].forEach((tanSo, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const t = ctx.currentTime + i * 0.18;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(tanSo, t);
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
            osc.connect(gain).connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.26);
        });
    });
}

/**
 * Một chu kỳ chuông reo 1 giây (4 nhịp xen 2 tần số + nghỉ ngắn), phát lặp liền mạch.
 * Phát bằng buffer lặp trên luồng âm thanh nên không bị trình duyệt giãn nhịp như setInterval ở tab ẩn.
 */
function layBufferReng(ctx) {
    if (bufferReng && bufferReng.sampleRate === ctx.sampleRate) return bufferReng;
    const sr = ctx.sampleRate;
    const buf = ctx.createBuffer(1, Math.floor(sr * 1.0), sr);
    const d = buf.getChannelData(0);
    const nhip = [[0, 0.14, 880], [0.15, 0.29, 1175], [0.3, 0.44, 880], [0.45, 0.59, 1175]];
    nhip.forEach(([bd, kt, f]) => {
        const dai = kt - bd;
        for (let i = Math.floor(bd * sr); i < Math.floor(kt * sr); i++) {
            const t = i / sr - bd;
            const bao = Math.min(1, t / 0.01, (dai - t) / 0.01); // vào/ra 10ms cho khỏi lách tách
            d[i] = 0.18 * bao * Math.sin(2 * Math.PI * f * t);
        }
    });
    bufferReng = buf;
    return buf;
}

function batDauReng() {
    if (nguonReng || !amThanhDangBat()) return;
    const luc = Date.now();
    const phat = (ctx) => {
        // Người dùng đã thao tác sau khi báo cáo đến (vd. cú click mở khoá âm thanh) → không reo nữa
        if (nguonReng || lanNguoiDungDaXem > luc) return;
        const src = ctx.createBufferSource();
        src.buffer = layBufferReng(ctx);
        src.loop = true;
        src.connect(ctx.destination);
        src.start();
        nguonReng = src;
    };
    if (!document.hidden) {
        // Tab đang hiển thị reo; báo các tab ẩn khác khỏi reo chồng
        guiGiuaCacTab('dang-xem');
        khiPhatDuoc(phat);
        return;
    }
    // Tab ẩn: chờ chút, nếu có tab đang hiển thị đã nhận reo thì thôi
    setTimeout(() => {
        if (Date.now() - lanCoTabDangXem < 3000) return;
        khiPhatDuoc(phat);
    }, 1000);
}

function dungReng() {
    if (!nguonReng) return;
    try {
        nguonReng.stop();
        nguonReng.disconnect();
    } catch (e) {
        // đã dừng
    }
    nguonReng = null;
}

// Nhiều tab cùng mở hệ thống: mỗi tab ẩn tự reo. Người dùng mở BẤT KỲ tab nào → báo các tab khác ngừng.
let kenhGiuaCacTab = null;
try {
    kenhGiuaCacTab = new BroadcastChannel('qlcsvc-thong-bao');
    kenhGiuaCacTab.onmessage = (e) => {
        // 'dang-xem' chỉ do tab đã đăng nhập vừa nhận báo cáo khi đang hiển thị → mới được chặn reo.
        // 'da-xem' (mở/focus tab bất kỳ, kể cả trang QR) chỉ dừng tiếng đang reo, không chặn báo cáo sắp tới.
        if (e.data === 'dang-xem') lanCoTabDangXem = Date.now();
        if (e.data === 'da-xem') lanNguoiDungDaXem = Date.now();
        if (e.data === 'dang-xem' || e.data === 'da-xem') dungReng();
    };
} catch (e) {
    // Trình duyệt cũ không có BroadcastChannel: mỗi tab chỉ ngừng khi chính nó được mở
}

function guiGiuaCacTab(tin) {
    try {
        kenhGiuaCacTab?.postMessage(tin);
    } catch (e) {
        // kênh đã đóng
    }
}

function nguoiDungDaXem() {
    lanNguoiDungDaXem = Date.now();
    dungReng();
    guiGiuaCacTab('da-xem');
}

if (typeof document !== 'undefined') {
    document.addEventListener('click', moKhoaAmThanh, { once: true, capture: true });
    // Người dùng mở lại tab (hoặc quay lại cửa sổ) → ngừng reo ở mọi tab
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) nguoiDungDaXem();
    });
    window.addEventListener('focus', nguoiDungDaXem);
    // Đang xem tab mà vắng mặt thì chuông reo mãi; người dùng click / bấm phím = đã biết → ngừng
    document.addEventListener('pointerdown', nguoiDungDaXem, true);
    document.addEventListener('keydown', nguoiDungDaXem, true);
}

/** Phát thử (nút bật âm thanh): bỏ qua chống kêu dồn. */
export function phatThu() {
    lanKeuCuoi = 0;
    phatAmThanh();
}

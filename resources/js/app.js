import './bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { ConfigProvider } from 'antd';
import "antd/dist/reset.css";

const appName = window.document.getElementsByTagName('title')[0]?.innerText || 'Laravel';

const themeHeThong = {
    token: {
        colorPrimary: '#244380',
        colorLink: '#244380',
        colorInfo: '#244380',
        borderRadiusLG: 16,
        borderRadius: 12,
        colorBgContainer: 'rgba(255, 255, 255, 0.4)',
        colorBgElevated: 'rgba(255, 255, 255, 0.8)',
    },
    components: {
        Card: {
            colorBgContainer: 'rgba(255, 255, 255, 0.35)',
            colorBorderSecondary: 'rgba(255, 255, 255, 0.25)',
        },
        Table: {
            colorBgContainer: 'transparent',
            colorHeaderBg: 'rgba(255, 255, 255, 0.45)',
            // antd trộn các màu dưới đây lên colorBgContainer; nền 'transparent' làm chúng thành #000 → phải đặt màu đặc
            rowHoverBg: '#f0f4fa',
            bodySortBg: '#f8fafc',
            footerBg: '#f8fafc',
            headerSortActiveBg: '#eaf0f8',
            headerSortHoverBg: '#eaf0f8',
            fixedHeaderSortActiveBg: '#eaf0f8',
        },
    },
};

// notification / message / Modal.confirm gọi kiểu tĩnh nằm ngoài cây React của app:
// bọc theme để chúng cùng màu, bo góc với phần còn lại của hệ thống
ConfigProvider.config({
    holderRender: (children) => <ConfigProvider theme={themeHeThong}>{children}</ConfigProvider>,
});

createInertiaApp({
    title: (title) => title ? `${title} - ${appName}` : appName,
    resolve: (name) => require(`./components/${name}.jsx`),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <ConfigProvider theme={themeHeThong}>
                <App {...props} />
            </ConfigProvider>
        );

        // Dismiss the server-rendered loading screen
        const loader = document.getElementById('initial-loader');
        if (loader) {
            loader.classList.add('fade-out');
            setTimeout(() => {
                loader.remove();
            }, 500);
        }
    },
    progress: false,
});

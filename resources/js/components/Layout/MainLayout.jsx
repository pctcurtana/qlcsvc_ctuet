import React, { useState, useEffect, useMemo } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { Layout, Menu, theme, Badge, Avatar, Dropdown, Space, message, Modal } from 'antd';
import {
    DashboardOutlined,
    BankOutlined,
    HomeOutlined,
    AppstoreOutlined,
    ToolOutlined,
    HistoryOutlined,
    InboxOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    UserOutlined,
    LogoutOutlined,
    SettingOutlined,
    ExclamationCircleOutlined,
    TeamOutlined,
    KeyOutlined,
    AreaChartOutlined,
    AlertOutlined,
    QrcodeOutlined,
    FileExcelOutlined,
} from '@ant-design/icons';

import ImportNotificationListener from '../Common/ImportNotificationListener';

const { Header, Sider, Content } = Layout;
const { confirm } = Modal;

// Map icon string to component
const iconMap = {
    DashboardOutlined: <DashboardOutlined />,
    BankOutlined: <BankOutlined />,
    HomeOutlined: <HomeOutlined />,
    AppstoreOutlined: <AppstoreOutlined />,
    ToolOutlined: <ToolOutlined />,
    HistoryOutlined: <HistoryOutlined />,
    SettingOutlined: <SettingOutlined />,
    TeamOutlined: <TeamOutlined />,
    KeyOutlined: <KeyOutlined />,
    UserOutlined: <UserOutlined />,
    AreaChartOutlined: <AreaChartOutlined />,
    InboxOutlined: <InboxOutlined />,
    AlertOutlined: <AlertOutlined />,
    QrcodeOutlined: <QrcodeOutlined />,
    FileExcelOutlined: <FileExcelOutlined />,
};

const SkeletonLoader = () => (
    <div className="space-y-6 animate-pulse p-6">
        {/* Title skeleton */}
        <div className="h-9 bg-[#244380]/[0.08] rounded-xl w-64 border border-[#244380]/[0.05] mb-8"></div>

        {/* KPI grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-white/45 rounded-2xl border border-white/45 p-5 flex items-center gap-4 shadow-sm backdrop-blur-md">
                    <div className="w-12 h-12 rounded-xl bg-[#244380]/[0.10] flex-shrink-0"></div>
                    <div className="space-y-2.5 flex-1">
                        <div className="h-3.5 bg-[#244380]/[0.08] rounded-md w-1/2"></div>
                        <div className="h-5 bg-[#244380]/[0.12] rounded-md w-3/4"></div>
                    </div>
                </div>
            ))}
        </div>

        {/* Main table area skeleton */}
        <div className="bg-white/45 rounded-2xl border border-white/45 p-6 space-y-5 shadow-sm backdrop-blur-md">
            <div className="flex justify-between items-center mb-4">
                <div className="h-7 bg-[#244380]/[0.12] rounded-lg w-48"></div>
                <div className="h-9 bg-[#244380]/[0.10] rounded-lg w-28"></div>
            </div>
            <div className="space-y-3.5 pt-4">
                <div className="h-4 bg-[#244380]/[0.06] rounded-md w-full"></div>
                <div className="h-4 bg-[#244380]/[0.09] rounded-md w-full"></div>
                <div className="h-4 bg-[#244380]/[0.06] rounded-md w-full"></div>
                <div className="h-4 bg-[#244380]/[0.09] rounded-md w-full"></div>
                <div className="h-4 bg-[#244380]/[0.06] rounded-md w-full"></div>
            </div>
        </div>
    </div>
);

const MainLayout = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    // Điện thoại (< md): sidebar ẩn hẳn, mở ra thì đè lên nội dung (#22)
    const [isMobile, setIsMobile] = useState(false);
    const [hoveredMenu, setHoveredMenu] = useState(null);
    const [isNavigating, setIsNavigating] = useState(false);
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const { url, props } = usePage();
    const { auth, menuScreens, userPermissions } = props;
    const user = auth?.user;

    // Listen to Inertia router events for page transition skeleton loading
    useEffect(() => {
        const unregisterStart = router.on('start', () => setIsNavigating(true));
        const unregisterFinish = router.on('finish', () => setIsNavigating(false));
        return () => {
            unregisterStart();
            unregisterFinish();
        };
    }, []);

    // Show flash messages from backend
    useEffect(() => {
        if (props.flash?.success) message.success(props.flash.success);
        if (props.flash?.error) message.error(props.flash.error);
    }, [props.flash]);

    const handleLogout = () => {
        confirm({
            title: 'Xác nhận đăng xuất',
            icon: <ExclamationCircleOutlined />,
            content: 'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?',
            okText: 'Đăng xuất',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk() {
                router.post('/logout');
            },
        });
    };

    // Tạo menu items từ menuScreens
    const menuItems = useMemo(() => {
        if (!menuScreens || menuScreens.length === 0) {
            // Fallback menu khi chưa có data
            return [
                {
                    key: '/',
                    icon: <DashboardOutlined />,
                    label: <Link href="/">Dashboard</Link>,
                },
            ];
        }

        return menuScreens.map((screen) => {
            const icon = iconMap[screen.icon] || <AppstoreOutlined />;

            // Nếu có children -> tạo submenu
            if (screen.children && screen.children.length > 0) {
                return {
                    key: screen.code,
                    icon: icon,
                    label: screen.name,
                    children: screen.children.map((child) => {
                        return {
                            key: child.route || child.code,
                            label: <Link href={child.route}>{child.name}</Link>,
                        };
                    }),
                };
            }

            // Nếu không có children và có route -> menu item đơn
            if (screen.route) {
                let itemIcon = icon;
                if (screen.route === '/nguoi-dung') itemIcon = <UserOutlined />;
                if (screen.route === '/phan-quyen') itemIcon = <KeyOutlined />;

                return {
                    key: screen.route,
                    icon: itemIcon,
                    label: <Link href={screen.route}>{screen.name}</Link>,
                };
            }

            // Fallback
            return {
                key: screen.code,
                icon: icon,
                label: screen.name,
            };
        });
    }, [menuScreens]);

    // Lấy default open keys (chỉ các menu có children)
    const defaultOpenKeys = useMemo(() => {
        if (!menuScreens) return [];
        return menuScreens
            .filter((screen) => screen.children && screen.children.length > 0)
            .map((screen) => screen.code);
    }, [menuScreens]);

    const userMenuItems = [
        {
            key: 'user-info',
            label: (
                <div className="py-2">
                    <div className="font-semibold text-[#1a365d]">{user?.name}</div>
                    <div className="text-xs text-gray-500">{user?.email}</div>
                    <div className={`text-[11px] text-white px-2 py-0.5 rounded mt-1 inline-block ${user?.role === 'admin' ? 'bg-[#f5222d]' : 'bg-[#1890ff]'
                        }`}>
                        {user?.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                    </div>
                </div>
            ),
            disabled: true,
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Đăng xuất',
            danger: true,
            onClick: handleLogout,
        },
    ];
    // topbar transparent khi fixed
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const getSelectedKey = () => {
        // Tìm key phù hợp nhất với URL hiện tại
        const path = url.split('?')[0]; // Bỏ query string

        // Kiểm tra exact match trước
        if (path === '/') return '/';

        // Kiểm tra các route cụ thể
        const routes = [
            '/co-so', '/khu-nha', '/phong', '/thiet-bi',
            '/lich-su-bao-duong', '/kho', '/nguoi-dung', '/phan-quyen', '/thong-ke',
            '/bao-cao-su-co', '/quan-ly-qr', '/dot-kiem-tra-thiet-bi', '/qr/thiet-bi',
        ];

        for (const route of routes) {
            if (path.startsWith(route)) {
                return route;
            }
        }

        return path;
    };

    return (
        <Layout style={{ minHeight: '100vh', backgroundColor: 'transparent' }}>
            <ImportNotificationListener />
            {isMobile && !collapsed && (
                <div
                    onClick={() => setCollapsed(true)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.3)', zIndex: 1000 }}
                />
            )}
            <Sider
                width={210}
                collapsedWidth={isMobile ? 0 : 50}
                breakpoint="md"
                onBreakpoint={(broken) => { setIsMobile(broken); setCollapsed(broken); }}
                trigger={null}
                theme="light"
                collapsible
                collapsed={collapsed}
                className="custom-sidebar overflow-auto h-screen fixed left-0 top-0 bottom-0 transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    zIndex: isMobile ? 1001 : undefined,
                }}
            >
                <div className={`custom-sidebar-logo-container ${collapsed ? 'justify-center' : 'justify-start pl-4'}`}>
                    {collapsed ? (
                        <img src="/favicon.png" alt="Logo" className="w-8 h-8 object-contain" />
                    ) : (
                        <div className="flex items-center gap-2.5">
                            <img src="/favicon.png" alt="Logo" className="w-12 h-12 object-contain" />
                            <span className="logo-text-expanded">QLCSVC</span>
                        </div>
                    )}
                </div>
                <Menu
                    theme="light"
                    mode="inline"
                    selectedKeys={[getSelectedKey()]}
                    defaultOpenKeys={defaultOpenKeys}
                    items={menuItems}
                    className="!bg-transparent !border-none"
                    onClick={(info) => {
                        if (info.key && info.key.startsWith('/')) {
                            if (isMobile) setCollapsed(true);
                            router.visit(info.key);
                        }
                    }}
                />
            </Sider>
            <Layout
                className="transition-[margin-left] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{
                    marginLeft: isMobile ? 0 : (collapsed ? 50 : 210),
                    backgroundColor: 'transparent',
                }}
            >
                <Header
                    className="px-0 flex items-center justify-between sticky top-4 z-[100] h-12 transition-all duration-300 ease-in-out"
                    style={{
                        margin: '16px 16px 0 16px',
                        background: scrolled
                            ? 'rgba(255, 255, 255, 0.45)'
                            : 'transparent',
                        backdropFilter: scrolled ? 'blur(20px)' : 'none',
                        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
                        border: scrolled
                            ? '1px solid rgba(255,255,255,0.25)'
                            : '1px solid transparent',
                        borderRadius: '16px',
                        boxShadow: scrolled
                            ? '0 8px 32px rgba(31,38,135,0.04)'
                            : 'none',
                    }}
                >
                    <div
                        className="text-lg cursor-pointer text-[#244380] transition-all duration-[180ms] ease-in-out p-[8px_12px] rounded-lg flex items-center justify-center w-10 h-10 hover:bg-[#244380]/[0.08] hover:scale-105"
                        onClick={() => setCollapsed(!collapsed)}
                    >
                        {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                    </div>
                    <Space size="large" className="m-0">
                        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
                            <Space
                                className="cursor-pointer px-2 rounded-lg transition-all duration-[180ms] ease-in-out hover:bg-[#244380]/[0.08]"
                            >
                                <Avatar
                                    className={user?.role === 'admin' ? 'bg-[#f5222d] cursor-pointer' : 'bg-[#1890ff] cursor-pointer'}
                                    icon={<UserOutlined />}
                                />
                                <span className="font-medium text-[#0f1c3f] text-sm">{user?.name || 'Người dùng'}</span>
                            </Space>
                        </Dropdown>
                    </Space>
                </Header>
                <Content
                    style={{
                        margin: '24px 16px',
                        padding: 0,
                        minHeight: 280,
                        background: 'transparent',
                    }}
                >
                    <div key={url} className="page-entrance">
                        {isNavigating ? <SkeletonLoader /> : children}
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
};

export default MainLayout;

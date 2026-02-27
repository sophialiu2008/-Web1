import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { fetchProfile } from '@/services/api';
import {
    LayoutDashboard,
    Users,
    FileText,
    Calendar,
    PawPrint,
    MessageSquare,
    LogOut,
    ChevronRight,
    Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
    { path: '/admin/overview', name: '概览', icon: LayoutDashboard },
    { path: '/admin/users', name: '用户管理', icon: Users },
    { path: '/admin/applications', name: '领养申请', icon: FileText },
    { path: '/admin/bookings', name: '预约管理', icon: Calendar },
    { path: '/admin/pets', name: '宠物管理', icon: PawPrint },
    { path: '/admin/stories', name: '故事审核', icon: MessageSquare },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isAdmin, logout, setUser, isLoggedIn } = useUserStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    // Core state for the guard
    const [isHydrated, setIsHydrated] = useState(false);
    const [isSyncPending, setIsSyncPending] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    // 1. Wait for Zustand Hydration
    useEffect(() => {
        const unsub = (useUserStore.persist as any).onFinishHydration(() => setIsHydrated(true));
        if ((useUserStore.persist as any).hasHydrated()) {
            setIsHydrated(true);
        }
        return () => { if (unsub) unsub(); };
    }, []);

    // 2. Handle Synchronization, Authentication Check, and Redirection
    useEffect(() => {
        const validateAccess = async () => {
            if (!isHydrated) return;

            // If not logged in at all, go to login
            if (!isLoggedIn) {
                navigate('/login', { state: { from: location.pathname } });
                setIsSyncPending(false);
                return;
            }

            // If logged in but not currently an admin in local state, try one last sync
            if (!isAdmin()) {
                try {
                    const res = await fetchProfile();
                    if (res?.code === 0 && res?.data?.user) {
                        setUser(res.data.user);
                        // Re-check after sync
                        if (res.data.user.role === 'admin') {
                            setIsAuthorized(true);
                            setIsSyncPending(false);
                            return;
                        }
                    }
                } catch (error) {
                    console.error('[AdminGuard] Profile sync failed:', error);
                }
                // Still not admin after sync
                navigate('/');
                setIsSyncPending(false);
                return;
            }

            // Already admin in local state
            setIsAuthorized(true);
            setIsSyncPending(false);
        };
        validateAccess();
    }, [isHydrated, isLoggedIn, isAdmin, setUser, navigate, location.pathname]);

    // Show loading while we are figuring things out
    if (!isHydrated || isSyncPending) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500 font-medium tracking-wide">
                    {!isHydrated ? '初始化系统配置...' : '正在同步账户权限...'}
                </p>
                <p className="text-xs text-gray-400 mt-2">请稍候，正在确保您的访问安全</p>
            </div>
        </div>
    );

    // Final safety check — only render content when explicitly authorized
    if (!isAuthorized) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside
                className={`${isSidebarOpen ? 'w-64' : 'w-20'
                    } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col sticky top-0 h-screen z-50`}
            >
                <div className="p-6 flex items-center justify-between">
                    {isSidebarOpen ? (
                        <Link to="/" className="text-2xl font-bold text-orange-500">
                            PETS<span className="text-gray-800">ADMIN</span>
                        </Link>
                    ) : (
                        <div className="w-8 h-8 bg-orange-500 rounded-lg" />
                    )}
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isActive
                                    ? 'bg-orange-50 text-orange-500 shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                {isSidebarOpen && <span className="font-medium">{item.name}</span>}
                                {isActive && isSidebarOpen && <ChevronRight className="w-4 h-4 ml-auto" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <Button
                        variant="ghost"
                        onClick={() => {
                            logout();
                            navigate('/');
                        }}
                        className="w-full justify-start gap-3 p-3 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-xl"
                    >
                        <LogOut className="w-5 h-5" />
                        {isSidebarOpen && <span className="font-medium">退出登录</span>}
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Topbar */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-40">
                    <button
                        onClick={() => setSidebarOpen(!isSidebarOpen)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <Menu className="w-5 h-5 text-gray-600" />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-semibold text-gray-800">{user?.name || '管理员'}</p>
                            <p className="text-xs text-gray-500">{user?.email || user?.phone}</p>
                        </div>
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 font-bold">
                            {user?.name?.[0] || 'A'}
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-6xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

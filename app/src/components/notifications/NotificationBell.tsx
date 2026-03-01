import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, Info } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { fetchNotifications, markNotificationRead } from '@/services/api';
import { useNavigate } from 'react-router-dom';

interface NotificationItem {
    id: string;
    type: string;
    timestamp: string;
    meta: {
        title: string;
        message: string;
        is_read: boolean;
        link?: string;
        type?: string;
    };
}

export default function NotificationBell() {
    const { user, isLoggedIn } = useUserStore();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoggedIn || !user?.id) return;

        const loadNotifs = async () => {
            try {
                const data = await fetchNotifications(user.id);
                setNotifications(data || []);
            } catch (err) {
                console.error('Failed to fetch notifications', err);
            }
        };

        loadNotifs();
        // Poll every 30 seconds
        const interval = setInterval(loadNotifs, 30000);
        return () => clearInterval(interval);
    }, [user?.id, isLoggedIn]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => !n.meta?.is_read).length;

    const handleNotificationClick = async (notif: NotificationItem) => {
        if (!notif.meta?.is_read) {
            try {
                await markNotificationRead(notif.id);
                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, meta: { ...n.meta, is_read: true } } : n));
            } catch (err) { }
        }
        setIsOpen(false);
        if (notif.meta?.link) {
            navigate(notif.meta.link);
        }
    };

    if (!isLoggedIn) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2 rounded-full transition-colors ${isScrolledOrNotHome() ? 'text-gray-600 hover:bg-orange-50 hover:text-orange-500' : 'text-white/90 hover:bg-white/10 hover:text-white'}`}
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] py-2 z-50 max-h-96 overflow-y-auto border border-gray-100">
                    <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                        <h3 className="font-semibold text-gray-800">通知中心</h3>
                        {unreadCount > 0 && (
                            <span className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-full font-medium">{unreadCount} 条未读</span>
                        )}
                    </div>

                    <div className="flex flex-col">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-12 flex flex-col items-center justify-center text-gray-400">
                                <Bell className="w-8 h-8 mb-2 opacity-20" />
                                <span className="text-sm">暂无任何通知</span>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <button
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`w-full text-left px-4 py-3 hover:bg-orange-50/50 transition-colors border-b border-gray-50 last:border-0 group ${!notif.meta?.is_read ? 'bg-orange-50/10' : 'opacity-[0.85]'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-0.5 p-2 rounded-full transition-colors ${!notif.meta?.is_read ? 'bg-orange-100 text-orange-500 group-hover:bg-orange-200' : 'bg-gray-100 text-gray-400'}`}>
                                            {notif.meta?.type === 'application' ? <Info className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <p className={`text-sm font-semibold truncate pr-2 ${!notif.meta?.is_read ? 'text-gray-800' : 'text-gray-600'}`}>
                                                    {notif.meta?.title || '新通知'}
                                                </p>
                                                {!notif.meta?.is_read && (
                                                    <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1.5"></span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                                                {notif.meta?.message || ''}
                                            </p>
                                            <p className="text-[10.5px] text-gray-400 mt-2 font-medium">
                                                {new Date(notif.timestamp).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper to determine text color context
function isScrolledOrNotHome() {
    const isScrolled = window.scrollY > 100;
    const isHome = window.location.pathname === '/';
    return isScrolled || !isHome;
}

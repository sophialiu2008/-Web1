import { useState, useEffect } from 'react';
import { fetchAdminStats } from '@/services/api';
import {
    Users,
    FileText,
    Calendar,
    PawPrint,
    MessageSquare,
    TrendingUp,
    ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminOverview() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAdminStats()
            .then(res => setStats(res?.data || res || {}))
            .catch(e => {
                console.error('[AdminOverview] fetchAdminStats failed:', e);
                setError(e?.message || '加载失败');
                setStats({});
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-gray-500">加载中...</div>;
    if (error) return <div className="text-red-500 p-4">统计数据加载失败: {error}</div>;

    const cards = [
        { title: '总用户数', value: stats?.totalUsers ?? 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
        { title: '待审核领养', value: stats?.pendingApplications ?? 0, icon: FileText, color: 'text-orange-500', bg: 'bg-orange-50' },
        { title: '待确认预约', value: stats?.pendingBookings ?? 0, icon: Calendar, color: 'text-pink-500', bg: 'bg-pink-50' },
        { title: '宠物库', value: stats?.totalPets ?? 0, icon: PawPrint, color: 'text-green-500', bg: 'bg-green-50' },
        { title: '待审故事', value: stats?.pendingStories ?? 0, icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-50' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">管理概览</h1>
                <p className="text-gray-500 text-sm">实时监控领养平台的运行状态</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {cards.map((card, i) => (
                    <Card key={i} className="border-none shadow-warm hover:shadow-warm-lg transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-2 rounded-lg ${card.bg}`}>
                                    <card.icon className={`w-5 h-5 ${card.color}`} />
                                </div>
                                <div className="flex items-center gap-1 text-green-500 text-xs font-medium">
                                    <TrendingUp className="w-3 h-3" />
                                    <span>实时</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-3xl font-bold text-gray-800">{card.value}</p>
                                <p className="text-gray-500 text-sm uppercase tracking-wider font-medium">{card.title}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                <Card className="border-none shadow-warm-lg">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                            最近操作
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {[1, 2, 3].map((_, i) => (
                                <div key={i} className="flex gap-4 items-start">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-xs">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">暂无详细日志记录</p>
                                        <p className="text-xs text-gray-400 mt-0.5">即将上线操作追踪功能...</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-warm-lg bg-orange-500 text-white">
                    <CardContent className="p-8 h-full flex flex-col justify-between">
                        <div>
                            <h2 className="text-2xl font-bold mb-4">欢迎回来，管理员</h2>
                            <p className="text-orange-100 mb-8 leading-relaxed">
                                感谢您对宠物领养中心的支持。请记得定期审核领养申请和预约看宠，每一个操作都可能为一个流浪的小生命找到温暖的家。
                            </p>
                        </div>
                        <button className="flex items-center gap-2 text-white font-semibold hover:translate-x-1 transition-transform">
                            查看待办事项 <ArrowRight className="w-4 h-4" />
                        </button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

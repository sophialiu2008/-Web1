import { useState, useEffect } from 'react';
import { fetchAdminStories, updateStoryStatus } from '@/services/api';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function StoryModeration() {
    const [stories, setStories] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const loadData = async () => {
        setLoading(true);
        try {
            const { data, total } = await fetchAdminStories({ page, pageSize });
            setStories(data);
            setTotal(total);
        } catch {
            toast.error('获取故事列表失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [page]);

    const handleAction = async (id: string, status: string) => {
        const label = status === 'published' ? '发布' : '拒绝';
        if (!confirm(`确定要${label}该故事吗？${status === 'published' ? '\n发布后，该故事将显示在首页"温馨故事"板块。' : ''}`)) return;
        try {
            await updateStoryStatus(id, status);
            toast.success(`操作成功，故事已${label}`);
            loadData();
        } catch {
            toast.error('操作失败');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">故事审核</h1>
                <p className="text-gray-500 text-sm mt-1">审核并管理用户分享的领养温馨故事建议，确保平台内容健康积极</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow>
                            <TableHead>故事标题</TableHead>
                            <TableHead>作者</TableHead>
                            <TableHead>关联宠物</TableHead>
                            <TableHead>提交日期</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="w-10 h-10 rounded-xl" />
                                            <div>
                                                <Skeleton className="h-4 w-32 mb-1" />
                                                <Skeleton className="h-2 w-16" />
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-12 rounded-full" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto rounded-lg" /></TableCell>
                                </TableRow>
                            ))
                        ) : stories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-16">
                                    <EmptyState
                                        icon={Heart}
                                        title="暂无故事"
                                        description="目前还没有收到用户提交的任何温馨宠物领养故事。"
                                        className="py-0"
                                    />
                                </TableCell>
                            </TableRow>
                        ) : stories.map((s) => (
                            <TableRow key={s.id} className="hover:bg-gray-50/50 transition-colors">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <img src={s.avatar || s.images?.[0] || '/images/story1.jpg'} onError={(e) => { (e.target as HTMLImageElement).src = '/images/story1.jpg' }} className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-sm" />
                                        <div className="max-w-[180px]">
                                            <div className="font-bold text-gray-800 truncate">{s.title}</div>
                                            <div className="flex items-center gap-1 text-[10px] text-yellow-500">
                                                {Array.from({ length: s.rating || 5 }).map((_, i) => <Heart key={i} className="w-2 h-2 fill-current" />)}
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm text-gray-600">{s.adopter_name}</TableCell>
                                <TableCell>
                                    <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">@{s.pet_name}</span>
                                </TableCell>
                                <TableCell className="text-xs text-gray-400 font-mono">
                                    {new Date(s.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${s.status === 'published' ? 'bg-green-100 text-green-600' :
                                        s.status === 'rejected' ? 'bg-red-50 text-red-400' :
                                            'bg-orange-100 text-orange-500'
                                        }`}>
                                        {s.status === 'published' ? '已发布' : s.status === 'rejected' ? '已退回' : '审核中'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    {s.status === 'pending' && (
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" onClick={() => handleAction(s.id, 'published')} className="h-8 bg-blue-500 hover:bg-blue-600 rounded-lg whitespace-nowrap">发布</Button>
                                            <Button variant="outline" size="sm" onClick={() => handleAction(s.id, 'rejected')} className="h-8 border-gray-200 rounded-lg whitespace-nowrap">退回</Button>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <div className="p-4 border-t border-gray-50 flex items-center justify-between">
                    <p className="text-xs text-gray-400">共 {total} 条温馨故事</p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)} className="text-xs h-8 px-3 rounded-lg">上一页</Button>
                        <Button variant="outline" size="sm" disabled={page * pageSize >= total} onClick={() => setPage(page + 1)} className="text-xs h-8 px-3 rounded-lg">下一页</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { fetchAdminApplications, reviewApplication } from '@/services/api';
import { FileText, Check, X } from 'lucide-react';
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

export default function ApplicationManagement() {
    const [apps, setApps] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const loadApps = async () => {
        setLoading(true);
        try {
            const { data, total } = await fetchAdminApplications({ page, pageSize });
            setApps(data);
            setTotal(total);
        } catch (err) {
            toast.error('获取申请列表失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadApps();
    }, [page]);

    const handleReview = async (app: any, status: 'approved' | 'rejected') => {
        const actionText = status === 'approved' ? '通过' : '拒绝';
        if (!confirm(`确定要${actionText}该领养申请吗？${status === 'approved' ? '\n通过后，宠物状态将自动更新为"已领养"。' : ''}`)) return;

        try {
            await reviewApplication(app.id, {
                status,
                pet_id: app.pet_id,
                user_id: app.user_id
            });
            toast.success(`申请已${actionText}`);
            loadApps();
        } catch {
            toast.error('操作失败');
        }
    };

    const getStatusBadge = (status: string) => {
        const maps: Record<string, { label: string, color: string }> = {
            pending: { label: '待审核', color: 'bg-orange-100 text-orange-600' },
            approved: { label: '已通过', color: 'bg-green-100 text-green-600' },
            rejected: { label: '已拒绝', color: 'bg-red-100 text-red-600' },
        };
        const c = maps[status] || { label: status, color: 'bg-gray-100 text-gray-500' };
        return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${c.color}`}>{c.label}</span>;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">领养申请</h1>
                <p className="text-gray-500 text-sm mt-1">审核并处理用户提交的宠物领养申请</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow>
                            <TableHead>申请编号</TableHead>
                            <TableHead>申请人</TableHead>
                            <TableHead>目标宠物</TableHead>
                            <TableHead>提交日期</TableHead>
                            <TableHead>当前状态</TableHead>
                            <TableHead className="text-right">管理操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-24 mb-1" />
                                        <Skeleton className="h-3 w-32" />
                                    </TableCell>
                                    <TableCell><Skeleton className="h-8 w-24 rounded-lg" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : apps.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-16">
                                    <EmptyState
                                        icon={FileText}
                                        title="暂无申请数据"
                                        description="目前还没有用户提交任何领养申请记录。"
                                        className="py-0"
                                    />
                                </TableCell>
                            </TableRow>
                        ) : apps.map((a) => (
                            <TableRow key={a.id} className="hover:bg-gray-50/50 transition-colors">
                                <TableCell className="font-mono text-xs text-gray-400">#{a.id}</TableCell>
                                <TableCell>
                                    <div className="text-sm font-medium text-gray-800">{a.name}</div>
                                    <div className="text-xs text-gray-400">{a.phone}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm border-b border-dotted border-gray-300 pb-0.5">{a.pet_name}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-xs text-gray-500">
                                    {new Date(a.submit_date || a.created_at).toLocaleString()}
                                </TableCell>
                                <TableCell>{getStatusBadge(a.status)}</TableCell>
                                <TableCell className="text-right">
                                    {a.status === 'pending' ? (
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleReview(a, 'approved')}
                                                className="h-8 gap-1 border-green-200 text-green-600 hover:bg-green-50 rounded-lg"
                                            >
                                                <Check className="w-3.5 h-3.5" />
                                                通过
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleReview(a, 'rejected')}
                                                className="h-8 gap-1 border-red-200 text-red-500 hover:bg-red-50 rounded-lg"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                                拒绝
                                            </Button>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">审核完成</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                <div className="p-4 border-t border-gray-50 flex items-center justify-between">
                    <p className="text-xs text-gray-400">共 {total} 份申请</p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)} className="text-xs h-8 px-3 rounded-lg">前一页</Button>
                        <Button variant="outline" size="sm" disabled={page * pageSize >= total} onClick={() => setPage(page + 1)} className="text-xs h-8 px-3 rounded-lg">后一页</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

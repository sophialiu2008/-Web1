import { useState, useEffect } from 'react';
import { fetchAdminBookings, updateBookingStatus } from '@/services/api';
import { Calendar, Clock } from 'lucide-react';
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

export default function BookingManagement() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const loadData = async () => {
        setLoading(true);
        try {
            const { data, total } = await fetchAdminBookings({ page, pageSize });
            setBookings(data);
            setTotal(total);
        } catch {
            toast.error('获取预约列表失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [page]);

    const handleAction = async (id: string, status: string) => {
        const label = status === 'confirmed' ? '确认' : '取消';
        if (!confirm(`确定要${label}该预约吗？`)) return;
        try {
            await updateBookingStatus(id, status);
            toast.success(`预约已${label}`);
            loadData();
        } catch {
            toast.error('操作失败');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">预约管理</h1>
                <p className="text-gray-500 text-sm mt-1">管理用户预约到中心看望宠物的日程安排</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow>
                            <TableHead>预约人</TableHead>
                            <TableHead>联系方式</TableHead>
                            <TableHead>预约宠物</TableHead>
                            <TableHead>看宠时间</TableHead>
                            <TableHead>当前状态</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-20 rounded-md" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-32 rounded-md" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto rounded-lg" /></TableCell>
                                </TableRow>
                            ))
                        ) : bookings.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-16">
                                    <EmptyState
                                        icon={Calendar}
                                        title="暂无预约"
                                        description="目前还没有用户提交任何看望宠物的预约日程。"
                                        className="py-0"
                                    />
                                </TableCell>
                            </TableRow>
                        ) : bookings.map((b) => (
                            <TableRow key={b.id} className="hover:bg-gray-50/50 transition-colors">
                                <TableCell className="font-medium text-gray-800">{b.name}</TableCell>
                                <TableCell className="text-sm text-gray-500">{b.phone}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-orange-400" />
                                        <span className="text-sm">{b.pet_name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                                        {b.date} {b.time}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${b.status === 'confirmed' ? 'bg-green-100 text-green-600' :
                                        b.status === 'cancelled' ? 'bg-gray-100 text-gray-400' :
                                            'bg-blue-100 text-blue-500'
                                        }`}>
                                        {b.status === 'confirmed' ? '已确认' : b.status === 'cancelled' ? '已取消' : '待确认'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    {b.status === 'pending' && (
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" onClick={() => handleAction(b.id, 'confirmed')} className="h-8 bg-green-500 hover:bg-green-600 rounded-lg">确认</Button>
                                            <Button variant="outline" size="sm" onClick={() => handleAction(b.id, 'cancelled')} className="h-8 border-gray-200 rounded-lg">取消</Button>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <div className="p-4 border-t border-gray-50 flex items-center justify-between">
                    <p className="text-xs text-gray-400">共 {total} 条记录</p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)} className="text-xs h-8 px-3 rounded-lg">前页</Button>
                        <Button variant="outline" size="sm" disabled={page * pageSize >= total} onClick={() => setPage(page + 1)} className="text-xs h-8 px-3 rounded-lg">后页</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

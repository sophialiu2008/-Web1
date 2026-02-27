import { useState, useEffect } from 'react';
import { fetchAdminUsers, updateUserStatus } from '@/services/api';
import { Search, Ban, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
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

export default function UserManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const loadUsers = async () => {
        setLoading(true);
        try {
            const { data, total } = await fetchAdminUsers({ page, pageSize, search });
            setUsers(data);
            setTotal(total);
        } catch (err) {
            toast.error('获取用户列表失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, [page, search]);

    const handleToggleStatus = async (user: any) => {
        if (!confirm(`确定要${user.status === 'active' ? '禁用' : '启用'}该用户吗？`)) return;
        try {
            const nextStatus = user.status === 'active' ? 'disabled' : 'active';
            await updateUserStatus(user.id, nextStatus);
            toast.success('操作成功');
            loadUsers();
        } catch {
            toast.error('操作失败');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">用户管理</h1>
                    <p className="text-gray-500 text-sm mt-1">管理并监控已注册用户及其账号状态</p>
                </div>
                <div className="relative w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="按用户名/邮箱/手机号搜索"
                        className="pl-10 rounded-xl"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow>
                            <TableHead>用户名</TableHead>
                            <TableHead>联系方式</TableHead>
                            <TableHead>注册时间</TableHead>
                            <TableHead>身份</TableHead>
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
                                            <Skeleton className="w-8 h-8 rounded-full" />
                                            <Skeleton className="h-4 w-20" />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-32 mb-1" />
                                        <Skeleton className="h-3 w-24" />
                                    </TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-12 rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto rounded-lg" /></TableCell>
                                </TableRow>
                            ))
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-16">
                                    <EmptyState
                                        icon={Search}
                                        title="暂无用户"
                                        description="暂时没有符合搜索条件的用户数据。"
                                        className="py-0"
                                    />
                                </TableCell>
                            </TableRow>
                        ) : users.map((u) => (
                            <TableRow key={u.id} className="hover:bg-gray-50/50 transition-colors">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-xs font-bold shrink-0">
                                            {u.name?.[0] || u.email?.[0] || 'U'}
                                        </div>
                                        <span className="font-medium text-gray-800">{u.name || '未填名称'}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm">
                                        <p className="text-gray-600">{u.email || '-'}</p>
                                        <p className="text-gray-400 text-xs">{u.phone || '-'}</p>
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm text-gray-500">
                                    {new Date(u.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        {u.role || 'user'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className={`flex items-center gap-1.5 text-xs ${u.status === 'active' ? 'text-green-500' : 'text-red-400'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-green-500' : 'bg-red-400'}`} />
                                        {u.status === 'active' ? '正常' : '禁用'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleToggleStatus(u)}
                                            className={`h-8 gap-1.5 rounded-lg ${u.status === 'active' ? 'text-gray-500 hover:text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                                        >
                                            {u.status === 'active' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                            {u.status === 'active' ? '禁用' : '启用'}
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {/* Pagination */}
                <div className="p-4 border-t border-gray-50 flex items-center justify-between">
                    <p className="text-xs text-gray-400">共 {total} 条记录</p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            className="text-xs h-8 px-3 rounded-lg"
                        >
                            前一页
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page * pageSize >= total}
                            onClick={() => setPage(page + 1)}
                            className="text-xs h-8 px-3 rounded-lg"
                        >
                            后一页
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

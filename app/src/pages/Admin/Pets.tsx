import { useState, useEffect } from 'react';
import { fetchAdminPets } from '@/services/api';
import { Tag, User, MapPin, Edit3, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { toast } from 'sonner';

export default function PetManagement() {
    const [pets, setPets] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const loadData = async () => {
        setLoading(true);
        try {
            const { data, total } = await fetchAdminPets({ page, pageSize });
            setPets(data);
            setTotal(total);
        } catch {
            toast.error('获取宠物列表失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [page]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">宠物管理</h1>
                    <p className="text-gray-500 text-sm mt-1">查看并管理平台上的所有待领养及已领养宠物信息</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow>
                            <TableHead>宠物信息</TableHead>
                            <TableHead>品种</TableHead>
                            <TableHead>发布人</TableHead>
                            <TableHead>所在地</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">加载中...</TableCell></TableRow>
                        ) : pets.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">库中无宠物</TableCell></TableRow>
                        ) : pets.map((p) => (
                            <TableRow key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <img src={p.images?.[0] || '/images/cat-orange.jpg'} className="w-10 h-10 rounded-xl object-cover shrink-0 bg-gray-100" />
                                        <div>
                                            <div className="font-bold text-gray-800">{p.name}</div>
                                            <div className="text-xs text-orange-500 flex items-center gap-1">
                                                <Tag className="w-3 h-3" /> {p.category}
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm text-gray-600">{p.breed}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <User className="w-3.5 h-3.5" />
                                        <span className="truncate max-w-[100px]">{p.user_id ? '个人/会员' : '平台发布'}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1 text-xs text-gray-400">
                                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                                        {p.city || '未知'}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.status === 'adopted' ? 'bg-gray-100 text-gray-400' : 'bg-green-100 text-green-600'
                                        }`}>
                                        {p.status === 'adopted' ? '已领养' : '待领养'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg">
                                            <Edit3 className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <div className="p-4 border-t border-gray-50 flex items-center justify-between">
                    <p className="text-xs text-gray-400">共 {total} 只宠物</p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)} className="text-xs h-8 px-3 rounded-lg">前页</Button>
                        <Button variant="outline" size="sm" disabled={page * pageSize >= total} onClick={() => setPage(page + 1)} className="text-xs h-8 px-3 rounded-lg">后页</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

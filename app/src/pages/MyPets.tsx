import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useUserStore } from '@/store/userStore';
import { deletePet, fetchPets, updatePet } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

type PetItem = {
  id: string;
  name: string;
  category: string;
  breed?: string | null;
  age_years?: number | null;
  gender?: string | null;
  province?: string | null;
  city?: string | null;
  district?: string | null;
  description?: string | null;
  images?: string[] | null;
  view_count?: number | null;
  status?: string | null;
  created_at?: string | null;
};

const statusMap: Record<string, string> = {
  available: '可领养',
  adopted: '已领养',
  closed: '已下架'
};

export default function MyPets() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useUserStore();
  const [pets, setPets] = useState<PetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PetItem | null>(null);
  const lastActiveRef = useRef<HTMLElement | null>(null);
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  const { register, handleSubmit, setValue, watch } = useForm<PetItem>({
    defaultValues: {}
  });

  useEffect(() => {
    if (!isLoggedIn || !user?.id) {
      toast.error('请先登录');
      navigate('/login');
      return;
    }
    const load = async () => {
      try {
        const res = await fetchPets({ user_id: user.id, page: 1, pageSize: 50 });
        setPets(res.data || []);
      } catch {
        toast.error('获取列表失败');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isLoggedIn, user?.id, navigate]);

  const openEdit = (pet: PetItem) => {
    lastActiveRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setEditing(pet);
    setValue('name', pet.name);
    setValue('category', pet.category);
    setValue('breed', pet.breed || '');
    setValue('age_years', pet.age_years || undefined);
    setValue('gender', pet.gender || '');
    setValue('province', pet.province || '');
    setValue('city', pet.city || '');
    setValue('district', pet.district || '');
    setValue('description', pet.description || '');
    setValue('status', pet.status || 'available');
  };

  const closeEdit = () => setEditing(null);

  const onUpdate = async (values: PetItem) => {
    if (!editing) return;
    try {
      await updatePet(editing.id, values);
      toast.success('更新成功');
      setPets((prev) => prev.map((p) => (p.id === editing.id ? { ...p, ...values } : p)));
      closeEdit();
    } catch {
      toast.error('更新失败');
    }
  };

  const handleClose = async (petId: string) => {
    try {
      await deletePet(petId);
      setPets((prev) => prev.map((p) => (p.id === petId ? { ...p, status: 'closed' } : p)));
      toast.success('已下架');
    } catch {
      toast.error('下架失败');
    }
  };

  const empty = !loading && pets.length === 0;

  return (
    <div className="min-h-screen bg-warm-gradient">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">我的发布</h1>
            <p className="text-gray-600 mt-1">管理你发布的宠物信息</p>
          </div>
          <Button onClick={() => navigate('/pets/new')} className="bg-orange-500 hover:bg-orange-600 text-white rounded-full">
            发布新宠物
          </Button>
        </div>

        {loading && <div className="text-gray-500">加载中...</div>}
        {empty && (
          <div className="text-center py-20 bg-white rounded-2xl shadow-warm">
            <p className="text-gray-600 mb-6">暂无发布记录</p>
            <Button onClick={() => navigate('/pets/new')} className="bg-orange-500 hover:bg-orange-600 text-white rounded-full">
              去发布
            </Button>
          </div>
        )}

        {!loading && pets.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            {pets.map((pet) => (
              <Card key={pet.id} className="overflow-hidden border-0 shadow-warm">
                <div className="aspect-[4/3] bg-gray-100">
                  {pet.images?.[0] ? (
                    <img src={pet.images[0]} alt={pet.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">暂无图片</div>
                  )}
                </div>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">{pet.name}</h3>
                      <p className="text-sm text-gray-500">{pet.breed || '未填写品种'}</p>
                    </div>
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                      {statusMap[pet.status || 'available']}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500 mt-3 space-y-1">
                    <p>浏览数：{pet.view_count ?? 0}</p>
                    <p>发布时间：{pet.created_at ? new Date(pet.created_at).toLocaleDateString() : '--'}</p>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <Button variant="outline" className="flex-1" onClick={() => openEdit(pet)}>
                      编辑
                    </Button>
                    <Button variant="outline" className="flex-1 border-red-200 text-red-500 hover:bg-red-50" onClick={() => handleClose(pet.id)}>
                      下架
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent
          className="max-w-lg"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            firstInputRef.current?.focus();
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            lastActiveRef.current?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>编辑宠物信息</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onUpdate)} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>名称</Label>
                <Input {...register('name')} ref={firstInputRef} />
              </div>
              <div className="space-y-2">
                <Label>种类</Label>
                <Select value={watch('category') || ''} onValueChange={(v) => setValue('category', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="猫咪">猫咪</SelectItem>
                    <SelectItem value="狗狗">狗狗</SelectItem>
                    <SelectItem value="其他">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>品种</Label>
                <Input {...register('breed')} />
              </div>
              <div className="space-y-2">
                <Label>年龄（岁）</Label>
                <Input type="number" step="0.1" {...register('age_years')} />
              </div>
              <div className="space-y-2">
                <Label>性别</Label>
                <Select value={watch('gender') || ''} onValueChange={(v) => setValue('gender', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="公">公</SelectItem>
                    <SelectItem value="母">母</SelectItem>
                    <SelectItem value="未知">未知</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>状态</Label>
                <Select value={watch('status') || ''} onValueChange={(v) => setValue('status', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">可领养</SelectItem>
                    <SelectItem value="adopted">已领养</SelectItem>
                    <SelectItem value="closed">已下架</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>省份</Label>
                <Input {...register('province')} />
              </div>
              <div className="space-y-2">
                <Label>城市</Label>
                <Input {...register('city')} />
              </div>
              <div className="space-y-2">
                <Label>区域</Label>
                <Input {...register('district')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>介绍</Label>
              <Textarea rows={4} {...register('description')} />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={closeEdit}>
                取消
              </Button>
              <Button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
                保存
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

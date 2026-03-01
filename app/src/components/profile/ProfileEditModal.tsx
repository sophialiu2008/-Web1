import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Loader2 } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { updateProfile } from '@/services/api';
import { toast } from 'sonner';

const schema = z.object({
    name: z.string().min(2, '昵称至少2个字符').max(20, '昵称最多20个字符'),
    phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入正确的手机号').optional().or(z.literal('')),
    city: z.string().max(20, '城市最多20个字符').optional().or(z.literal('')),
    bio: z.string().max(100, '简介最多100个字符').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

interface ProfileEditModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ProfileEditModal({ isOpen, onClose }: ProfileEditModalProps) {
    const { user, updateUser } = useUserStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
    const [isUploading, setIsUploading] = useState(false);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: user?.name || '',
            phone: user?.phone || '',
            city: user?.city || '',
            bio: user?.bio || '',
        },
    });

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('图片大小不能超过 5MB');
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const token = useUserStore.getState().accessToken;
            const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8789';
            const res = await fetch(`${API_BASE}/api/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '上传失败');

            if (data.urls && data.urls.length > 0) {
                setAvatarUrl(data.urls[0]);
                toast.success('头像上传成功');
            }
        } catch (error: any) {
            toast.error(error.message || '上传头像失败');
        } finally {
            setIsUploading(false);
        }
    };

    const onSubmit = async (data: FormValues) => {
        try {
            await updateProfile({
                name: data.name,
                phone: data.phone,
                city: data.city,
                bio: data.bio,
                avatar: avatarUrl
            });
            toast.success('个人信息更新成功');
            updateUser({
                name: data.name,
                phone: data.phone,
                city: data.city,
                bio: data.bio,
                avatar: avatarUrl
            });
            onClose();
        } catch (error: any) {
            toast.error(error.message || '更新失败');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto w-[95%] sm:w-full">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-center text-gray-800">编辑个人资料</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
                    <div className="flex flex-col items-center gap-4">
                        <div
                            className="relative w-24 h-24 rounded-full bg-gray-100 overflow-hidden group cursor-pointer border-2 border-orange-100"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <Camera className="w-8 h-8" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                {isUploading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            disabled={isUploading}
                        />
                        <p className="text-xs text-gray-500">点击更换头像 (支持jpg/png, 最大5MB)</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>昵称 *</Label>
                            <Input {...register('name')} placeholder="请输入昵称" className="rounded-full" />
                            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>手机号</Label>
                            <Input {...register('phone')} placeholder="请输入手机号" className="rounded-full" />
                            {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>所在城市</Label>
                            <Input {...register('city')} placeholder="例如：北京市" className="rounded-full" />
                            {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>个人简介</Label>
                            <Textarea {...register('bio')} placeholder="简单介绍一下自己和养宠经验..." className="rounded-2xl min-h-[100px]" />
                            {errors.bio && <p className="text-xs text-red-500">{errors.bio.message}</p>}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-full">取消</Button>
                        <Button type="submit" disabled={isSubmitting || isUploading} className="flex-1 rounded-full bg-orange-500 hover:bg-orange-600 text-white">
                            {isSubmitting ? '保存中...' : '保存更改'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

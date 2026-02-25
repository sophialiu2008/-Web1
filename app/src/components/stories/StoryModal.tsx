import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Upload, X } from 'lucide-react';
import { useStoryStore } from '@/store/storyStore';
import { toast } from 'sonner';

const schema = z.object({
    pet_id: z.string().min(1, '请选择已领养的宠物'),
    title: z.string().min(2, '标题至少2个字符').max(50, '标题最多50个字符'),
    content: z.string().min(10, '内容至少10个字符').max(1000, '内容最多1000个字符'),
    rating: z.number().min(1).max(5),
});

type FormValues = z.infer<typeof schema>;

interface StoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function StoryModal({ isOpen, onClose }: StoryModalProps) {
    const [adoptions, setAdoptions] = useState<any[]>([]);
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const { fetchMyAdoptions, createStory } = useStoryStore();

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors, isSubmitting }
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            rating: 5,
        }
    });

    const rating = watch('rating');

    useEffect(() => {
        if (isOpen) {
            fetchMyAdoptions().then(setAdoptions);
        }
    }, [isOpen, fetchMyAdoptions]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (images.length + files.length > 5) {
            toast.error('最多只能上传5张图片');
            return;
        }

        const newImages = [...images, ...files];
        setImages(newImages);

        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviews(prev => [...prev, ...newPreviews]);
    };

    const removeImage = (index: number) => {
        URL.revokeObjectURL(previews[index]);
        setImages(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const onSubmit = async (data: FormValues) => {
        const formData = new FormData();
        formData.append('pet_id', data.pet_id);
        formData.append('title', data.title);
        formData.append('content', data.content);
        formData.append('rating', data.rating.toString());

        const selectedPet = adoptions.find(a => a.pet_id === data.pet_id);
        if (selectedPet) {
            formData.append('pet_name', selectedPet.pet_name);
            formData.append('pet_type', selectedPet.pet_type);
        }

        images.forEach(image => {
            formData.append('images', image);
        });

        const result = await createStory(formData);
        if (result.success) {
            toast.success('分享成功！感谢您的故事');
            reset();
            setImages([]);
            setPreviews([]);
            onClose();
        } else {
            toast.error(result.error || '发布失败');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center text-gray-800">分享我的故事</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label>选择领养的宠物 *</Label>
                        <Select onValueChange={(value) => setValue('pet_id', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="选择您领养的伙伴" />
                            </SelectTrigger>
                            <SelectContent>
                                {adoptions.length > 0 ? (
                                    adoptions.map((pet) => (
                                        <SelectItem key={pet.pet_id} value={pet.pet_id}>
                                            {pet.pet_name} ({pet.pet_type})
                                        </SelectItem>
                                    ))
                                ) : (
                                    <div className="p-2 text-sm text-gray-500 text-center">暂无符合条件的领养记录</div>
                                )}
                            </SelectContent>
                        </Select>
                        {errors.pet_id && <p className="text-xs text-red-500">{errors.pet_id.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>故事标题 *</Label>
                        <Input {...register('title')} placeholder="给你的故事起个温暖的名字" />
                        {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>故事内容 *</Label>
                        <Textarea
                            {...register('content')}
                            placeholder="分享领养后的点点滴滴，例如宠物的变化、给家庭带来的欢乐等..."
                            className="min-h-[150px]"
                        />
                        {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>评价星级</Label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setValue('rating', star)}
                                    className="transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={`w-8 h-8 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>上传生活照 (最多5张)</Label>
                        <div className="grid grid-cols-3 gap-4">
                            {previews.map((src, index) => (
                                <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                                    <img src={src} alt="preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            {previews.length < 5 && (
                                <label className="border-2 border-dashed border-gray-200 rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-orange-300 hover:bg-orange-50 transition-colors">
                                    <Upload className="w-6 h-6 text-gray-400" />
                                    <span className="text-xs text-gray-500 mt-1">添加图片</span>
                                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                                </label>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 rounded-full"
                        >
                            取消
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-full"
                        >
                            {isSubmitting ? '正在提交...' : '发布故事'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

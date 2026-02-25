import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUserStore } from '@/store/userStore';
import { createPet } from '@/services/api';
import { usePetStore } from '@/store/petStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ImagePlus, X, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import pcaData from '@/data/pca.json';
import MapPicker from '@/components/map/MapPicker';

const schema = z.object({
  name: z.string().min(1, '请填写宠物名称'),
  category: z.string().min(1, '请选择种类'),
  breed: z.string().optional(),
  age_years: z.preprocess((v) => (v === '' || v === undefined ? undefined : Number(v)), z.number().min(0, '年龄必须大于等于0').max(30, '年龄过大')).optional(),
  gender: z.string().min(1, '请选择性别'),
  province: z.string().min(1, '请选择省份'),
  city: z.string().min(1, '请选择城市'),
  district: z.string().min(1, '请选择区域'),
  is_vaccinated: z.boolean(),
  is_neutered: z.boolean(),
  personality_tags: z.array(z.string()).optional(),
  personality_traits: z.array(z.string()).optional(),
  suitable_for: z.array(z.string()).optional(),
  description: z.string().min(20, '至少20字').max(500, '最多500字'),
  images: z.array(z.instanceof(File)).min(1, '请上传至少1张图片').max(6, '最多6张图片')
});

type FormValues = z.infer<typeof schema>;

const categoryOptions = ['猫咪', '狗狗', '其他'];
const genderOptions = ['公', '母', '未知'];
const tagOptions = ['活泼', '亲人', '好养', '可爱', '腼腆', '安静', '黏人'];
const traitOptions = ['活泼', '亲人', '好奇', '独立', '温顺', '警觉'];
const suitableOptions = ['公寓居住', '有院子', '上班族', '有孩子家庭', '初次养猫者', '有养宠经验者'];

// Use type from imported JSON
const locationData = pcaData as Record<string, Record<string, string[]>>;

export default function PetsNew() {
  const navigate = useNavigate();
  const { isLoggedIn } = useUserStore();
  const [step, setStep] = useState(1);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [customTrait, setCustomTrait] = useState('');
  const [customSuitable, setCustomSuitable] = useState('');
  const [petLatLng, setPetLatLng] = useState<{ lat: number; lng: number } | null>(null);

  const compressImage = async (file: File, maxKB: number) => {
    if (!file.type.startsWith('image/')) return file;
    const maxBytes = maxKB * 1024;
    if (file.size <= maxBytes) return file;
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    let { width, height } = bitmap;
    const maxSide = 1200;
    if (Math.max(width, height) > maxSide) {
      const scale = maxSide / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    let quality = 0.85;
    let blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    while (blob && blob.size > maxBytes && quality > 0.5) {
      quality -= 0.1;
      blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    }
    if (!blob || blob.size > maxBytes) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
  };

  const getErrorText = (err: unknown) => {
    if (err instanceof Error && err.message) return err.message;
    const anyErr = err as { json?: { error?: string }; response?: { data?: unknown }; errors?: unknown };
    if (anyErr.json?.error) return anyErr.json.error;
    if (anyErr.response?.data) return typeof anyErr.response.data === 'string' ? anyErr.response.data : JSON.stringify(anyErr.response.data);
    if (anyErr.errors) return typeof anyErr.errors === 'string' ? anyErr.errors : JSON.stringify(anyErr.errors);
    try {
      return JSON.stringify(err);
    } catch {
      return '发布失败，请稍后重试';
    }
  };

  const {
    register,
    setValue,
    trigger,
    getValues,
    handleSubmit,
    control,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: '',
      category: '',
      breed: '',
      age_years: undefined,
      gender: '',
      province: '',
      city: '',
      district: '',
      is_vaccinated: false,
      is_neutered: false,
      personality_tags: [],
      personality_traits: [],
      suitable_for: [],
      description: '',
      images: []
    }
  });

  const [
    categoryValue,
    genderValue,
    districtValue,
    isVaccinatedValue,
    isNeuteredValue,
    nameValue,
    breedValue,
    ageValue,
    provinceValue,
    cityValue,
    descriptionValue,
    personalityTagsValue,
    personalityTraitsValue,
    suitableForValue
  ] = useWatch({
    control,
    name: [
      'category',
      'gender',
      'district',
      'is_vaccinated',
      'is_neutered',
      'name',
      'breed',
      'age_years',
      'province',
      'city',
      'description',
      'personality_tags',
      'personality_traits',
      'suitable_for'
    ]
  }) as [
      string,
      string,
      string,
      boolean,
      boolean,
      string,
      string,
      number,
      string,
      string,
      string,
      string[],
      string[],
      string[]
    ];

  const province = provinceValue || '';
  const city = cityValue || '';
  const desc = descriptionValue || '';
  const personalityTags = personalityTagsValue || [];
  const personalityTraits = personalityTraitsValue || [];
  const suitableFor = suitableForValue || [];

  useEffect(() => {
    if (!isLoggedIn) {
      toast.error('请先登录');
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const cities = useMemo(() => (province ? Object.keys(locationData[province] || {}) : []), [province]);
  const districts = useMemo(() => {
    if (!province || !city) return [];
    const cityMap = locationData[province];
    return cityMap?.[city] || [];
  }, [province, city]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const selected = Array.from(files);
    const current = getValues('images') || [];
    const merged = [...current, ...selected].slice(0, 6);
    const valid = merged.filter((file) => file.size <= 5 * 1024 * 1024 && file.type.startsWith('image/'));
    setValue('images', valid, { shouldValidate: true });
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImagePreviews(valid.map((file) => URL.createObjectURL(file)));
  };

  const removeImage = (index: number) => {
    const current = getValues('images') || [];
    const next = current.filter((_, i) => i !== index);
    setValue('images', next, { shouldValidate: true });
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImagePreviews(next.map((file) => URL.createObjectURL(file)));
  };

  const toggleArrayValue = (field: 'personality_tags' | 'personality_traits' | 'suitable_for', value: string) => {
    const current = getValues(field) || [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    setValue(field, next, { shouldValidate: true });
  };

  const addCustomValue = (field: 'personality_tags' | 'personality_traits' | 'suitable_for', value: string, setter: (v: string) => void) => {
    const v = value.trim();
    if (!v) return;
    const current = getValues(field) || [];
    if (!current.includes(v)) {
      setValue(field, [...current, v], { shouldValidate: true });
    }
    setter('');
  };

  const nextStep = async () => {
    const fields = step === 1
      ? ['name', 'category', 'gender', 'province', 'city', 'district', 'images']
      : ['description'];
    const ok = await trigger(fields as Array<keyof FormValues>);
    if (ok) setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const onSubmit = async (values: any) => {
    const form = new FormData();
    form.append('name', values.name);
    form.append('category', values.category);
    if (values.breed) form.append('breed', values.breed);
    if (values.age_years !== undefined && values.age_years !== null && values.age_years !== ('' as unknown as number)) {
      form.append('age_years', String(values.age_years));
    }
    form.append('gender', values.gender);
    form.append('province', values.province);
    form.append('city', values.city);
    form.append('district', values.district);
    form.append('description', values.description);
    form.append('is_vaccinated', String(values.is_vaccinated));
    form.append('is_neutered', String(values.is_neutered));
    form.append('personality_tags', JSON.stringify(values.personality_tags || []));
    form.append('personality_traits', JSON.stringify(values.personality_traits || []));
    form.append('suitable_for', JSON.stringify(values.suitable_for || []));
    if (petLatLng) {
      form.append('latitude', String(petLatLng.lat));
      form.append('longitude', String(petLatLng.lng));
    }
    const compressedImages = await Promise.all((values.images as File[]).map((file: File) => compressImage(file, 300)));
    compressedImages.forEach((file) => form.append('images', file));
    try {
      const res = (await createPet(form, setUploadProgress)) as { id?: string; error?: string };
      if (res.id) {
        // Invalidate pet list cache
        usePetStore.getState().invalidateCache();

        toast.success('发布成功');
        navigate(`/pet/${res.id}`);
        return;
      }
      const msg = res.error || '发布失败，请稍后重试';
      toast.error(msg);
      console.error('Create pet failed:', res);
    } catch (err) {
      const error = err as { status?: number };
      const msg = getErrorText(err);
      if (error.status === 408) {
        toast.error('请求超时，请检查网络连接或尝试使用更小的图片后重试');
      } else {
        toast.error(msg);
      }
      if (error.status === 401) {
        navigate('/login');
      }
      console.error('Create pet error:', err);
      try {
        console.error('Create pet error detail:', JSON.stringify(err));
      } catch {
        console.error('Create pet error detail: [unserializable]');
      }
    }
  };

  const stepProgress = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <div className="min-h-screen bg-warm-gradient">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">发布待领养宠物</h1>
          <p className="text-gray-600">完善信息，提高领养效率</p>
          <div className="mt-4">
            <Progress value={stepProgress} />
          </div>
        </div>

        <Card className="border-0 shadow-warm">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {step === 1 && (
                <div className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>宠物名称 *</Label>
                      <Input placeholder="请输入宠物名称" {...register('name')} />
                      {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>种类 *</Label>
                      <Select value={categoryValue || ''} onValueChange={(v) => setValue('category', v, { shouldValidate: true })}>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryOptions.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>品种</Label>
                      <Input placeholder="例如：橘猫、柴犬" {...register('breed')} />
                    </div>
                    <div className="space-y-2">
                      <Label>年龄（岁）</Label>
                      <Input type="number" step="0.1" min="0" placeholder="例如：2.5" {...register('age_years')} />
                      {errors.age_years && <p className="text-xs text-red-500">{errors.age_years.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>性别 *</Label>
                      <Select value={genderValue || ''} onValueChange={(v) => setValue('gender', v, { shouldValidate: true })}>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择" />
                        </SelectTrigger>
                        <SelectContent>
                          {genderOptions.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.gender && <p className="text-xs text-red-500">{errors.gender.message}</p>}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label>省份 *</Label>
                      <Select value={province} onValueChange={(v) => {
                        setValue('province', v, { shouldValidate: true });
                        setValue('city', '', { shouldValidate: true });
                        setValue('district', '', { shouldValidate: true });
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(locationData).map((p) => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.province && <p className="text-xs text-red-500">{errors.province.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>城市 *</Label>
                      <Select value={city} onValueChange={(v) => {
                        setValue('city', v, { shouldValidate: true });
                        setValue('district', '', { shouldValidate: true });
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择" />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>区域 *</Label>
                      <Select value={districtValue || ''} onValueChange={(v) => setValue('district', v, { shouldValidate: true })}>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择" />
                        </SelectTrigger>
                        <SelectContent>
                          {districts.map((d) => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.district && <p className="text-xs text-red-500">{errors.district.message}</p>}
                    </div>
                  </div>

                  {/* Map Picker for precise location */}
                  <div className="space-y-2">
                    <Label>地图定位（可选）</Label>
                    <p className="text-xs text-gray-400">在地图上点选精确位置，或使用定位按钮获取当前位置</p>
                    <MapPicker
                      height="250px"
                      onLocationSelect={(loc) => {
                        // Auto-fill province/city/district from map
                        if (loc.province) {
                          setValue('province', loc.province, { shouldValidate: true });
                        }
                        if (loc.city) {
                          setValue('city', loc.city, { shouldValidate: true });
                        }
                        if (loc.district) {
                          setValue('district', loc.district, { shouldValidate: true });
                        }
                        setPetLatLng({ lat: loc.lat, lng: loc.lng });
                      }}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>图片上传 *</Label>
                    <div
                      className="border-2 border-dashed rounded-xl p-6 text-center hover:border-orange-300 transition-colors bg-orange-50/40"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleFiles(e.dataTransfer.files);
                      }}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <UploadCloud className="w-8 h-8 text-orange-400" />
                        <div className="text-sm text-gray-600">拖拽图片到这里，或点击选择</div>
                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-full cursor-pointer">
                          <ImagePlus className="w-4 h-4" />
                          选择图片
                          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
                        </label>
                        <p className="text-xs text-gray-400">最多6张，单张不超过5MB</p>
                      </div>
                    </div>
                    {errors.images && <p className="text-xs text-red-500">{errors.images.message as string}</p>}
                    {imagePreviews.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {imagePreviews.map((src, idx) => (
                          <div key={src} className="relative group">
                            <img src={src} alt={`预览${idx + 1}`} className="w-full h-20 object-cover rounded-lg border border-gray-100" />
                            {idx === 0 && <Badge className="absolute left-1 top-1 bg-orange-500 text-white text-[10px]">封面</Badge>}
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="absolute -top-2 -right-2 bg-white rounded-full shadow p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3 text-gray-500" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between gap-4 p-4 border rounded-xl">
                      <div>
                        <p className="font-medium text-gray-800">已接种疫苗</p>
                        <p className="text-xs text-gray-500">提升领养信任度</p>
                      </div>
                      <Switch checked={isVaccinatedValue || false} onCheckedChange={(v) => setValue('is_vaccinated', v)} />
                    </div>
                    <div className="flex items-center justify-between gap-4 p-4 border rounded-xl">
                      <div>
                        <p className="font-medium text-gray-800">已绝育</p>
                        <p className="text-xs text-gray-500">降低走失风险</p>
                      </div>
                      <Switch checked={isNeuteredValue || false} onCheckedChange={(v) => setValue('is_neutered', v)} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>性格标签</Label>
                    <div className="flex flex-wrap gap-2">
                      {tagOptions.map((tag) => (
                        <button
                          type="button"
                          key={tag}
                          onClick={() => toggleArrayValue('personality_tags', tag)}
                          className={`px-3 py-1 rounded-full text-sm border transition-colors ${personalityTags.includes(tag)
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-orange-200 hover:bg-orange-50'
                            }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input value={customTag} onChange={(e) => setCustomTag(e.target.value)} placeholder="自定义标签" />
                      <Button type="button" variant="outline" onClick={() => addCustomValue('personality_tags', customTag, setCustomTag)}>添加</Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>性格特点</Label>
                    <div className="flex flex-wrap gap-2">
                      {traitOptions.map((tag) => (
                        <button
                          type="button"
                          key={tag}
                          onClick={() => toggleArrayValue('personality_traits', tag)}
                          className={`px-3 py-1 rounded-full text-sm border transition-colors ${personalityTraits.includes(tag)
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-orange-200 hover:bg-orange-50'
                            }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input value={customTrait} onChange={(e) => setCustomTrait(e.target.value)} placeholder="自定义特点" />
                      <Button type="button" variant="outline" onClick={() => addCustomValue('personality_traits', customTrait, setCustomTrait)}>添加</Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>适合人群</Label>
                    <div className="flex flex-wrap gap-2">
                      {suitableOptions.map((tag) => (
                        <button
                          type="button"
                          key={tag}
                          onClick={() => toggleArrayValue('suitable_for', tag)}
                          className={`px-3 py-1 rounded-full text-sm border transition-colors ${suitableFor.includes(tag)
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-orange-200 hover:bg-orange-50'
                            }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input value={customSuitable} onChange={(e) => setCustomSuitable(e.target.value)} placeholder="自定义人群" />
                      <Button type="button" variant="outline" onClick={() => addCustomValue('suitable_for', customSuitable, setCustomSuitable)}>添加</Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>宠物介绍 *</Label>
                    <Textarea rows={6} placeholder="请详细介绍宠物特点、习惯、注意事项..." {...register('description')} />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>{errors.description?.message}</span>
                      <span>{desc.length}/500</span>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div>
                      {imagePreviews[0] ? (
                        <img src={imagePreviews[0]} alt="封面预览" className="w-full h-64 object-cover rounded-xl" />
                      ) : (
                        <div className="w-full h-64 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">暂无封面</div>
                      )}
                      {imagePreviews.length > 1 && (
                        <div className="grid grid-cols-4 gap-2 mt-3">
                          {imagePreviews.slice(1).map((src) => (
                            <img key={src} src={src} alt="预览" className="w-full h-16 object-cover rounded-lg border border-gray-100" />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Badge className="bg-orange-500">{categoryValue || '未填写'}</Badge>
                        <Badge variant="outline">{breedValue || '未填写品种'}</Badge>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800">{nameValue || '未填写名称'}</h2>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>年龄：{ageValue ?? '未知'} 岁</p>
                        <p>性别：{genderValue || '未知'}</p>
                        <p>地区：{[provinceValue, cityValue, districtValue].filter(Boolean).join(' ')}</p>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span className={isVaccinatedValue ? 'text-green-600' : 'text-gray-400'}>{isVaccinatedValue ? '已疫苗' : '未疫苗'}</span>
                        <span className={isNeuteredValue ? 'text-green-600' : 'text-gray-400'}>{isNeuteredValue ? '已绝育' : '未绝育'}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(personalityTags || []).map((t) => (
                          <span key={t} className="px-2 py-1 bg-orange-50 text-orange-600 rounded-full text-xs">{t}</span>
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{descriptionValue || '暂无介绍'}</p>
                    </div>
                  </div>
                  {isSubmitting && (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">上传中 {uploadProgress}%</div>
                      <Progress value={uploadProgress} />
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between gap-4">
                {step > 1 ? (
                  <Button type="button" variant="outline" onClick={prevStep} disabled={isSubmitting}>
                    上一步
                  </Button>
                ) : (
                  <div />
                )}
                {step < 3 ? (
                  <Button type="button" onClick={nextStep} className="bg-orange-500 hover:bg-orange-600 text-white">
                    下一步
                  </Button>
                ) : (
                  <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white" disabled={isSubmitting}>
                    确认发布
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

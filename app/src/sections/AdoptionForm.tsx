import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { usePetStore } from '@/store/petStore';
import { pets as mockPets } from '@/data/pets';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Mail, Phone, User, Home, MessageSquare, Send, CheckCircle2, PawPrint, Clock, MapPin, AlertCircle, Save } from 'lucide-react';
import { submitApplication } from '@/services/api';
import { toast } from 'sonner';

const petTypes = [
  { value: 'dog', label: '狗狗' },
  { value: 'cat', label: '猫咪' },
  { value: 'both', label: '都可以' },
];

const experienceLevels = [
  { value: 'none', label: '没有经验' },
  { value: 'some', label: '有一些经验' },
  { value: 'experienced', label: '经验丰富' },
];

const housingTypes = [
  { value: 'apartment', label: '公寓' },
  { value: 'house', label: '独栋房屋' },
  { value: 'other', label: '其他' },
];

interface FormData {
  name: string;
  phone: string;
  email: string;
  age: string;
  occupation: string;
  housingType: string;
  hasYard: boolean;
  petType: string;
  experience: string;
  currentPets: string;
  familyMembers: string;
  reason: string;
  agreement: boolean;
  selectedPetId: string;
}

const initialFormData: FormData = {
  name: '',
  phone: '',
  email: '',
  age: '',
  occupation: '',
  housingType: '',
  hasYard: false,
  petType: '',
  experience: '',
  currentPets: '',
  familyMembers: '',
  reason: '',
  agreement: false,
  selectedPetId: '',
};

export default function AdoptionForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoggedIn, addApplication } = useUserStore();
  const { pets: storePets } = usePetStore();

  const allPets = useMemo(() => [...mockPets, ...storePets], [storePets]);
  const params = new URLSearchParams(location.search);
  const petIdFromQuery = params.get('pet');
  const getSavedFormData = (): Partial<FormData> | null => {
    if (typeof window === 'undefined') {
      return null;
    }
    const saved = localStorage.getItem('adoptionFormData');
    if (!saved) {
      return null;
    }
    try {
      return JSON.parse(saved) as Partial<FormData>;
    } catch {
      console.error('Failed to parse saved form data');
      return null;
    }
  };

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState<FormData>(() => {
    const baseData = petIdFromQuery ? { ...initialFormData, selectedPetId: petIdFromQuery } : initialFormData;
    const saved = getSavedFormData();
    return saved ? { ...baseData, ...saved } : baseData;
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(() => {
    const saved = getSavedFormData();
    return saved ? new Date() : null;
  });
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

  const effectiveFormData = useMemo(() => {
    return {
      ...formData,
      selectedPetId: formData.selectedPetId || petIdFromQuery || '',
      name: formData.name || user?.name || '',
      phone: formData.phone || user?.phone || '',
    };
  }, [formData, petIdFromQuery, user?.name, user?.phone]);

  // 自动保存到本地存储
  const saveToLocalStorage = useCallback(() => {
    setIsSaving(true);
    localStorage.setItem('adoptionFormData', JSON.stringify(formData));
    setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
    }, 500);
  }, [formData]);

  useEffect(() => {
    const timer = setTimeout(saveToLocalStorage, 2000);
    return () => clearTimeout(timer);
  }, [formData, saveToLocalStorage]);

  // 计算表单完成度
  const calculateProgress = (data: FormData) => {
    const requiredFields: (keyof FormData)[] = ['name', 'phone', 'age', 'occupation', 'housingType', 'familyMembers', 'petType', 'experience', 'reason'];
    const filledFields = requiredFields.filter(field => {
      const value = data[field];
      return value && String(value).trim() !== '';
    }).length;
    return Math.round((filledFields / requiredFields.length) * 100);
  };

  // 验证表单字段
  const validateField = (field: keyof FormData, value: string | boolean): string | undefined => {
    switch (field) {
      case 'name':
        if (!value || String(value).trim() === '') return '请输入姓名';
        if (String(value).length < 2) return '姓名至少需要2个字符';
        break;
      case 'phone':
        if (!value || String(value).trim() === '') return '请输入联系电话';
        if (!/^1[3-9]\d{9}$/.test(String(value))) return '请输入有效的手机号码';
        break;
      case 'email':
        if (value && String(value).trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
          return '请输入有效的邮箱地址';
        }
        break;
      case 'age': {
        if (!value) return '请输入年龄';
        const ageNum = Number(value);
        if (isNaN(ageNum) || ageNum < 18) return '年龄必须满18周岁';
        if (ageNum > 100) return '请输入有效的年龄';
        break;
      }
      case 'occupation':
        if (!value || String(value).trim() === '') return '请输入职业';
        break;
      case 'housingType':
        if (!value) return '请选择住房类型';
        break;
      case 'familyMembers':
        if (!value || String(value).trim() === '') return '请输入家庭成员信息';
        break;
      case 'petType':
        if (!value) return '请选择想领养的宠物类型';
        break;
      case 'experience':
        if (!value) return '请选择养宠经验';
        break;
      case 'reason':
        if (!value || String(value).trim() === '') return '请填写领养原因';
        if (String(value).length < 20) return '领养原因至少需要20个字符';
        break;
    }
    return undefined;
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // 验证字段
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleBlur = (field: keyof FormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, effectiveFormData[field]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }

    // 验证所有字段
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    (Object.keys(formData) as (keyof FormData)[]).forEach(field => {
      const error = validateField(field, effectiveFormData[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));

    if (Object.keys(newErrors).length === 0) {
      try {
        const selectedId = effectiveFormData.selectedPetId;
        const petName = selectedId ? allPets.find(p => String(p.id) === String(selectedId))?.name || '未知宠物' : '未指定';
        const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        const makeUuid = () => {
          const cryptoObj = globalThis.crypto;
          if (cryptoObj && 'randomUUID' in cryptoObj && typeof cryptoObj.randomUUID === 'function') {
            return cryptoObj.randomUUID();
          }
          const hex = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
          return hex.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });
        };
        const uid = user?.id && uuidRe.test(user.id) ? user.id : makeUuid();
        const payload = {
          user_id: uid,
          pet_id: selectedId || null,
          pet_name: petName,
          name: effectiveFormData.name,
          phone: effectiveFormData.phone,
          email: effectiveFormData.email || null,
          age: Number(effectiveFormData.age),
          occupation: effectiveFormData.occupation,
          housing_type: effectiveFormData.housingType,
          has_yard: effectiveFormData.hasYard,
          pet_type: effectiveFormData.petType,
          experience: effectiveFormData.experience,
          current_pets: effectiveFormData.currentPets,
          family_members: effectiveFormData.familyMembers,
          reason: effectiveFormData.reason
        };
        const created = await submitApplication(payload);
        const application = {
          id: String(created.id),
          petId: created.pet_id || '',
          petName: created.pet_name || '未指定',
          status: created.status,
          submitDate: created.submit_date,
          updateDate: created.update_date
        } as const;
        addApplication(application);
        setSuccessId(application.id);
        localStorage.removeItem('adoptionFormData');
        setIsSubmitted(true);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : '';
        toast.error(`提交失败：${message}`);
      }
    }
  };

  const progress = calculateProgress(effectiveFormData);
  const selectedPet = effectiveFormData.selectedPetId ? allPets.find(p => String(p.id) === String(effectiveFormData.selectedPetId)) : null;

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge className="bg-orange-100 text-orange-600 hover:bg-orange-100 mb-4">
            <PawPrint className="w-3 h-3 mr-1" />
            开始领养
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
            填写
            <span className="text-gradient"> 领养申请</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            请认真填写以下信息，这将帮助我们了解你是否适合领养宠物，
            并为宠物找到最合适的家庭。
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-warm">
              <CardContent className="p-6 md:p-8">
                {/* Selected Pet Info */}
                {selectedPet && (
                  <div className="mb-6 p-4 bg-orange-50 rounded-xl flex items-center gap-4">
                    <img
                      src={selectedPet.image}
                      alt={selectedPet.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">申请领养</p>
                      <h3 className="font-bold text-gray-800">{selectedPet.name}</h3>
                      <p className="text-sm text-gray-600">{selectedPet.breed} · {selectedPet.age}</p>
                    </div>
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, selectedPetId: '' }))}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Progress Bar */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">表单完成度</span>
                    <div className="flex items-center gap-2">
                      {isSaving && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Save className="w-3 h-3 animate-pulse" />
                          保存中...
                        </span>
                      )}
                      {lastSaved && !isSaving && (
                        <span className="text-xs text-gray-400">
                          上次保存: {lastSaved.toLocaleTimeString()}
                        </span>
                      )}
                      <span className={`text-sm font-bold ${progress === 100 ? 'text-green-500' : 'text-orange-500'}`}>
                        {progress}%
                      </span>
                    </div>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-orange-500" />
                      个人信息
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">姓名 *</Label>
                        <Input
                          id="name"
                          placeholder="请输入您的姓名"
                          value={effectiveFormData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          onBlur={() => handleBlur('name')}
                          className={touched.name && errors.name ? 'border-red-500' : ''}
                        />
                        {touched.name && errors.name && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.name}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="age">年龄 *</Label>
                        <Input
                          id="age"
                          type="number"
                          placeholder="请输入您的年龄"
                          value={effectiveFormData.age}
                          onChange={(e) => handleInputChange('age', e.target.value)}
                          onBlur={() => handleBlur('age')}
                          className={touched.age && errors.age ? 'border-red-500' : ''}
                        />
                        {touched.age && errors.age && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.age}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">联系电话 *</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="请输入联系电话"
                            className={`pl-10 ${touched.phone && errors.phone ? 'border-red-500' : ''}`}
                            value={effectiveFormData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            onBlur={() => handleBlur('phone')}
                          />
                        </div>
                        {touched.phone && errors.phone && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.phone}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">电子邮箱</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="请输入电子邮箱"
                            className={`pl-10 ${touched.email && errors.email ? 'border-red-500' : ''}`}
                            value={effectiveFormData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            onBlur={() => handleBlur('email')}
                          />
                        </div>
                        {touched.email && errors.email && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.email}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="occupation">职业 *</Label>
                        <Input
                          id="occupation"
                          placeholder="请输入您的职业"
                          value={effectiveFormData.occupation}
                          onChange={(e) => handleInputChange('occupation', e.target.value)}
                          onBlur={() => handleBlur('occupation')}
                          className={touched.occupation && errors.occupation ? 'border-red-500' : ''}
                        />
                        {touched.occupation && errors.occupation && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.occupation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100" />

                  {/* Housing Information */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Home className="w-5 h-5 text-orange-500" />
                      居住情况
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>住房类型 *</Label>
                        <Select
                          value={effectiveFormData.housingType}
                          onValueChange={(value) => handleInputChange('housingType', value)}
                        >
                          <SelectTrigger className={touched.housingType && errors.housingType ? 'border-red-500' : ''}>
                            <SelectValue placeholder="请选择住房类型" />
                          </SelectTrigger>
                          <SelectContent>
                            {housingTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {touched.housingType && errors.housingType && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.housingType}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>家庭成员 *</Label>
                        <Input
                          placeholder="如：夫妻+1个孩子"
                          value={effectiveFormData.familyMembers}
                          onChange={(e) => handleInputChange('familyMembers', e.target.value)}
                          onBlur={() => handleBlur('familyMembers')}
                          className={touched.familyMembers && errors.familyMembers ? 'border-red-500' : ''}
                        />
                        {touched.familyMembers && errors.familyMembers && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.familyMembers}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center space-x-2">
                      <Checkbox
                        id="hasYard"
                        checked={effectiveFormData.hasYard}
                        onCheckedChange={(checked) => handleInputChange('hasYard', checked === true)}
                      />
                      <Label htmlFor="hasYard" className="font-normal cursor-pointer">
                        有独立院子或阳台
                      </Label>
                    </div>
                  </div>

                  <div className="border-t border-gray-100" />

                  {/* Pet Preference */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <PawPrint className="w-5 h-5 text-orange-500" />
                      宠物偏好
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>想领养的宠物类型 *</Label>
                        <Select
                          value={effectiveFormData.petType}
                          onValueChange={(value) => handleInputChange('petType', value)}
                        >
                          <SelectTrigger className={touched.petType && errors.petType ? 'border-red-500' : ''}>
                            <SelectValue placeholder="请选择宠物类型" />
                          </SelectTrigger>
                          <SelectContent>
                            {petTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {touched.petType && errors.petType && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.petType}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>养宠经验 *</Label>
                        <Select
                          value={effectiveFormData.experience}
                          onValueChange={(value) => handleInputChange('experience', value)}
                        >
                          <SelectTrigger className={touched.experience && errors.experience ? 'border-red-500' : ''}>
                            <SelectValue placeholder="请选择养宠经验" />
                          </SelectTrigger>
                          <SelectContent>
                            {experienceLevels.map((level) => (
                              <SelectItem key={level.value} value={level.value}>
                                {level.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {touched.experience && errors.experience && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.experience}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="currentPets">目前是否养有其他宠物</Label>
                      <Textarea
                        id="currentPets"
                        placeholder="如有，请说明宠物种类、年龄、性格等"
                        value={effectiveFormData.currentPets}
                        onChange={(e) => handleInputChange('currentPets', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-100" />

                  {/* Additional Information */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-orange-500" />
                      其他信息
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="reason">领养原因及承诺 *</Label>
                      <Textarea
                        id="reason"
                        placeholder="请说明您想领养宠物的原因，以及您将如何照顾它..."
                        rows={4}
                        value={effectiveFormData.reason}
                        onChange={(e) => handleInputChange('reason', e.target.value)}
                        onBlur={() => handleBlur('reason')}
                        className={touched.reason && errors.reason ? 'border-red-500' : ''}
                      />
                      <div className="flex justify-between">
                        {touched.reason && errors.reason ? (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.reason}
                          </p>
                        ) : (
                          <span />
                        )}
                        <span className="text-xs text-gray-400">
                          {effectiveFormData.reason.length} 字符
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Agreement */}
                  <div className="flex items-start space-x-3 p-4 bg-orange-50 rounded-xl">
                    <Checkbox
                      id="agreement"
                      checked={effectiveFormData.agreement}
                      onCheckedChange={(checked) => handleInputChange('agreement', checked === true)}
                      className="mt-1"
                    />
                    <div>
                      <Label htmlFor="agreement" className="font-medium cursor-pointer">
                        我同意领养协议 *
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        我承诺不遗弃、不转卖宠物，愿意接受定期回访，并为宠物提供良好的生活环境和医疗照顾。
                      </p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full transition-all hover:scale-[1.02]"
                    disabled={!effectiveFormData.agreement || progress < 100}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {progress < 100 ? `请完善信息 (${progress}%)` : '提交申请'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <Card className="border-0 shadow-warm bg-gradient-to-br from-orange-500 to-amber-500 text-white">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4">联系我们</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm text-white/80">咨询热线</div>
                      <div className="font-medium">400-888-9999</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm text-white/80">电子邮箱</div>
                      <div className="font-medium">adopt@petcenter.com</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm text-white/80">中心地址</div>
                      <div className="font-medium">北京市朝阳区宠物街88号</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-warm">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  工作时间
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">周一至周五</span>
                    <span className="font-medium">9:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">周六至周日</span>
                    <span className="font-medium">10:00 - 17:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">节假日</span>
                    <span className="font-medium">10:00 - 16:00</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-warm bg-amber-50">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-2">温馨提示</h3>
                <ul className="text-sm text-gray-600 leading-relaxed space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    表单会自动保存，您可以随时回来继续填写
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    提交后工作人员会在3个工作日内与您联系
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    请保持电话畅通，以便我们及时联系您
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Login Prompt Dialog */}
      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">
              请先登录
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <p className="text-gray-600 mb-6">
              提交领养申请需要先登录账号
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowLoginPrompt(false)}
                className="flex-1 rounded-full"
              >
                稍后再说
              </Button>
              <Button
                onClick={() => {
                  setShowLoginPrompt(false);
                  navigate('/login');
                }}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-full"
              >
                去登录
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={isSubmitted} onOpenChange={setIsSubmitted}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800">
              申请提交成功！
            </DialogTitle>
          </DialogHeader>

          <div className="py-6">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>

            <p className="text-gray-600 mb-6">
              感谢您选择领养！我们已收到您的申请，工作人员会在3个工作日内与您联系。
            </p>

            <div className="bg-orange-50 rounded-xl p-4 mb-6">
              <div className="text-sm text-gray-600 mb-2">申请编号</div>
              <div className="text-2xl font-bold text-orange-500">
                {successId ? `AD${successId.toString().slice(-8)}` : 'ADXXXXXXXX'}
              </div>
            </div>

            <div className="text-sm text-gray-500 mb-6">
              您可以截图保存申请编号，方便后续查询
            </div>

            <Button
              onClick={() => {
                setIsSubmitted(false);
                setFormData(initialFormData);
                navigate('/profile');
              }}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full"
            >
              查看我的申请
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

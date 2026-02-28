import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import type { AdoptionApplication, Booking } from '@/store/userStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { RefreshCcw, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import {
    fetchApplications,
    fetchBookings,
    API_BASE
} from '@/services/api';

const withTimeout = async <T,>(promise: Promise<T>, ms: number) => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('请求超时')), ms);
    });
    try {
        return await Promise.race([promise, timeout]);
    } finally {
        if (timer) clearTimeout(timer);
    }
};

const getErrorMessage = (error: unknown) => {
    return error instanceof Error ? error.message : '';
};

export function SmsAuthForm() {
    const navigate = useNavigate();
    const { login, setApplications, setBookings, setTokens } = useUserStore();
    const [isLoading, setIsLoading] = useState(false);

    // ───── SMS OTP form ─────
    const [smsPhone, setSmsPhone] = useState('');
    const [smsCode, setSmsCode] = useState('');
    const [smsCountdown, setSmsCountdown] = useState(0);
    const [smsSending, setSmsSending] = useState(false);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Cleanup timers on unmount
    useEffect(() => () => {
        if (countdownRef.current) clearInterval(countdownRef.current);
    }, []);

    // ───── Load user data ─────
    const loadUserData = async (userId: string) => {
        try {
            const [apps, bks] = await Promise.all([
                fetchApplications(userId),
                fetchBookings(userId)
            ]);
            if (Array.isArray(apps)) {
                const mapped = apps
                    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
                    .map((item) => {
                        const statusValue = typeof item.status === 'string' ? item.status : 'pending';
                        return {
                            id: String(item.id ?? ''),
                            petId: typeof item.pet_id === 'number' ? item.pet_id : 0,
                            petName: typeof item.pet_name === 'string' ? item.pet_name : '未指定',
                            status: statusValue as AdoptionApplication['status'],
                            submitDate: typeof item.submit_date === 'string' ? item.submit_date : '',
                            updateDate: typeof item.update_date === 'string' ? item.update_date : '',
                            notes: typeof item.notes === 'string' ? item.notes : undefined
                        } satisfies AdoptionApplication;
                    });
                setApplications(mapped);
            }
            if (Array.isArray(bks)) {
                const mapped = bks
                    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
                    .map((item) => {
                        const statusValue = typeof item.status === 'string' ? item.status : 'pending';
                        return {
                            id: String(item.id ?? ''),
                            petId: typeof item.pet_id === 'number' ? item.pet_id : 0,
                            petName: typeof item.pet_name === 'string' ? item.pet_name : '未指定',
                            date: typeof item.date === 'string' ? item.date : '',
                            time: typeof item.time === 'string' ? item.time : '',
                            status: statusValue as Booking['status']
                        } satisfies Booking;
                    });
                setBookings(mapped);
            }
        } catch {
            // silently ignore
        }
    };

    // ───── SMS: Send OTP ─────
    const handleSendOtp = async () => {
        const phone = smsPhone.replace(/\D/g, '');
        if (smsCountdown > 0 || !phone || smsSending) return;

        if (!/^1[3-9]\d{9}$/.test(phone)) {
            toast.error('请输入正确的手机号');
            return;
        }

        setSmsSending(true);
        try {
            const res = await fetch(`${API_BASE}/api/auth/send-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.message || '发送失败');

            toast.success('验证码已发送');
            setSmsCountdown(60);
            countdownRef.current = setInterval(() => {
                setSmsCountdown(prev => {
                    if (prev <= 1) {
                        if (countdownRef.current) clearInterval(countdownRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (err: any) {
            toast.error(err.message || '发送失败，请重试');
        } finally {
            setSmsSending(false);
        }
    };

    // ───── SMS: Verify OTP ─────
    const handleSmsLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const phone = smsPhone.replace(/\D/g, '');
        const code = smsCode;
        if (!phone || !code) {
            toast.error('请输入手机号和验证码');
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/auth/login-by-phone`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, code })
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.message || '登录失败');

            // Integration with UserStore (existing standard)
            setTokens({
                accessToken: data.token,
                refreshToken: data.token,
                expiresIn: 7 * 24 * 60 * 60
            });

            const userId = data.user.id;
            login({
                id: userId,
                name: data.user.username,
                phone: data.user.phone,
                role: data.user.role,
                status: 'active'
            });

            // As specifically requested by the instruction snippet
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            await loadUserData(userId);
            toast.success('登录成功');
            navigate('/');
        } catch (err: any) {
            toast.error(err.message || '登录失败');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSmsLogin} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="sms-phone" className="text-gray-700 font-medium">手机号</Label>
                <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100 group-focus-within:border-orange-200 transition-colors">
                        <span className="text-sm font-semibold">+86</span>
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                    </div>
                    <Input
                        id="sms-phone"
                        type="tel"
                        placeholder="请输入手机号"
                        value={smsPhone}
                        maxLength={11}
                        onChange={(e) => setSmsPhone(e.target.value.replace(/\D/g, ''))}
                        className="pl-20 pr-32 h-12 rounded-xl border-gray-200 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 font-medium transition-all"
                            disabled={smsSending || smsCountdown > 0}
                            onClick={handleSendOtp}
                        >
                            {smsSending ? (
                                <RefreshCcw className="w-4 h-4 animate-spin" />
                            ) : smsCountdown > 0 ? (
                                `${smsCountdown}s`
                            ) : (
                                '获取验证码'
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <Label className="text-gray-700 font-medium">验证码</Label>
                <div className="flex justify-center">
                    <InputOTP
                        maxLength={6}
                        value={smsCode}
                        onChange={(value) => setSmsCode(value)}
                        className="gap-2"
                    >
                        <InputOTPGroup className="gap-2">
                            <InputOTPSlot index={0} className="w-12 h-12 rounded-xl border-gray-200" />
                            <InputOTPSlot index={1} className="w-12 h-12 rounded-xl border-gray-200" />
                            <InputOTPSlot index={2} className="w-12 h-12 rounded-xl border-gray-200" />
                            <InputOTPSlot index={3} className="w-12 h-12 rounded-xl border-gray-200" />
                            <InputOTPSlot index={4} className="w-12 h-12 rounded-xl border-gray-200" />
                            <InputOTPSlot index={5} className="w-12 h-12 rounded-xl border-gray-200" />
                        </InputOTPGroup>
                    </InputOTP>
                </div>
            </div>

            <div className="pt-4">
                <Button
                    type="submit"
                    className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-md shadow-orange-200 transition-all font-bold text-base"
                    disabled={isLoading || smsCode.length < 6}
                >
                    {isLoading ? '登录中...' : '登录 / 注册'}
                </Button>
                <p className="text-xs text-center text-gray-400 mt-4">
                    未注册的手机号将自动创建账号
                </p>
            </div>
        </form>
    );
}

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import type { AdoptionApplication, Booking } from '@/store/userStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Mail, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import {
    getCaptcha,
    registerEmail as apiRegisterEmail,
    loginEmail as apiLoginEmail,
    fetchApplications,
    fetchBookings,
    checkEmailExists
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

export function EmailAuthForm() {
    const navigate = useNavigate();
    const { login, setApplications, setBookings, setTokens } = useUserStore();
    const [isLoading, setIsLoading] = useState(false);
    const strongPwd = (pwd: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(pwd);

    // ───── Login form ─────
    const [showEmailRegister, setShowEmailRegister] = useState(false);
    const [loginEmailAddr, setLoginEmailAddr] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // ───── Register form ─────
    const [registerEmailAddr, setRegisterEmailAddr] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerConfirm, setRegisterConfirm] = useState('');
    const [captcha, setCaptcha] = useState<{ id: string; svg: string } | null>(null);
    const [captchaAnswer, setCaptchaAnswer] = useState('');
    const [captchaLoading, setCaptchaLoading] = useState(false);
    const [captchaError, setCaptchaError] = useState('');

    // ───── Email uniqueness check ─────
    const [emailError, setEmailError] = useState('');
    const [emailChecking, setEmailChecking] = useState(false);
    const emailDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const triggerEmailCheck = useCallback((email: string) => {
        if (emailDebounceRef.current) clearTimeout(emailDebounceRef.current);
        const trimmed = email.trim().toLowerCase();
        if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
            setEmailError('');
            setEmailChecking(false);
            return;
        }
        setEmailChecking(true);
        emailDebounceRef.current = setTimeout(async () => {
            try {
                const exists = await checkEmailExists(trimmed);
                setEmailError(exists ? '该邮箱已被注册，请直接登录' : '');
            } catch {
                setEmailError('');
            } finally {
                setEmailChecking(false);
            }
        }, 500);
    }, []);

    // Cleanup timers on unmount
    useEffect(() => () => {
        if (emailDebounceRef.current) clearTimeout(emailDebounceRef.current);
    }, []);

    useEffect(() => {
        setCaptchaLoading(true);
        getCaptcha()
            .then((c) => {
                setCaptcha(c);
                setCaptchaError('');
            })
            .catch(() => {
                setCaptcha(null);
                setCaptchaError('验证码加载失败，请点击刷新');
            })
            .finally(() => setCaptchaLoading(false));
    }, []);

    const refreshCaptcha = async () => {
        setCaptchaLoading(true);
        setCaptchaError('');
        try {
            const c = await getCaptcha();
            setCaptcha(c);
            setCaptchaAnswer('');
        } catch {
            setCaptcha(null);
            setCaptchaError('验证码加载失败，请点击刷新');
        } finally {
            setCaptchaLoading(false);
        }
    };

    useEffect(() => {
        if (showEmailRegister) {
            void refreshCaptcha();
        }
    }, [showEmailRegister]);

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

    // ───── Email Login ─────
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loginEmailAddr || !loginPassword) { toast.error('请填写邮箱和密码'); return; }
        setIsLoading(true);
        try {
            const j = await withTimeout(apiLoginEmail({ email: loginEmailAddr, password: loginPassword }), 20000);
            if (j.code !== 0) throw new Error(j.msg || '登录失败');
            if (j.data?.access_token && j.data?.refresh_token && j.data?.expires_in) {
                setTokens({
                    accessToken: j.data.access_token,
                    refreshToken: j.data.refresh_token,
                    expiresIn: j.data.expires_in
                });
            }
            const userData = j.data?.user;
            const userId = userData?.id || j.data?.sub || 'me';
            login({
                id: userId,
                name: userData?.name || loginEmailAddr.split('@')[0],
                phone: userData?.phone || '',
                email: userData?.email || loginEmailAddr,
                role: userData?.role,
                status: userData?.status,
                avatar: userData?.avatar
            });
            await loadUserData(userId);
            toast.success('登录成功');
            navigate('/profile');
        } catch (e: unknown) {
            toast.error(getErrorMessage(e) || '登录失败');
        } finally {
            setIsLoading(false);
        }
    };

    // ───── Email Register ─────
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!registerEmailAddr || !registerPassword || !registerConfirm || !captcha || !captchaAnswer) {
            toast.error('请填写完整信息');
            return;
        }
        if (registerPassword !== registerConfirm) { toast.error('两次输入的密码不一致'); return; }
        if (!strongPwd(registerPassword)) { toast.error('密码至少8位，且需包含大小写字母和数字'); return; }
        setIsLoading(true);
        try {
            const j = await withTimeout(apiRegisterEmail({
                email: registerEmailAddr,
                password: registerPassword,
                captcha_id: captcha!.id,
                captcha_answer: captchaAnswer
            }), 20000);
            if (j.code !== 0) throw new Error(j.msg || '注册失败');
            if (j.data?.access_token && j.data?.refresh_token && j.data?.expires_in) {
                setTokens({
                    accessToken: j.data.access_token,
                    refreshToken: j.data.refresh_token,
                    expiresIn: j.data.expires_in
                });
            }
            const l = await withTimeout(apiLoginEmail({ email: registerEmailAddr, password: registerPassword }), 20000);
            if (l.code === 0) {
                if (l.data?.access_token && l.data?.refresh_token && l.data?.expires_in) {
                    setTokens({
                        accessToken: l.data.access_token,
                        refreshToken: l.data.refresh_token,
                        expiresIn: l.data.expires_in
                    });
                }
                const userId = l.data?.user?.id || j.data?.user?.id || l.data?.sub || 'me';
                login({ id: userId, name: registerEmailAddr.split('@')[0], phone: '', email: registerEmailAddr });
                await loadUserData(userId);
                toast.success('注册成功');
                navigate('/profile');
                return;
            }
            toast.success('注册成功，请登录');
            setShowEmailRegister(false);
        } catch (e: unknown) {
            toast.error(getErrorMessage(e) || '注册失败');
        } finally {
            setIsLoading(false);
        }
    };

    if (showEmailRegister) {
        return (
            <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="register-email">邮箱</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            id="register-email"
                            type="email"
                            placeholder="请输入邮箱地址"
                            value={registerEmailAddr}
                            onChange={(e) => {
                                setRegisterEmailAddr(e.target.value);
                                triggerEmailCheck(e.target.value);
                            }}
                            onBlur={() => triggerEmailCheck(registerEmailAddr)}
                            className={`pl-10 h-11 rounded-xl ${emailError ? 'border-red-500 focus-visible:ring-red-300' : ''}`}
                        />
                    </div>
                    {emailChecking && (
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                            <RefreshCcw className="w-3 h-3 animate-spin" />
                            正在检查邮箱...
                        </p>
                    )}
                    {emailError && !emailChecking && (
                        <p className="text-xs text-red-500">{emailError}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="register-pass">密码</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            id="register-pass"
                            type="password"
                            placeholder="至少8位，包含大小写字母和数字"
                            value={registerPassword}
                            onChange={(e) => setRegisterPassword(e.target.value)}
                            className="pl-10 h-11 rounded-xl"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="register-confirm">确认密码</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            id="register-confirm"
                            type="password"
                            placeholder="再次输入密码"
                            value={registerConfirm}
                            onChange={(e) => setRegisterConfirm(e.target.value)}
                            className="pl-10 h-11 rounded-xl"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={refreshCaptcha}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') refreshCaptcha();
                        }}
                        className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-100"
                    >
                        {captcha?.svg ? (
                            <div
                                className="h-9 min-w-[100px] flex items-center justify-center"
                                dangerouslySetInnerHTML={{ __html: captcha.svg }}
                            />
                        ) : captchaLoading ? (
                            <div className="h-9 min-w-[100px] flex items-center justify-center text-xs text-gray-400">
                                加载中...
                            </div>
                        ) : (
                            <div className="h-9 min-w-[100px] flex items-center justify-center text-xs text-gray-400">
                                {captchaError || '点击刷新'}
                            </div>
                        )}
                        <Button type="button" variant="ghost" size="sm" onClick={refreshCaptcha} className="h-8 w-8 p-0">
                            <RefreshCcw className="w-4 h-4 text-gray-500" />
                        </Button>
                    </div>
                    <Input placeholder="验证码" value={captchaAnswer} onChange={(e) => setCaptchaAnswer(e.target.value)} className="h-11 rounded-xl" />
                </div>

                <Button
                    type="submit"
                    className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-md shadow-orange-200 transition-all"
                    disabled={isLoading || !!emailError || emailChecking}
                >
                    {isLoading ? '注册中...' : '立即注册'}
                </Button>
                <div className="text-center">
                    <button type="button" onClick={() => setShowEmailRegister(false)} className="text-sm text-gray-500 hover:text-orange-600">
                        已有账号？去登录
                    </button>
                </div>
            </form>
        );
    }

    return (
        <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
                <Label htmlFor="login-email">邮箱</Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        id="login-email"
                        type="email"
                        placeholder="请输入邮箱地址"
                        value={loginEmailAddr}
                        onChange={(e) => setLoginEmailAddr(e.target.value)}
                        className="pl-10 h-11 rounded-xl border-gray-200"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label htmlFor="login-pass">密码</Label>
                    <a href="/forgot-password" className="text-xs text-gray-400 hover:text-orange-600 transition-colors">忘记密码？</a>
                </div>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        id="login-pass"
                        type="password"
                        placeholder="请输入密码"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10 h-11 rounded-xl border-gray-200"
                    />
                </div>
            </div>

            <div className="pt-2">
                <Button
                    type="submit"
                    className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-md shadow-orange-200 transition-all font-bold"
                    disabled={isLoading}
                >
                    {isLoading ? '登录中...' : '登录'}
                </Button>
            </div>
            <div className="text-center">
                <span className="text-sm text-gray-400">目前还没有账号？</span>
                <button type="button" onClick={() => setShowEmailRegister(true)} className="text-sm text-orange-600 font-medium hover:underline ml-1">
                    立即注册
                </button>
            </div>
        </form>
    );
}

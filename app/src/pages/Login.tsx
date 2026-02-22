import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import type { AdoptionApplication, Booking } from '@/store/userStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { User, Lock, Mail, RefreshCcw, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import {
  getCaptcha,
  registerEmail as apiRegisterEmail,
  loginEmail as apiLoginEmail,
  fetchApplications,
  fetchBookings,
  checkEmailExists,
  sendSmsOtp as apiSendSmsOtp,
  verifySmsOtp as apiVerifySmsOtp
} from '@/services/api';

export default function Login() {
  const navigate = useNavigate();
  const { login, setApplications, setBookings } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const strongPwd = (pwd: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(pwd);

  // ───── Login form ─────
  const [loginEmailAddr, setLoginEmailAddr] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // ───── Register form (for email if needed separately, but we'll use a link) ─────
  const [showEmailRegister, setShowEmailRegister] = useState(false);
  const [registerEmailAddr, setRegisterEmailAddr] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirm, setRegisterConfirm] = useState('');
  const [captcha, setCaptcha] = useState<{ id: string; svg: string } | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  // ───── SMS OTP form ─────
  const [smsPhone, setSmsPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [smsCountdown, setSmsCountdown] = useState(0);
  const [smsSending, setSmsSending] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ───── Email uniqueness check ─────
  const [emailError, setEmailError] = useState('');
  const [emailChecking, setEmailChecking] = useState(false);
  const emailDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const getErrorMessage = (error: unknown) => {
    return error instanceof Error ? error.message : '';
  };

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
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  useEffect(() => {
    getCaptcha().then(setCaptcha).catch(() => { });
  }, []);

  const refreshCaptcha = async () => {
    const c = await getCaptcha();
    setCaptcha(c);
    setCaptchaAnswer('');
  };

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
      const j = await apiLoginEmail({ email: loginEmailAddr, password: loginPassword });
      if (j.code !== 0) throw new Error(j.msg || '登录失败');
      const userId = j.data?.user?.id || j.data?.sub || 'me';
      login({ id: userId, name: loginEmailAddr.split('@')[0], phone: '', email: loginEmailAddr });
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
      const j = await apiRegisterEmail({
        email: registerEmailAddr,
        password: registerPassword,
        captcha_id: captcha!.id,
        captcha_answer: captchaAnswer
      });
      if (j.code !== 0) throw new Error(j.msg || '注册失败');
      const l = await apiLoginEmail({ email: registerEmailAddr, password: registerPassword });
      if (l.code === 0) {
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

  // ───── SMS: Send OTP ─────
  const handleSendOtp = async () => {
    const phoneDigits = smsPhone.replace(/\D/g, '');
    if (!/^1[3-9]\d{9}$/.test(phoneDigits)) {
      toast.error('请输入正确的11位手机号');
      return;
    }
    setSmsSending(true);
    try {
      const j = await apiSendSmsOtp(phoneDigits);
      if (j.code !== 0) throw new Error(j.msg || '发送失败');
      toast.success('验证码已发送');
      // Start 60s countdown
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
    } catch (e: unknown) {
      toast.error(getErrorMessage(e) || '短信发送失败');
    } finally {
      setSmsSending(false);
    }
  };

  // ───── SMS: Verify OTP ─────
  const handleSmsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneDigits = smsPhone.replace(/\D/g, '');
    if (!phoneDigits || smsCode.length < 6) {
      toast.error('请输入手机号和6位验证码');
      return;
    }
    setIsLoading(true);
    try {
      const j = await apiVerifySmsOtp(phoneDigits, smsCode);
      if (j.code !== 0) throw new Error(j.msg || '验证失败');
      const userId = j.data?.user?.id || 'me';
      const phone = j.data?.user?.phone || phoneDigits;
      const email = j.data?.user?.email || '';
      login({
        id: userId,
        name: email ? email.split('@')[0] : '手机用户' + phoneDigits.slice(-4),
        phone,
        email
      });
      await loadUserData(userId);
      toast.success('登录成功');
      navigate('/profile');
    } catch (e: unknown) {
      toast.error(getErrorMessage(e) || '验证失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-gradient flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-none">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
              <User className="w-8 h-8 text-orange-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">欢迎来到宠物领养中心</h1>
            <p className="text-gray-500 mt-2">登录后管理您的收藏和申请</p>
          </div>

          <Tabs defaultValue="sms" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100/50 p-1 rounded-xl">
              <TabsTrigger value="sms" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">手机号登录/注册</TabsTrigger>
              <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">账号密码登录</TabsTrigger>
            </TabsList>

            {/* ───── 手机号登录/注册 Tab ───── */}
            <TabsContent value="sms" className="space-y-6">
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
            </TabsContent>

            {/* ───── 账号密码登录 Tab ───── */}
            <TabsContent value="login">
              {showEmailRegister ? (
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
                    <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-100">
                      <div className="h-9 min-w-[100px] flex items-center justify-center" dangerouslySetInnerHTML={{ __html: captcha?.svg || '' }} />
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
              ) : (
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
                      <a href="/forgot-password" icon-className="text-xs text-gray-400 hover:text-orange-600 transition-colors">忘记密码？</a>
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
              )}
            </TabsContent>
          </Tabs>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-gray-400 hover:text-orange-600 transition-colors flex items-center justify-center gap-1 mx-auto"
            >
              暂不登录，先逛逛
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

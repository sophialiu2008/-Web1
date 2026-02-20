import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import type { AdoptionApplication, Booking } from '@/store/userStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Lock, Mail, RefreshCcw } from 'lucide-react';
import { getCaptcha, registerEmail as apiRegisterEmail, loginEmail as apiLoginEmail, fetchApplications, fetchBookings, checkEmailExists } from '@/services/api';

export default function Login() {
  const navigate = useNavigate();
  const { login, setApplications, setBookings } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const strongPwd = (pwd: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(pwd);

  // Login form
  const [loginEmailAddr, setLoginEmailAddr] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [registerEmailAddr, setRegisterEmailAddr] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirm, setRegisterConfirm] = useState('');
  const [captcha, setCaptcha] = useState<{ id: string; svg: string } | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  // Email uniqueness check
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

  // Cleanup debounce timer on unmount
  useEffect(() => () => {
    if (emailDebounceRef.current) clearTimeout(emailDebounceRef.current);
  }, []);

  useEffect(() => {
    getCaptcha().then(setCaptcha).catch(() => { });
  }, []);
  const refreshCaptcha = async () => {
    const c = await getCaptcha();
    setCaptcha(c);
    setCaptchaAnswer('');
  };


  const loadUserData = async (userId: string) => {
    try {
      const [apps, bks] = await Promise.all([
        fetchApplications(userId),
        fetchBookings(userId)
      ]);
      if (Array.isArray(apps)) {
        setApplications(apps.map((a: any) => ({
          id: String(a.id),
          petId: a.pet_id || 0,
          petName: a.pet_name || '未指定',
          status: a.status,
          submitDate: a.submit_date,
          updateDate: a.update_date,
          notes: a.notes
        } as AdoptionApplication)));
      }
      if (Array.isArray(bks)) {
        setBookings(bks.map((b: any) => ({
          id: String(b.id),
          petId: b.pet_id || 0,
          petName: b.pet_name || '未指定',
          date: b.date,
          time: b.time,
          status: b.status
        } as Booking)));
      }
    } catch {
      // silently ignore fetch errors, data will be empty
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmailAddr || !loginPassword) { alert('请填写邮箱和密码'); return; }
    setIsLoading(true);
    try {
      const j = await apiLoginEmail({ email: loginEmailAddr, password: loginPassword });
      if (j.code !== 0) throw new Error(j.msg || '登录失败');
      const userId = j.data?.user?.id || j.data?.sub || 'me';
      login({ id: userId, name: loginEmailAddr.split('@')[0], phone: '', email: loginEmailAddr });
      await loadUserData(userId);
      setIsLoading(false);
      navigate('/profile');
    } catch (e: any) {
      setIsLoading(false);
      alert(e?.message || '登录失败');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerEmailAddr || !registerPassword || !registerConfirm || !captcha || !captchaAnswer) { alert('请填写完整信息'); return; }
    if (registerPassword !== registerConfirm) { alert('两次输入的密码不一致'); return; }
    if (!strongPwd(registerPassword)) { alert('密码至少8位，且需包含大小写字母和数字'); return; }
    setIsLoading(true);
    try {
      const j = await apiRegisterEmail({ email: registerEmailAddr, password: registerPassword, captcha_id: captcha!.id, captcha_answer: captchaAnswer });
      if (j.code !== 0) throw new Error(j.msg || '注册失败');
      // 自动登录
      const l = await apiLoginEmail({ email: registerEmailAddr, password: registerPassword });
      if (l.code === 0) {
        const userId = l.data?.user?.id || j.data?.user?.id || l.data?.sub || 'me';
        login({ id: userId, name: registerEmailAddr.split('@')[0], phone: '', email: registerEmailAddr });
        await loadUserData(userId);
        navigate('/profile');
        setIsLoading(false);
        return;
      }
      // 或者跳转登录
      alert('注册成功，请登录');
      navigate('/login');
      setIsLoading(false);
    } catch (e: any) {
      setIsLoading(false);
      alert(e?.message || '注册失败');
    }
  };

  return (
    <div className="min-h-screen bg-warm-gradient flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
              <User className="w-8 h-8 text-orange-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">欢迎来到宠物领养中心</h1>
            <p className="text-gray-500 mt-2">登录后管理您的收藏和申请</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">登录</TabsTrigger>
              <TabsTrigger value="register">注册</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
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
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-pass">密码</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="login-pass"
                      type="password"
                      placeholder="请输入密码"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full"
                  disabled={isLoading}
                >
                  {isLoading ? '登录中...' : '登录'}
                </Button>
                <div className="text-right">
                  <a href="/forgot-password" className="text-sm text-gray-500 hover:text-orange-500">忘记密码</a>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="register">
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
                      className={`pl-10 ${emailError ? 'border-red-500 focus-visible:ring-red-300' : ''}`}
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
                      className="pl-10"
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
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* 邮箱验证码环节已去除 */}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div dangerouslySetInnerHTML={{ __html: captcha?.svg || '' }} />
                    <Button type="button" variant="ghost" onClick={refreshCaptcha}>
                      <RefreshCcw className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="w-40">
                    <Input placeholder="输入上图验证码" value={captchaAnswer} onChange={(e) => setCaptchaAnswer(e.target.value)} />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full"
                  disabled={isLoading || !!emailError || emailChecking}
                >
                  {isLoading ? '注册中...' : '注册'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-gray-500 hover:text-orange-500"
            >
              暂不登录，先逛逛
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

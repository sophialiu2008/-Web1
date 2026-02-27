import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User } from 'lucide-react';
import { SmsAuthForm } from './Auth/SmsAuthForm';
import { EmailAuthForm } from './Auth/EmailAuthForm';

export default function Login() {
  const navigate = useNavigate();

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
              <SmsAuthForm />
            </TabsContent>

            {/* ───── 账号密码登录 Tab ───── */}
            <TabsContent value="login">
              <EmailAuthForm />
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

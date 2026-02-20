import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Lock, Eye, Trash2, Mail } from 'lucide-react';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-warm-gradient">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-orange-500 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            返回
          </button>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Shield className="w-8 h-8 text-orange-500" />
            隐私政策
          </h1>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-warm p-8">
          <p className="text-gray-600 mb-8">
            宠物领养中心（以下简称"我们"）非常重视用户的隐私保护。本隐私政策说明了我们如何收集、使用和保护您的个人信息。
            最后更新日期：2024年2月
          </p>

          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-orange-500" />
                信息收集
              </h2>
              <p className="text-gray-600 mb-4">
                我们可能收集以下类型的信息：
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li><strong>个人信息：</strong>姓名、手机号码、电子邮箱等</li>
                <li><strong>领养申请信息：</strong>家庭情况、养宠经验、居住环境等</li>
                <li><strong>使用数据：</strong>浏览记录、搜索记录、收藏记录等</li>
                <li><strong>设备信息：</strong>IP地址、浏览器类型、操作系统等</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-orange-500" />
                信息使用
              </h2>
              <p className="text-gray-600 mb-4">
                我们使用收集的信息用于：
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>处理领养申请和预约请求</li>
                <li>提供客户服务和售后支持</li>
                <li>改进网站功能和用户体验</li>
                <li>发送领养相关的通知和更新</li>
                <li>进行数据分析和研究</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-500" />
                信息保护
              </h2>
              <p className="text-gray-600">
                我们采取多种安全措施保护您的个人信息，包括数据加密、访问控制、安全审计等。
                我们承诺不会将您的个人信息出售或出租给第三方。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-orange-500" />
                数据删除
              </h2>
              <p className="text-gray-600">
                您有权要求删除您的个人数据。如需删除账户和相关数据，请联系我们的客服团队。
                请注意，某些数据可能因法律要求需要保留一段时间。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-orange-500" />
                联系我们
              </h2>
              <p className="text-gray-600">
                如果您对隐私政策有任何疑问，请通过以下方式联系我们：
              </p>
              <div className="mt-4 p-4 bg-orange-50 rounded-xl">
                <p className="text-gray-600">邮箱：privacy@petcenter.com</p>
                <p className="text-gray-600">电话：400-888-9999</p>
                <p className="text-gray-600">地址：北京市朝阳区宠物街88号</p>
              </div>
            </section>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-100 text-center">
            <Button
              onClick={() => navigate('/')}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-full"
            >
              返回首页
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

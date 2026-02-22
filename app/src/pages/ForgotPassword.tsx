import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail } from 'lucide-react'
import { forgotPassword } from '@/services/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('按钮被点击了，准备发送邮件到:', email)

    // 邮箱格式校验
    const trimmed = email.trim()
    if (!trimmed) {
      setError('请输入邮箱地址')
      console.log('校验失败：邮箱为空')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('请输入有效的邮箱地址')
      console.log('校验失败：邮箱格式无效')
      return
    }

    setError('')
    setLoading(true)
    console.log('开始调用 forgotPassword API...')

    try {
      const r = await forgotPassword({ email: trimmed })
      console.log('API 返回结果:', JSON.stringify(r))
      if (r.code === 0) {
        console.log('发送成功，切换到成功提示')
        setSent(true)
      } else {
        const msg = r.msg || '发送失败'
        console.error('API 返回错误:', msg)
        setError(msg)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('请求异常:', msg)
      setError(`请求失败: ${msg}`)
    } finally {
      setLoading(false)
      console.log('请求结束，loading 设为 false')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>找回密码</CardTitle>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4">
              <p className="text-gray-600">如果该邮箱存在，我们已发送重置链接到您的邮箱。请在1小时内完成操作。</p>
              <p className="text-sm text-gray-500">请同时检查您的垃圾邮件文件夹。</p>
              <Button className="w-full" onClick={() => navigate('/login')}>返回登录</Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">邮箱</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="请输入注册邮箱"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError('') }}
                    className={`pl-10 ${error ? 'border-red-500' : ''}`}
                    required
                  />
                </div>
                {error && (
                  <p className="text-xs text-red-500">{error}</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full"
                disabled={loading}
              >
                {loading ? '发送中...' : '发送重置链接'}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-sm text-gray-500 hover:text-orange-500"
                >
                  返回登录
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

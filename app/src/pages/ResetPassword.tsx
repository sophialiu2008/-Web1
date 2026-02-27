import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { resetPasswordWithToken } from '@/services/api'
import { toast } from 'sonner'

/** 简易密码强度检测：要求大写、小写、数字各至少一个且长度 ≥ 8 */
function passwordStrength(pwd: string): 'weak' | 'medium' | 'strong' {
  if (pwd.length < 8) return 'weak'
  const hasLower = /[a-z]/.test(pwd)
  const hasUpper = /[A-Z]/.test(pwd)
  const hasDigit = /\d/.test(pwd)
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)
  const met = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length
  if (met >= 4) return 'strong'
  if (met >= 3 && hasLower && hasUpper && hasDigit) return 'strong'
  if (met >= 2) return 'medium'
  return 'weak'
}

const strengthStyle = {
  weak: { color: 'text-red-500', bar: 'bg-red-400', label: '弱' },
  medium: { color: 'text-yellow-500', bar: 'bg-yellow-400', label: '中' },
  strong: { color: 'text-green-500', bar: 'bg-green-500', label: '强' },
}

export default function ResetPassword() {
  const [token, setToken] = useState('')
  const [pwd, setPwd] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const t = new URLSearchParams(location.search).get('token') || ''
    setToken(t)
  }, [location.search])

  const strength = pwd ? passwordStrength(pwd) : null
  const strengthInfo = strength ? strengthStyle[strength] : null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('重置链接无效，请重新申请找回密码。')
      return
    }
    if (pwd.length < 8) {
      setError('密码至少需要 8 位字符。')
      return
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pwd)) {
      setError('密码需包含大写字母、小写字母和数字。')
      return
    }
    if (pwd !== pwd2) {
      setError('两次输入的密码不一致。')
      return
    }

    setLoading(true)
    try {
      const r = await resetPasswordWithToken({ token, new_password: pwd })
      if (r.code === 0) {
        setDone(true)
        toast.success('密码重置成功！')
        setTimeout(() => navigate('/login'), 2500)
      } else {
        setError(r.msg || '重置失败，请重新申请找回密码。')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '请求失败，请检查网络后重试。')
    } finally {
      setLoading(false)
    }
  }

  // ── 成功状态 ──────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white px-4">
        <Card className="w-full max-w-md shadow-warm">
          <CardContent className="p-10 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">密码已重置</h2>
            <p className="text-gray-500 text-sm">
              您的密码已成功更新，正在跳转到登录页面…
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── 重置表单 ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white px-4">
      <Card className="w-full max-w-md shadow-warm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Lock className="w-5 h-5 text-orange-500" />
            </div>
            <CardTitle className="text-xl">设置新密码</CardTitle>
          </div>
          <p className="text-sm text-gray-500 pl-1">
            请输入新密码，要求至少 8 位，包含大小写字母和数字。
          </p>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={submit} className="space-y-5">
            {/* 错误提示 */}
            {error && (
              <div className="flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {/* 新密码 */}
            <div className="space-y-2">
              <Label htmlFor="pwd">新密码</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="pwd"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="至少8位，含大小写字母和数字"
                  value={pwd}
                  onChange={(e) => { setPwd(e.target.value); setError('') }}
                  className="pl-10 pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* 密码强度条 */}
              {pwd && strengthInfo && (
                <div className="space-y-1 pt-1">
                  <div className="flex gap-1">
                    {(['weak', 'medium', 'strong'] as const).map((level, i) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${['weak', 'medium', 'strong'].indexOf(strength!) >= i
                            ? strengthInfo.bar
                            : 'bg-gray-200'
                          }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${strengthInfo.color}`}>
                    密码强度：{strengthInfo.label}
                  </p>
                </div>
              )}
            </div>

            {/* 确认密码 */}
            <div className="space-y-2">
              <Label htmlFor="pwd2">确认密码</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="pwd2"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="再次输入新密码"
                  value={pwd2}
                  onChange={(e) => { setPwd2(e.target.value); setError('') }}
                  className={`pl-10 ${pwd2 && pwd !== pwd2 ? 'border-red-400' : ''}`}
                  autoComplete="new-password"
                />
              </div>
              {pwd2 && pwd !== pwd2 && (
                <p className="text-xs text-red-500">两次密码不一致</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full h-11 mt-1 transition-transform hover:-translate-y-0.5"
              disabled={loading}
            >
              {loading ? '提交中…' : '确认重置密码'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-sm text-gray-400 hover:text-orange-500 transition-colors"
              >
                返回登录
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

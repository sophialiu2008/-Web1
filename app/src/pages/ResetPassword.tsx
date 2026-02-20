import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock } from 'lucide-react'
import { resetPasswordWithToken } from '@/services/api'

export default function ResetPassword() {
  const [token, setToken] = useState('')
  const [pwd, setPwd] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const sp = new URLSearchParams(location.search)
    const t = sp.get('token') || ''
    setToken(t)
  }, [location.search])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) { alert('链接无效'); return }
    if (!pwd || pwd !== pwd2) { alert('两次输入的密码不一致'); return }
    setLoading(true)
    try {
      const r = await resetPasswordWithToken({ token, new_password: pwd })
      if (r.code === 0) {
        alert('重置成功，请使用新密码登录')
        navigate('/login')
      } else {
        alert(r.msg || '重置失败')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>重置密码</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pwd">新密码</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input id="pwd" type="password" placeholder="至少8位，包含大小写字母和数字" value={pwd} onChange={(e) => setPwd(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pwd2">确认密码</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input id="pwd2" type="password" placeholder="再次输入密码" value={pwd2} onChange={(e) => setPwd2(e.target.value)} className="pl-10" />
              </div>
            </div>
            <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full" disabled={loading}>
              {loading ? '提交中...' : '提交'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

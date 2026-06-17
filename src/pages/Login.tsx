import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mountain } from 'lucide-react'
import { useAuthStore } from '@/hooks/useAuthStore'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('请填写所有字段')
      return
    }
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.message || '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="card-static w-full max-w-sm p-8 animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <Mountain size={32} className="text-forest-600" />
            <span className="font-serif text-2xl font-bold text-forest-800">山径</span>
          </div>
          <h2 className="font-serif text-xl font-semibold text-forest-800">欢迎回来</h2>
          <p className="text-sm text-gray-400 mt-1">登录以继续探索</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2.5">
              {error}
            </div>
          )}

          <div>
            <label className="label-text">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="input-field"
            />
          </div>

          <div>
            <label className="label-text">密码</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="输入密码"
              className="input-field"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          还没有账号？
          <Link to="/register" className="text-forest-600 hover:text-forest-700 font-medium ml-1 transition-colors">
            立即注册
          </Link>
        </p>
      </div>
    </div>
  )
}

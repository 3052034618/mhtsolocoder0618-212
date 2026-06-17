import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mountain } from 'lucide-react'
import { useAuthStore } from '@/hooks/useAuthStore'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuthStore()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username || !email || !password || !confirmPassword) {
      setError('请填写所有字段')
      return
    }
    if (password !== confirmPassword) {
      setError('两次密码输入不一致')
      return
    }
    if (password.length < 6) {
      setError('密码至少6位')
      return
    }
    setLoading(true)
    try {
      await register(username, email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.message || '注册失败，请重试')
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
          <h2 className="font-serif text-xl font-semibold text-forest-800">创建账号</h2>
          <p className="text-sm text-gray-400 mt-1">加入山径社区</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2.5">
              {error}
            </div>
          )}

          <div>
            <label className="label-text">用户名</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="你的昵称"
              className="input-field"
            />
          </div>

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
              placeholder="至少6位密码"
              className="input-field"
            />
          </div>

          <div>
            <label className="label-text">确认密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="再次输入密码"
              className="input-field"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          已有账号？
          <Link to="/login" className="text-forest-600 hover:text-forest-700 font-medium ml-1 transition-colors">
            立即登录
          </Link>
        </p>
      </div>
    </div>
  )
}

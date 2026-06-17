import { useState, useEffect, useRef } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { Mountain, User, LogOut, ChevronDown } from 'lucide-react'
import { useAuthStore } from '@/hooks/useAuthStore'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, token, logout, fetchMe } = useAuthStore()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (token && !user) fetchMe()
  }, [token, user, fetchMe])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = () => {
    logout()
    setDropdownOpen(false)
    navigate('/')
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1 text-sm font-medium transition-colors ${
      isActive ? 'text-white border-b-2 border-sand-400' : 'text-white/80 hover:text-white'
    }`

  return (
    <div className="min-h-screen flex flex-col bg-fog-100">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-forest-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Mountain size={24} />
            <span className="font-serif text-xl font-bold tracking-wide">山径</span>
          </Link>

          <div className="hidden sm:flex items-center gap-1">
            <NavLink to="/" end className={linkClass}>首页</NavLink>
            <NavLink to="/teams" className={linkClass}>组队广场</NavLink>
            <NavLink to="/route/new" className={linkClass}>发布路线</NavLink>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-forest-500 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-sand-400 flex items-center justify-center text-xs font-bold text-forest-800">
                    {user.username?.[0] || 'U'}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">{user.username}</span>
                  <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-fog-200 py-1 animate-fade-in">
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-fog-50 transition-colors"
                    >
                      <User size={14} />
                      个人中心
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={14} />
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-sm text-white/90 hover:text-white transition-colors px-3 py-1">
                  登录
                </Link>
                <Link
                  to="/register"
                  className="text-sm bg-white/15 hover:bg-white/25 text-white px-4 py-1.5 rounded-lg transition-colors"
                >
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-14 pb-8">
        {children}
      </main>

      <footer className="bg-forest-800 text-white/60 text-center py-6 text-sm">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 山径 ShanJing · 探索每一条未知的路</p>
        </div>
      </footer>
    </div>
  )
}

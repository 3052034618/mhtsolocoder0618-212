import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Route as RouteIcon, Star, Users, Phone, Shield, Plus, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/hooks/useAuthStore'
import type { Route, Team, SafetyCheckin, EmergencyContact } from '@/types'

type Tab = 'routes' | 'favorites' | 'teams' | 'contacts' | 'safety'

function MiniRouteCard({ route }: { route: Route }) {
  return (
    <Link to={`/route/${route.id}`} className="card rounded-xl overflow-hidden">
      {route.photos?.[0] ? (
        <img src={route.photos[0]} alt={route.name} className="w-full h-32 object-cover" />
      ) : (
        <div className="w-full h-32 bg-gradient-to-br from-forest-400 to-forest-700" />
      )}
      <div className="p-3">
        <h4 className="font-medium text-sm text-gray-800 truncate">{route.name}</h4>
        <p className="text-xs text-gray-500 mt-1">{route.province} · {route.distance}km · {route.difficulty}</p>
      </div>
    </Link>
  )
}

function MiniTeamCard({ team }: { team: Team }) {
  const statusMap: Record<string, { text: string; cls: string }> = {
    recruiting: { text: '招募中', cls: 'bg-green-100 text-green-700' },
    full: { text: '已满员', cls: 'bg-gray-100 text-gray-600' },
    confirmed: { text: '已出发', cls: 'bg-blue-100 text-blue-700' },
    completed: { text: '已结束', cls: 'bg-gray-200 text-gray-500' },
  }
  const s = statusMap[team.status] || { text: team.status, cls: 'bg-gray-100 text-gray-600' }
  return (
    <Link to={`/team/${team.id}`} className="card-static rounded-xl p-4 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm text-gray-800 truncate">{team.routeName}</h4>
        <p className="text-xs text-gray-500 mt-0.5">{team.date} · {team.meetingPoint}</p>
      </div>
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.text}</span>
    </Link>
  )
}

function MyRoutesSection() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { api.users.myRoutes().then(setRoutes).catch(() => {}).finally(() => setLoading(false)) }, [])
  if (loading) return <div className="grid grid-cols-2 gap-4 animate-pulse">{Array(4).fill(0).map((_, i) => <div key={i} className="h-40 bg-fog-200 rounded-xl" />)}</div>
  if (!routes.length) return <p className="text-center text-gray-400 py-10">暂无路线</p>
  return <div className="grid grid-cols-2 gap-4">{routes.map((r) => <MiniRouteCard key={r.id} route={r} />)}</div>
}

function MyFavoritesSection() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { api.users.myFavorites().then(setRoutes).catch(() => {}).finally(() => setLoading(false)) }, [])
  if (loading) return <div className="grid grid-cols-2 gap-4 animate-pulse">{Array(4).fill(0).map((_, i) => <div key={i} className="h-40 bg-fog-200 rounded-xl" />)}</div>
  if (!routes.length) return <p className="text-center text-gray-400 py-10">暂无收藏</p>
  return <div className="grid grid-cols-2 gap-4">{routes.map((r) => <MiniRouteCard key={r.id} route={r} />)}</div>
}

function MyTeamsSection() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { api.users.myTeams().then(setTeams).catch(() => {}).finally(() => setLoading(false)) }, [])
  if (loading) return <div className="space-y-3 animate-pulse">{Array(3).fill(0).map((_, i) => <div key={i} className="h-16 bg-fog-200 rounded-xl" />)}</div>
  if (!teams.length) return <p className="text-center text-gray-400 py-10">暂无队伍</p>
  return <div className="space-y-3">{teams.map((t) => <MiniTeamCard key={t.id} team={t} />)}</div>
}

function EmergencyContactsSection() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([{ name: '', phone: '' }])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    api.safety.getContacts().then((data) => {
      if (data?.length) setContacts(data)
    }).catch(() => {})
  }, [])

  function updateContact(idx: number, field: 'name' | 'phone', value: string) {
    setContacts((prev) => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c))
    setSaved(false)
    setSaveError('')
  }

  function addContact() {
    setContacts((prev) => [...prev, { name: '', phone: '' }])
    setSaved(false)
  }

  function removeContact(idx: number) {
    setContacts((prev) => prev.filter((_, i) => i !== idx))
    setSaved(false)
  }

  async function handleSave() {
    const valid = contacts.filter((c) => c.name && c.phone)
    if (valid.length === 0) {
      setSaveError('请至少填写一个联系人')
      return
    }
    setSaving(true)
    setSaved(false)
    setSaveError('')
    try {
      await api.safety.updateContacts(valid)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) {
      setSaveError(e.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="card-static rounded-xl p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-warning-50 flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5 text-warning-500" />
          </div>
          <div>
            <h3 className="font-medium text-gray-800">紧急联系人设置</h3>
            <p className="text-xs text-gray-400 mt-0.5">若超出预计返回时间未打卡，系统将自动通知以下联系人</p>
          </div>
        </div>

        <div className="space-y-3">
          {contacts.map((c, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-fog-100 flex items-center justify-center text-sm font-medium text-gray-500 shrink-0 mt-2">{i + 1}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                <input value={c.name} onChange={(e) => updateContact(i, 'name', e.target.value)} placeholder="联系人姓名" className="input-field" />
                <input value={c.phone} onChange={(e) => updateContact(i, 'phone', e.target.value)} placeholder="联系电话" className="input-field" />
              </div>
              {contacts.length > 1 && (
                <button onClick={() => removeContact(i)} className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mt-5 pt-4 border-t border-fog-200">
          <button onClick={addContact} className="text-sm text-forest-600 hover:text-forest-700 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-forest-50 transition-colors">
            <Plus className="w-4 h-4" /> 添加联系人
          </button>
          <div className="flex-1" />
          <button onClick={handleSave} disabled={saving} className="btn-primary px-6">
            {saving ? '保存中...' : '保存设置'}
          </button>
        </div>

        {saved && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
            <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
            </div>
            <span className="text-sm text-green-700 font-medium">紧急联系人已保存生效，系统将在紧急情况时自动联系</span>
          </div>
        )}
        {saveError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{saveError}</div>
        )}
      </div>
    </div>
  )
}

function SafetySection() {
  const [checkin, setCheckin] = useState<SafetyCheckin | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [showCheckinModal, setShowCheckinModal] = useState(false)
  const [checkinSuccess, setCheckinSuccess] = useState(false)
  const [checkoutSuccess, setCheckoutSuccess] = useState(false)
  const [expectedReturn, setExpectedReturn] = useState('')
  const [checkinError, setCheckinError] = useState('')
  const [countdown, setCountdown] = useState('')

  useEffect(() => {
    loadStatus()
  }, [])

  useEffect(() => {
    if (!checkin?.expectedReturnTime) return
    const update = () => {
      const target = new Date(checkin.expectedReturnTime).getTime()
      const now = Date.now()
      const diff = target - now
      if (diff <= 0) {
        setCountdown('已超时')
        return
      }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setCountdown(h > 0 ? `${h}小时${m}分钟` : `${m}分钟`)
    }
    update()
    const timer = setInterval(update, 60000)
    return () => clearInterval(timer)
  }, [checkin?.expectedReturnTime])

  async function loadStatus() {
    try {
      const data = await api.safety.status()
      if (data?.status === 'active') setCheckin(data)
    } catch {} finally {
      setLoading(false)
    }
  }

  async function handleCheckin() {
    if (!expectedReturn) {
      setCheckinError('请选择预计返回时间')
      return
    }
    setChecking(true)
    setCheckinError('')
    try {
      const data = await api.safety.checkin({
        teamId: '',
        routeId: '',
        expectedReturnTime: expectedReturn,
      })
      setCheckin(data)
      setShowCheckinModal(false)
      setCheckinSuccess(true)
      setExpectedReturn('')
      setTimeout(() => setCheckinSuccess(false), 3000)
    } catch (e: any) {
      setCheckinError(e.message || '打卡失败')
    } finally {
      setChecking(false)
    }
  }

  async function handleCheckout() {
    setChecking(true)
    try {
      await api.safety.checkout()
      setCheckin(null)
      setCheckoutSuccess(true)
      setTimeout(() => setCheckoutSuccess(false), 3000)
    } catch {} finally {
      setChecking(false)
    }
  }

  if (loading) return <div className="animate-pulse h-32 bg-fog-200 rounded-xl" />

  return (
    <div className="space-y-4">
      {checkinSuccess && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
          <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
          </div>
          <span className="text-sm text-green-700 font-medium">出发打卡成功！系统会自动监控您的安全状态</span>
        </div>
      )}
      {checkoutSuccess && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
          <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
          </div>
          <span className="text-sm text-green-700 font-medium">欢迎安全归来！打卡记录已更新</span>
        </div>
      )}

      {checkin ? (
        <div className={`card-static rounded-xl p-5 ${countdown === '已超时' ? 'border-red-300 bg-red-50 animate-pulse-slow' : ''}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${countdown === '已超时' ? 'bg-red-100' : 'bg-warning-50'}`}>
              <Shield className={`w-6 h-6 ${countdown === '已超时' ? 'text-red-500' : 'text-warning-500'}`} />
            </div>
            <div>
              <h3 className={`font-semibold ${countdown === '已超时' ? 'text-red-700' : 'text-gray-800'}`}>
                {countdown === '已超时' ? '已超出预计返回时间' : '当前有活跃打卡'}
              </h3>
              <p className="text-sm text-gray-500">
                {countdown === '已超时' ? '系统会自动通知紧急联系人' : `预计返回倒计时：${countdown}`}
              </p>
            </div>
          </div>
          <div className="space-y-1.5 text-sm bg-fog-50 rounded-lg p-3 mb-4">
            <p><span className="text-gray-400 inline-block w-20">出发时间：</span>{new Date(checkin.checkinTime).toLocaleString('zh-CN')}</p>
            <p><span className="text-gray-400 inline-block w-20">预计返回：</span>{new Date(checkin.expectedReturnTime).toLocaleString('zh-CN')}</p>
          </div>
          <button onClick={handleCheckout} disabled={checking} className="btn-primary w-full">
            {checking ? '处理中...' : '安全归来'}
          </button>
        </div>
      ) : (
        <div className="card-static rounded-xl p-5">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-full bg-forest-50 flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6 text-forest-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">安全打卡</h3>
              <p className="text-sm text-gray-500 mt-1">出发前打卡设置预计返回时间，超时未归将自动通知紧急联系人</p>
            </div>
          </div>
          <button onClick={() => setShowCheckinModal(true)} className="btn-warning w-full">
            出发打卡
          </button>
        </div>
      )}

      {showCheckinModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowCheckinModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="font-serif text-lg font-semibold text-forest-800 mb-4">出发打卡</h3>
            <div className="space-y-4">
              <div>
                <label className="label-text">预计返回时间 *</label>
                <input
                  type="datetime-local"
                  value={expectedReturn}
                  onChange={e => { setExpectedReturn(e.target.value); setCheckinError('') }}
                  className="input-field"
                  min={new Date().toISOString().slice(0, 16)}
                />
                <p className="text-xs text-gray-400 mt-1">建议设置比实际预计晚 1-2 小时，避免误报</p>
              </div>
              {checkinError && <p className="text-sm text-red-500">{checkinError}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCheckinModal(false)} className="btn-secondary flex-1">取消</button>
                <button onClick={handleCheckin} disabled={checking} className="btn-warning flex-1">
                  {checking ? '打卡中...' : '确认出发'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const MENU_ITEMS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'routes', label: '我的路线', icon: <RouteIcon className="w-4 h-4" /> },
  { key: 'favorites', label: '我的收藏', icon: <Star className="w-4 h-4" /> },
  { key: 'teams', label: '我的队伍', icon: <Users className="w-4 h-4" /> },
  { key: 'contacts', label: '紧急联系人', icon: <Phone className="w-4 h-4" /> },
  { key: 'safety', label: '安全打卡', icon: <Shield className="w-4 h-4" /> },
]

export default function Profile() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<Tab>('routes')

  if (!user) return <div className="container mx-auto px-4 py-8 text-center text-gray-400">请先登录</div>

  const avatarColor = ['bg-forest-500', 'bg-sand-500', 'bg-warning-400', 'bg-blue-500'][user.username.charCodeAt(0) % 4]

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="flex gap-8">
        <aside className="w-64 shrink-0">
          <div className="card-static rounded-xl p-5 text-center mb-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-medium mx-auto ${avatarColor}`}>
              {user.username.charAt(0)}
            </div>
            <h3 className="font-semibold text-gray-800 mt-3">{user.username}</h3>
            <p className="text-sm text-gray-500">{user.email}</p>
            <p className="text-xs text-gray-400 mt-1">加入于 {new Date(user.createdAt).toLocaleDateString('zh-CN')}</p>
          </div>
          <nav className="card-static rounded-xl overflow-hidden">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all ${
                  activeTab === item.key
                    ? 'bg-forest-50 text-forest-700 font-medium border-l-3 border-forest-600'
                    : 'text-gray-600 hover:bg-fog-50'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          <h2 className="section-title mb-4">{MENU_ITEMS.find((m) => m.key === activeTab)?.label}</h2>
          {activeTab === 'routes' && <MyRoutesSection />}
          {activeTab === 'favorites' && <MyFavoritesSection />}
          {activeTab === 'teams' && <MyTeamsSection />}
          {activeTab === 'contacts' && <EmergencyContactsSection />}
          {activeTab === 'safety' && <SafetySection />}
        </main>
      </div>
    </div>
  )
}

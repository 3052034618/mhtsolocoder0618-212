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

  useEffect(() => {
    api.safety.getContacts().then((data) => {
      if (data?.length) setContacts(data)
    }).catch(() => {})
  }, [])

  function updateContact(idx: number, field: 'name' | 'phone', value: string) {
    setContacts((prev) => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c))
  }

  function addContact() {
    setContacts((prev) => [...prev, { name: '', phone: '' }])
  }

  function removeContact(idx: number) {
    setContacts((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      await api.safety.updateContacts(contacts.filter((c) => c.name && c.phone))
      setSaved(true)
    } catch {} finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {contacts.map((c, i) => (
        <div key={i} className="flex gap-3 items-start">
          <input value={c.name} onChange={(e) => updateContact(i, 'name', e.target.value)} placeholder="姓名" className="input-field flex-1" />
          <input value={c.phone} onChange={(e) => updateContact(i, 'phone', e.target.value)} placeholder="电话" className="input-field flex-1" />
          {contacts.length > 1 && (
            <button onClick={() => removeContact(i)} className="p-2 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
          )}
        </div>
      ))}
      <button onClick={addContact} className="text-sm text-forest-600 hover:text-forest-700 flex items-center gap-1"><Plus className="w-4 h-4" /> 添加联系人</button>
      <button onClick={handleSave} disabled={saving} className="btn-primary w-full">{saving ? '保存中...' : '保存联系人'}</button>
      {saved && <p className="text-sm text-green-600 text-center">保存成功</p>}
    </div>
  )
}

function SafetySection() {
  const [checkin, setCheckin] = useState<SafetyCheckin | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    loadStatus()
  }, [])

  async function loadStatus() {
    try {
      const data = await api.safety.status()
      if (data?.status === 'active') setCheckin(data)
    } catch {} finally {
      setLoading(false)
    }
  }

  async function handleCheckout() {
    setChecking(true)
    try {
      await api.safety.checkout()
      setCheckin(null)
    } catch {} finally {
      setChecking(false)
    }
  }

  if (loading) return <div className="animate-pulse h-32 bg-fog-200 rounded-xl" />

  return (
    <div className="space-y-4">
      {checkin ? (
        <div className="card-static rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-5 h-5 text-warning-500" />
            <span className="font-medium text-gray-800">当前有活跃打卡</span>
          </div>
          <p className="text-sm text-gray-600">出发时间: {new Date(checkin.checkinTime).toLocaleString('zh-CN')}</p>
          <p className="text-sm text-gray-600">预计返回: {new Date(checkin.expectedReturnTime).toLocaleString('zh-CN')}</p>
          <button onClick={handleCheckout} disabled={checking} className="btn-primary w-full mt-4">安全归来</button>
        </div>
      ) : (
        <div className="card-static rounded-xl p-5 text-center text-gray-400">
          <Shield className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p>当前没有活跃打卡</p>
          <p className="text-sm mt-1">加入出发队伍后可进行安全打卡</p>
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

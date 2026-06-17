import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, Users, Search } from 'lucide-react'
import { api } from '@/lib/api'
import type { Team } from '@/types'

const STATUS_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'recruiting', label: '招募中' },
  { value: 'full', label: '已满员' },
  { value: 'confirmed', label: '已出发' },
]

function statusBadge(status: string) {
  const map: Record<string, { text: string; cls: string }> = {
    recruiting: { text: '招募中', cls: 'bg-green-100 text-green-700' },
    full: { text: '已满员', cls: 'bg-gray-100 text-gray-600' },
    confirmed: { text: '已出发', cls: 'bg-blue-100 text-blue-700' },
    completed: { text: '已结束', cls: 'bg-gray-200 text-gray-500' },
  }
  const s = map[status] || { text: status, cls: 'bg-gray-100 text-gray-600' }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.text}</span>
}

function TeamCardSkeleton() {
  return (
    <div className="card-static rounded-xl overflow-hidden animate-pulse">
      <div className="h-[200px] bg-fog-200" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-fog-200 rounded w-3/4" />
        <div className="h-4 bg-fog-200 rounded w-1/2" />
        <div className="h-4 bg-fog-200 rounded w-2/3" />
        <div className="h-3 bg-fog-200 rounded w-full" />
      </div>
    </div>
  )
}

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadTeams()
  }, [statusFilter])

  async function loadTeams() {
    setLoading(true)
    setError('')
    try {
      const data = await api.teams.list(statusFilter ? { status: statusFilter } : undefined)
      setTeams(data)
    } catch (e: any) {
      setError(e.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const filtered = teams.filter((t) =>
    !search || t.routeName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="section-title text-3xl">组队广场</h1>
        <p className="text-gray-500 mt-1">找到志同道合的山友，一起踏上征程</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === opt.value
                  ? 'bg-forest-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-fog-300 hover:bg-fog-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索路线名称..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <TeamCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>暂无队伍</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((team) => (
            <Link
              key={team.id}
              to={`/team/${team.id}`}
              className="card rounded-xl overflow-hidden animate-slide-up"
            >
              <div className="relative h-[200px]">
                {team.routePhoto ? (
                  <img
                    src={team.routePhoto}
                    alt={team.routeName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-forest-400 to-forest-700" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="text-white font-semibold text-lg">{team.routeName}</h3>
                </div>
                <div className="absolute top-3 right-3">{statusBadge(team.status)}</div>
              </div>
              <div className="p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-sand-500" />
                  <span>{team.date}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-sand-500" />
                  <span>{team.meetingPoint}</span>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{team.approvedCount ?? team.members?.filter((m) => m.status === 'approved').length ?? 0} 人已加入</span>
                    <span>目标 {team.expectedCount} 人</span>
                  </div>
                  <div className="h-2 bg-fog-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-forest-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          ((team.approvedCount ?? team.members?.filter((m) => m.status === 'approved').length ?? 0) /
                            Math.max(1, team.expectedCount)) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

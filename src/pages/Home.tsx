import { useState, useEffect, useCallback } from 'react'
import { Search, Filter, ChevronRight } from 'lucide-react'
import { api } from '@/lib/api'
import RouteCard from '@/components/RouteCard'
import TeamCard from '@/components/TeamCard'
import type { Route, Team, RouteFilters } from '@/types'

const provinces = [
  '全部', '北京', '天津', '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江',
  '上海', '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南', '湖北',
  '湖南', '广东', '广西', '海南', '重庆', '四川', '贵州', '云南', '西藏',
  '陕西', '甘肃', '青海', '宁夏', '新疆', '台湾', '香港', '澳门',
]

const difficulties = ['全部', '简单', '中等', '困难', '专家']
const durations = ['全部', '半天', '1天', '2-3天', '4天以上']

const seasonMap: Record<number, string> = {
  0: '冬', 1: '冬', 2: '春', 3: '春', 4: '春',
  5: '夏', 6: '夏', 7: '夏', 8: '秋', 9: '秋',
  10: '秋', 11: '冬',
}

function getCurrentSeason(): string {
  return seasonMap[new Date().getMonth()]
}

function RouteSkeleton() {
  return (
    <div className="card flex overflow-hidden animate-pulse">
      <div className="w-2/5 h-[180px] bg-fog-200" />
      <div className="flex-1 p-4 space-y-3">
        <div className="h-5 bg-fog-200 rounded w-3/4" />
        <div className="h-4 bg-fog-200 rounded w-1/3" />
        <div className="h-4 bg-fog-200 rounded w-2/3" />
        <div className="h-4 bg-fog-200 rounded w-1/4" />
      </div>
    </div>
  )
}

function TeamSkeleton() {
  return (
    <div className="card shrink-0 w-64 overflow-hidden animate-pulse">
      <div className="h-32 bg-fog-200" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-fog-200 rounded w-2/3" />
        <div className="h-3 bg-fog-200 rounded w-1/2" />
      </div>
    </div>
  )
}

export default function Home() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [teamsLoading, setTeamsLoading] = useState(true)
  const [filters, setFilters] = useState<RouteFilters>({})
  const [searchText, setSearchText] = useState('')

  const fetchRoutes = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.routes.list(filters)
      setRoutes(data || [])
    } catch {
      setRoutes([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  const fetchTeams = useCallback(async () => {
    setTeamsLoading(true)
    try {
      const data = await api.teams.list({ status: 'recruiting' })
      setTeams(data || [])
    } catch {
      setTeams([])
    } finally {
      setTeamsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRoutes()
  }, [fetchRoutes])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  const handleFilterChange = (key: keyof RouteFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '全部' ? undefined : value,
    }))
  }

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, startPoint: searchText || undefined }))
  }

  const season = getCurrentSeason()
  const seasonRoutes = routes.filter(r => r.seasonRecommendation?.includes(season))

  return (
    <div>
      <section className="relative bg-gradient-to-br from-forest-600 via-forest-700 to-forest-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-sand-400/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4 animate-fade-in">
            山径 · 探索每一条未知的路
          </h1>
          <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto animate-slide-up">
            发现绝美徒步路线，结识志同道合的山友，安全探索自然之美
          </p>
          <div className="max-w-md mx-auto flex gap-2 animate-slide-up">
            <input
              type="text"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="搜索起点、路线名称..."
              className="flex-1 px-4 py-3 rounded-xl bg-white/15 backdrop-blur text-white placeholder:text-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-sand-400 transition-all"
            />
            <button onClick={handleSearch} className="px-5 py-3 bg-sand-400 text-forest-800 rounded-xl font-medium hover:bg-sand-300 transition-colors">
              <Search size={20} />
            </button>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 -mt-6 relative z-10">
        <div className="card-static p-4">
          <div className="flex items-center gap-2 mb-3 text-forest-700">
            <Filter size={16} />
            <span className="text-sm font-medium">筛选路线</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <select
              value={filters.province || '全部'}
              onChange={e => handleFilterChange('province', e.target.value)}
              className="input-field text-sm"
            >
              {provinces.map(p => <option key={p} value={p}>{p === '全部' ? '全部省份' : p}</option>)}
            </select>
            <select
              value={filters.difficulty || '全部'}
              onChange={e => handleFilterChange('difficulty', e.target.value)}
              className="input-field text-sm"
            >
              {difficulties.map(d => <option key={d} value={d}>{d === '全部' ? '全部难度' : d}</option>)}
            </select>
            <select
              value={filters.duration || '全部'}
              onChange={e => handleFilterChange('duration', e.target.value)}
              className="input-field text-sm"
            >
              {durations.map(d => <option key={d} value={d}>{d === '全部' ? '全部时长' : d}</option>)}
            </select>
            <input
              type="text"
              value={filters.startPoint || ''}
              onChange={e => handleFilterChange('startPoint', e.target.value)}
              placeholder="起点名称"
              className="input-field text-sm"
            />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 mt-10">
        <h2 className="section-title mb-6">路线推荐</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }, (_, i) => <RouteSkeleton key={i} />)}
          </div>
        ) : routes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routes.map(route => <RouteCard key={route.id} route={route} />)}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">暂无匹配路线</p>
            <p className="text-sm mt-1">尝试调整筛选条件</p>
          </div>
        )}
      </section>

      {seasonRoutes.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title">{season}季推荐</h2>
            <span className="text-sm text-gray-400 flex items-center gap-1">
              查看更多 <ChevronRight size={14} />
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {seasonRoutes.slice(0, 4).map(route => <RouteCard key={route.id} route={route} />)}
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 mt-12 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title">最近组队</h2>
          <a href="/teams" className="text-sm text-forest-600 hover:text-forest-700 flex items-center gap-1 transition-colors">
            查看全部 <ChevronRight size={14} />
          </a>
        </div>
        {teamsLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {Array.from({ length: 3 }, (_, i) => <TeamSkeleton key={i} />)}
          </div>
        ) : teams.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
            {teams.map(team => <TeamCard key={team.id} team={team} />)}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p>暂无组队信息</p>
          </div>
        )}
      </section>
    </div>
  )
}

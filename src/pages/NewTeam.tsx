import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import type { Route } from '@/types'

export default function NewTeam() {
  const navigate = useNavigate()
  const [routes, setRoutes] = useState<Route[]>([])
  const [routeId, setRouteId] = useState('')
  const [date, setDate] = useState('')
  const [meetingPoint, setMeetingPoint] = useState('')
  const [expectedCount, setExpectedCount] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRoutes()
  }, [])

  async function loadRoutes() {
    try {
      const data = await api.routes.list()
      setRoutes(data)
    } catch {} finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!routeId || !date || !meetingPoint || !expectedCount) {
      setError('请填写所有必填项')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const team = await api.teams.create({
        routeId,
        date,
        meetingPoint,
        expectedCount: Number(expectedCount),
        notes,
      })
      navigate(`/team/${team.id}`)
    } catch (e: any) {
      setError(e.message || '创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl animate-fade-in">
      <button onClick={() => navigate(-1)} className="text-forest-600 hover:text-forest-700 mb-4 flex items-center gap-1 text-sm">
        ← 返回
      </button>

      <h1 className="section-title text-2xl mb-6">发起组队</h1>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="label-text">选择路线 *</label>
          {loading ? (
            <div className="input-field animate-pulse">加载路线中...</div>
          ) : (
            <select
              value={routeId}
              onChange={(e) => setRouteId(e.target.value)}
              className="input-field"
              required
            >
              <option value="">请选择路线</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>{r.name} - {r.province}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="label-text">出发日期 *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="label-text">集合地点 *</label>
          <input
            type="text"
            value={meetingPoint}
            onChange={(e) => setMeetingPoint(e.target.value)}
            placeholder="如：地铁站A出口"
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="label-text">目标人数 *</label>
          <input
            type="number"
            value={expectedCount}
            onChange={(e) => setExpectedCount(e.target.value)}
            placeholder="如：8"
            min="2"
            max="50"
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="label-text">备注说明</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="装备要求、费用说明等..."
            rows={4}
            className="input-field resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full"
        >
          {submitting ? '创建中...' : '发起组队'}
        </button>
      </form>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuthStore } from '@/hooks/useAuthStore'
import type { Team, Message, SafetyCheckin } from '@/types'

function Avatar({ name, color }: { name: string; color?: string }) {
  const colors = ['bg-forest-500', 'bg-sand-500', 'bg-warning-400', 'bg-blue-500', 'bg-purple-500']
  const idx = name.charCodeAt(0) % colors.length
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${color || colors[idx]}`}>
      {name.charAt(0)}
    </div>
  )
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function ChatSection({ teamId }: { teamId: string }) {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadMessages()
  }, [teamId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadMessages() {
    try {
      const data = await api.teams.messages(teamId)
      setMessages(data)
    } catch {}
  }

  async function handleSend() {
    if (!input.trim() || sending) return
    setSending(true)
    try {
      const msg = await api.teams.sendMessage(teamId, input.trim())
      setMessages((prev) => [...prev, msg])
      setInput('')
    } catch {} finally {
      setSending(false)
    }
  }

  return (
    <div className="card-static rounded-xl mt-6">
      <h3 className="section-title p-4 border-b border-fog-200">队伍聊天</h3>
      <div className="h-[400px] overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && <p className="text-center text-gray-400 text-sm">暂无消息</p>}
        {messages.map((msg) =>
          msg.type === 'system' ? (
            <div key={msg.id} className="text-center text-xs text-gray-400 py-1">{msg.content}</div>
          ) : (
            <div key={msg.id} className="flex gap-2">
              <Avatar name={msg.userName} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">{msg.userName}</span>
                  <span className="text-xs text-gray-400">{formatTime(msg.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-600 mt-0.5">{msg.content}</p>
              </div>
            </div>
          )
        )}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-fog-200 p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="输入消息..."
          className="input-field flex-1"
        />
        <button onClick={handleSend} disabled={sending || !input.trim()} className="btn-primary px-4">
          发送
        </button>
      </div>
    </div>
  )
}

function SafetySection({ teamId, routeId }: { teamId: string; routeId: string }) {
  const [checkin, setCheckin] = useState<SafetyCheckin | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [expectedReturn, setExpectedReturn] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadStatus()
  }, [])

  async function loadStatus() {
    try {
      const data = await api.safety.status()
      if (data && data.status === 'active') setCheckin(data)
    } catch {}
  }

  async function handleCheckin() {
    if (!expectedReturn) return
    setLoading(true)
    try {
      const data = await api.safety.checkin({ teamId, routeId, expectedReturnTime: expectedReturn })
      setCheckin(data)
      setShowModal(false)
    } catch {} finally {
      setLoading(false)
    }
  }

  async function handleCheckout() {
    setLoading(true)
    try {
      await api.safety.checkout()
      setCheckin(null)
    } catch {} finally {
      setLoading(false)
    }
  }

  function getCountdown(expected: string) {
    const diff = new Date(expected).getTime() - Date.now()
    if (diff <= 0) return '已超时'
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return `预计 ${h}小时${m}分钟 后返回`
  }

  return (
    <div className="card-static rounded-xl p-4 mt-6">
      <h3 className="section-title mb-3">安全打卡</h3>
      {checkin ? (
        <div className="space-y-3">
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
            <p className="text-sm text-warning-600 font-medium">{getCountdown(checkin.expectedReturnTime)}</p>
            <p className="text-xs text-gray-500 mt-1">出发时间: {formatTime(checkin.checkinTime)}</p>
          </div>
          <button onClick={handleCheckout} disabled={loading} className="btn-primary w-full">
            安全归来
          </button>
        </div>
      ) : (
        <button onClick={() => setShowModal(true)} className="btn-warning w-full">
          出发打卡
        </button>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-semibold text-gray-800 mb-4">设置预计返回时间</h4>
            <input
              type="datetime-local"
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(e.target.value)}
              className="input-field mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">取消</button>
              <button onClick={handleCheckin} disabled={loading || !expectedReturn} className="btn-warning flex-1">
                确认出发
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    loadTeam()
  }, [id])

  async function loadTeam() {
    if (!id) return
    setLoading(true)
    try {
      const data = await api.teams.get(id)
      setTeam(data)
    } catch (e: any) {
      setError(e.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    if (!id || joining) return
    setJoining(true)
    try {
      await api.teams.join(id)
      await loadTeam()
    } catch (e: any) {
      setError(e.message || '申请失败')
    } finally {
      setJoining(false)
    }
  }

  async function handleApprove(userId: string, approved: boolean) {
    if (!id) return
    try {
      await api.teams.approve(id, userId, approved)
      await loadTeam()
    } catch {}
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8"><div className="animate-pulse space-y-4"><div className="h-8 bg-fog-200 rounded w-1/3" /><div className="h-48 bg-fog-200 rounded" /></div></div>
  }

  if (error || !team) {
    return <div className="container mx-auto px-4 py-8"><div className="bg-red-50 text-red-600 p-4 rounded-lg">{error || '队伍不存在'}</div></div>
  }

  const isLeader = user?.id === team.leaderId
  const currentMember = team.members?.find((m) => m.userId === user?.id)
  const isApproved = currentMember?.status === 'approved'
  const isPending = currentMember?.status === 'pending'
  const isNotMember = !currentMember

  const leader = team.members?.find((m) => m.userId === team.leaderId)
  const approvedMembers = team.members?.filter((m) => m.status === 'approved' && m.userId !== team.leaderId) || []
  const pendingMembers = team.members?.filter((m) => m.status === 'pending') || []

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in max-w-3xl">
      <button onClick={() => navigate(-1)} className="text-forest-600 hover:text-forest-700 mb-4 flex items-center gap-1 text-sm">
        ← 返回
      </button>

      <div className="card-static rounded-xl p-6">
        {team.routePhoto && (
          <img src={team.routePhoto} alt={team.routeName} className="w-full h-48 object-cover rounded-lg mb-4" />
        )}
        <h1 className="text-2xl font-serif font-semibold text-forest-800">{team.routeName}</h1>
        <div className="mt-3 space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2"><span className="text-sand-500">📅</span> 日期: {team.date}</div>
          <div className="flex items-center gap-2"><span className="text-sand-500">📍</span> 集合点: {team.meetingPoint}</div>
          <div className="flex items-center gap-2"><span className="text-sand-500">👥</span> 目标人数: {team.expectedCount} 人</div>
          {team.notes && <p className="text-gray-500 mt-2 bg-fog-50 rounded-lg p-3">{team.notes}</p>}
        </div>
      </div>

      <div className="card-static rounded-xl p-6 mt-6">
        <h3 className="section-title mb-4">队伍成员</h3>
        <div className="space-y-3">
          {leader && (
            <div className="flex items-center gap-3 p-2 bg-sand-50 rounded-lg">
              <Avatar name={leader.userName} color="bg-sand-500" />
              <span className="text-sm font-medium">{leader.userName}</span>
              <span className="text-xs text-sand-600 bg-sand-100 px-2 py-0.5 rounded-full">👑 领队</span>
            </div>
          )}
          {approvedMembers.map((m) => (
            <div key={m.userId} className="flex items-center gap-3 p-2">
              <Avatar name={m.userName} />
              <span className="text-sm">{m.userName}</span>
              <span className="text-xs text-green-600">✓ 已通过</span>
            </div>
          ))}
          {pendingMembers.map((m) => (
            <div key={m.userId} className="flex items-center gap-3 p-2 bg-fog-50 rounded-lg">
              <Avatar name={m.userName} />
              <span className="text-sm">{m.userName}</span>
              <span className="text-xs text-yellow-600">🕐 待审核</span>
              {isLeader && (
                <div className="ml-auto flex gap-2">
                  <button onClick={() => handleApprove(m.userId, true)} className="text-xs bg-forest-600 text-white px-3 py-1 rounded-lg hover:bg-forest-700">通过</button>
                  <button onClick={() => handleApprove(m.userId, false)} className="text-xs bg-gray-300 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-400">拒绝</button>
                </div>
              )}
            </div>
          ))}
        </div>
        {isNotMember && team.status === 'recruiting' && (
          <button onClick={handleJoin} disabled={joining} className="btn-primary w-full mt-4">
            {joining ? '申请中...' : '申请加入'}
          </button>
        )}
        {isPending && (
          <p className="text-center text-sm text-yellow-600 mt-4">已申请，等待领队审核</p>
        )}
      </div>

      {isApproved && <ChatSection teamId={team.id} />}
      {isApproved && <SafetySection teamId={team.id} routeId={team.routeId} />}
    </div>
  )
}

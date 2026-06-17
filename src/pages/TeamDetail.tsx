import { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuthStore } from '@/hooks/useAuthStore'
import type { Team, Message, SafetyCheckin, ItineraryDay } from '@/types'
import { MapPin, Home, Clock, Plus, Trash2, Edit3, Check, X, FileText, Tent } from 'lucide-react'

function ItinerarySection({ teamId, itineraries, isLeader, onSaved }: { teamId: string; itineraries: ItineraryDay[]; isLeader: boolean; onSaved: (list: ItineraryDay[]) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<ItineraryDay[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => { setDraft(itineraries || []) }, [itineraries])

  function updateDay(idx: number, field: keyof ItineraryDay, value: string) {
    setDraft(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d))
  }

  function addDay() {
    setDraft(prev => [...prev, { id: '', teamId, dayIndex: prev.length + 1, routeNode: '', accommodation: '', duration: '', notes: '' }])
  }

  function removeDay(idx: number) {
    setDraft(prev => prev.filter((_, i) => i !== idx).map((d, i) => ({ ...d, dayIndex: i + 1 })))
  }

  async function save() {
    setSaving(true)
    try {
      const saved = await api.teams.saveItineraries(teamId, draft)
      onSaved(saved)
      setEditing(false)
    } catch {} finally { setSaving(false) }
  }

  function cancel() {
    setDraft(itineraries || [])
    setEditing(false)
  }

  const displayList = editing ? draft : itineraries

  return (
    <div className="card-static rounded-xl mt-6">
      <div className="flex items-center justify-between p-4 border-b border-fog-200">
        <h3 className="section-title mb-0 flex items-center gap-2">
          <Tent className="w-4 h-4 text-forest-600" />
          行程安排
        </h3>
        {isLeader && !editing && (
          <button onClick={() => setEditing(true)} className="text-sm text-forest-600 hover:text-forest-700 flex items-center gap-1">
            <Edit3 className="w-3.5 h-3.5" /> 编辑
          </button>
        )}
      </div>
      <div className="p-4">
        {displayList?.length ? (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-fog-200" />
            <ol className="space-y-4">
              {displayList.map((day, idx) => (
                <li key={idx} className="relative pl-10">
                  <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-forest-500 text-white text-sm font-semibold flex items-center justify-center">
                    D{day.dayIndex}
                  </div>
                  {editing ? (
                    <div className="card-static rounded-lg p-3 space-y-2 bg-fog-50">
                      <div className="flex gap-2">
                        <input
                          value={day.routeNode}
                          onChange={e => updateDay(idx, 'routeNode', e.target.value)}
                          placeholder="路线节点 * 例：汤口镇 → 云谷寺 → 白鹅岭"
                          className="input-field flex-1 text-sm"
                        />
                        <button onClick={() => removeDay(idx)} className="text-red-400 hover:text-red-600 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={day.accommodation || ''}
                          onChange={e => updateDay(idx, 'accommodation', e.target.value)}
                          placeholder="住宿/营地"
                          className="input-field text-sm"
                        />
                        <input
                          value={day.duration || ''}
                          onChange={e => updateDay(idx, 'duration', e.target.value)}
                          placeholder="预计用时"
                          className="input-field text-sm"
                        />
                      </div>
                      <input
                        value={day.notes || ''}
                        onChange={e => updateDay(idx, 'notes', e.target.value)}
                        placeholder="备注（海拔变化、装备提示等）"
                        className="input-field text-sm"
                      />
                    </div>
                  ) : (
                    <div className="card-static rounded-lg p-3">
                      <div className="flex items-start gap-2 mb-1.5">
                        <MapPin className="w-4 h-4 text-forest-500 mt-0.5 shrink-0" />
                        <p className="text-sm font-medium text-gray-800 leading-relaxed">{day.routeNode}</p>
                      </div>
                      {(day.accommodation || day.duration) && (
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500 ml-6">
                          {day.accommodation && (
                            <span className="flex items-center gap-1">
                              <Home className="w-3 h-3" /> {day.accommodation}
                            </span>
                          )}
                          {day.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {day.duration}
                            </span>
                          )}
                        </div>
                      )}
                      {day.notes && (
                        <p className="text-xs text-gray-400 ml-6 mt-1.5 leading-relaxed">💡 {day.notes}</p>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <p className="text-center text-gray-400 py-6 text-sm">
            {isLeader ? '队长还未规划行程，点击右上角「编辑」开始规划' : '队长暂未公布行程安排'}
          </p>
        )}
        {editing && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-fog-200">
            <button onClick={addDay} className="btn-secondary flex-1 text-sm flex items-center justify-center gap-1">
              <Plus className="w-4 h-4" /> 添加一天
            </button>
            <div className="flex-1" />
            <button onClick={cancel} disabled={saving} className="btn-secondary px-5 text-sm">取消</button>
            <button onClick={save} disabled={saving || draft.every(d => !d.routeNode?.trim())} className="btn-primary px-5 text-sm flex items-center gap-1">
              <Check className="w-4 h-4" /> {saving ? '保存中...' : '保存'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function JoinModal({ teamId, onClose, onSuccess }: { teamId: string; onClose: () => void; onSuccess: () => void }) {
  const [intro, setIntro] = useState('')
  const [experience, setExperience] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (!intro.trim()) return
    setSubmitting(true)
    try {
      await api.teams.join(teamId, { intro: intro.trim(), experience: experience.trim() || undefined })
      onSuccess()
      onClose()
    } catch (e: any) {
      alert(e.message || '申请失败')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg font-semibold text-forest-800 flex items-center gap-2">
            <FileText className="w-4 h-4" /> 申请加入
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label-text">自我介绍 *</label>
            <textarea
              value={intro}
              onChange={e => setIntro(e.target.value)}
              placeholder="简单介绍一下自己，让队长了解你~ 例：平时常走北京周边线路，周末有空"
              rows={3}
              className="input-field resize-none"
            />
          </div>
          <div>
            <label className="label-text">户外经验</label>
            <textarea
              value={experience}
              onChange={e => setExperience(e.target.value)}
              placeholder="走过哪些线路？例：武功山、黄山、莫干山等"
              rows={2}
              className="input-field resize-none"
            />
          </div>
          <p className="text-xs text-gray-400">填写的信息仅队长可见，用于审核参考</p>
          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="btn-secondary flex-1">取消</button>
            <button onClick={submit} disabled={submitting || !intro.trim()} className="btn-primary flex-1">
              {submitting ? '提交中...' : '提交申请'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

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
  const [showJoinModal, setShowJoinModal] = useState(false)

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

  function handleJoin() {
    setShowJoinModal(true)
  }

  function handleItinerariesSaved(list: ItineraryDay[]) {
    setTeam(prev => prev ? { ...prev, itineraries: list } : prev)
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
            <div key={m.userId} className="p-3 bg-fog-50 rounded-lg space-y-2">
              <div className="flex items-center gap-3">
                <Avatar name={m.userName} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{m.userName}</span>
                  <span className="text-xs text-yellow-600 ml-2">🕐 待审核</span>
                </div>
                {isLeader && (
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(m.userId, true)} className="text-xs bg-forest-600 text-white px-3 py-1 rounded-lg hover:bg-forest-700">通过</button>
                    <button onClick={() => handleApprove(m.userId, false)} className="text-xs bg-gray-300 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-400">拒绝</button>
                  </div>
                )}
              </div>
              {isLeader && (
                <div className="ml-11 space-y-1.5 text-sm bg-white rounded-lg p-3 border border-fog-200">
                  {m.intro && (
                    <div>
                      <span className="text-xs text-gray-400 font-medium">自我介绍：</span>
                      <p className="text-gray-700 mt-0.5">{m.intro}</p>
                    </div>
                  )}
                  {m.experience && (
                    <div>
                      <span className="text-xs text-gray-400 font-medium">户外经验：</span>
                      <p className="text-gray-700 mt-0.5">{m.experience}</p>
                    </div>
                  )}
                  {!m.intro && !m.experience && (
                    <p className="text-gray-400 text-xs">申请人未填写额外信息</p>
                  )}
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

      {isApproved && (
        <ItinerarySection
          teamId={team.id}
          itineraries={team.itineraries || []}
          isLeader={isLeader}
          onSaved={handleItinerariesSaved}
        />
      )}
      {isApproved && <ChatSection teamId={team.id} />}
      {isApproved && <SafetySection teamId={team.id} routeId={team.routeId} />}
      {showJoinModal && id && (
        <JoinModal teamId={id} onClose={() => setShowJoinModal(false)} onSuccess={loadTeam} />
      )}
    </div>
  )
}

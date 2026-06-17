import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { status, routeId } = req.query

  let sql = `
    SELECT t.*, r.name as route_name, r.photos as route_photos, u.username as leader_name,
      COUNT(DISTINCT tm.id) as approved_count
    FROM teams t
    LEFT JOIN routes r ON t.route_id = r.id
    LEFT JOIN users u ON t.leader_id = u.id
    LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.status = 'approved'
    WHERE 1=1
  `
  const params: any[] = []

  if (status) {
    sql += ' AND t.status = ?'
    params.push(status)
  }
  if (routeId) {
    sql += ' AND t.route_id = ?'
    params.push(routeId)
  }

  sql += ' GROUP BY t.id ORDER BY t.created_at DESC'

  const teams = db.prepare(sql).all(...params) as any[]
  const result = teams.map(t => ({
    ...t,
    route_photo: t.route_photos ? JSON.parse(t.route_photos)[0] || null : null,
    route_photos: undefined
  }))
  res.json({ success: true, data: result })
})

router.get('/:id', (req: Request, res: Response): void => {
  const team = db.prepare(`
    SELECT t.*, r.name as route_name, r.photos as route_photos, u.username as leader_name,
      (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id AND tm.status = 'approved') as approved_count
    FROM teams t
    LEFT JOIN routes r ON t.route_id = r.id
    LEFT JOIN users u ON t.leader_id = u.id
    WHERE t.id = ?
  `).get(req.params.id) as any

  if (!team) {
    res.status(404).json({ success: false, error: '队伍不存在' })
    return
  }

  const members = db.prepare(`
    SELECT tm.*, u.username, u.avatar
    FROM team_members tm
    LEFT JOIN users u ON tm.user_id = u.id
    WHERE tm.team_id = ?
    ORDER BY tm.joined_at ASC
  `).all(team.id) as any[]

  const messages = db.prepare(`
    SELECT m.*, u.username, u.avatar
    FROM messages m
    LEFT JOIN users u ON m.user_id = u.id
    WHERE m.team_id = ?
    ORDER BY m.created_at ASC
  `).all(team.id) as any[]

  const itineraries = db.prepare(`
    SELECT * FROM team_itineraries WHERE team_id = ? ORDER BY day_index ASC
  `).all(team.id) as any[]

  res.json({
    success: true,
    data: {
      ...team,
      route_photo: team.route_photos ? JSON.parse(team.route_photos)[0] || null : null,
      route_photos: undefined,
      members,
      messages,
      itineraries
    }
  })
})

router.post('/', authMiddleware, (req: Request, res: Response): void => {
  const { routeId, date, meetingPoint, expectedCount, notes } = req.body
  const route_id = routeId
  const meeting_point = meetingPoint
  const expected_count = expectedCount

  if (!route_id || !date || !meeting_point) {
    res.status(400).json({ success: false, error: '缺少必填字段' })
    return
  }

  const route = db.prepare('SELECT id FROM routes WHERE id = ?').get(route_id)
  if (!route) {
    res.status(404).json({ success: false, error: '路线不存在' })
    return
  }

  const id = uuidv4()
  db.prepare(`
    INSERT INTO teams (id, route_id, leader_id, date, meeting_point, expected_count, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'recruiting')
  `).run(id, route_id, req.user!.userId, date, meeting_point, expected_count || 10, notes || '')

  const memberId = uuidv4()
  db.prepare(`
    INSERT INTO team_members (id, team_id, user_id, status)
    VALUES (?, ?, ?, 'approved')
  `).run(memberId, id, req.user!.userId)

  const team = db.prepare(`
    SELECT t.*, r.name as route_name, r.photos as route_photos, u.username as leader_name,
      (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id AND tm.status = 'approved') as approved_count
    FROM teams t
    LEFT JOIN routes r ON t.route_id = r.id
    LEFT JOIN users u ON t.leader_id = u.id
    WHERE t.id = ?
  `).get(id) as any

  const teamWithPhoto = {
    ...team,
    route_photo: team.route_photos ? JSON.parse(team.route_photos)[0] || null : null,
    route_photos: undefined
  }

  res.status(201).json({ success: true, data: teamWithPhoto })
})

router.post('/:id/join', authMiddleware, (req: Request, res: Response): void => {
  const teamId = req.params.id
  const userId = req.user!.userId
  const { intro, experience } = req.body

  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId) as any
  if (!team) {
    res.status(404).json({ success: false, error: '队伍不存在' })
    return
  }

  if (team.status === 'full' || team.status === 'completed') {
    res.status(400).json({ success: false, error: '队伍已满或已结束' })
    return
  }

  if (team.leader_id === userId) {
    res.status(400).json({ success: false, error: '你是队长，无需申请' })
    return
  }

  const existing = db.prepare('SELECT id FROM team_members WHERE team_id = ? AND user_id = ?').get(teamId, userId) as any
  if (existing) {
    res.status(409).json({ success: false, error: '已申请过该队伍' })
    return
  }

  const id = uuidv4()
  db.prepare(`
    INSERT INTO team_members (id, team_id, user_id, status, intro, experience)
    VALUES (?, ?, ?, 'pending', ?, ?)
  `).run(id, teamId, userId, intro || null, experience || null)

  res.status(201).json({ success: true, data: { id, teamId, userId, status: 'pending' } })
})

router.put('/:id/approve', authMiddleware, (req: Request, res: Response): void => {
  const teamId = req.params.id
  const { userId, approved } = req.body

  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId) as any
  if (!team) {
    res.status(404).json({ success: false, error: '队伍不存在' })
    return
  }

  if (team.leader_id !== req.user!.userId) {
    res.status(403).json({ success: false, error: '仅队长可以审批成员' })
    return
  }

  const member = db.prepare(`
    SELECT tm.*, u.username
    FROM team_members tm
    LEFT JOIN users u ON tm.user_id = u.id
    WHERE tm.team_id = ? AND tm.user_id = ?
  `).get(teamId, userId) as any
  if (!member) {
    res.status(404).json({ success: false, error: '该用户未申请加入' })
    return
  }

  if (approved) {
    db.prepare('UPDATE team_members SET status = ? WHERE team_id = ? AND user_id = ?').run('approved', teamId, userId)

    const approvedCount = db.prepare("SELECT COUNT(*) as count FROM team_members WHERE team_id = ? AND status = 'approved'").get(teamId) as any
    if (approvedCount.count >= team.expected_count) {
      db.prepare("UPDATE teams SET status = 'full' WHERE id = ?").run(teamId)
    }

    const msgId = uuidv4()
    const systemContent = `🎉 ${member.username} 已通过审核，加入了队伍`
    db.prepare(`
      INSERT INTO messages (id, team_id, user_id, content, type)
      VALUES (?, ?, ?, ?, 'system')
    `).run(msgId, teamId, team.leader_id, systemContent)
  } else {
    db.prepare('DELETE FROM team_members WHERE team_id = ? AND user_id = ?').run(teamId, userId)
  }

  res.json({ success: true, data: { userId, approved } })
})

router.delete('/:id/members/:userId', authMiddleware, (req: Request, res: Response): void => {
  const teamId = req.params.id
  const targetUserId = req.params.userId

  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId) as any
  if (!team) {
    res.status(404).json({ success: false, error: '队伍不存在' })
    return
  }

  if (team.leader_id !== req.user!.userId) {
    res.status(403).json({ success: false, error: '仅队长可以移除成员' })
    return
  }

  if (targetUserId === team.leader_id) {
    res.status(400).json({ success: false, error: '不能移除队长' })
    return
  }

  db.prepare('DELETE FROM team_members WHERE team_id = ? AND user_id = ?').run(teamId, targetUserId)

  const approvedCount = db.prepare("SELECT COUNT(*) as count FROM team_members WHERE team_id = ? AND status = 'approved'").get(teamId) as any
  if (approvedCount.count < team.expected_count && team.status === 'full') {
    db.prepare("UPDATE teams SET status = 'recruiting' WHERE id = ?").run(teamId)
  }

  res.json({ success: true, data: { removed: true } })
})

router.put('/:id/itineraries', authMiddleware, (req: Request, res: Response): void => {
  const teamId = req.params.id
  const userId = req.user!.userId
  const { itineraries }: { itineraries: { id?: string; dayIndex: number; routeNode: string; accommodation?: string; duration?: string; notes?: string }[] } = req.body

  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId) as any
  if (!team) {
    res.status(404).json({ success: false, error: '队伍不存在' })
    return
  }

  if (team.leader_id !== userId) {
    res.status(403).json({ success: false, error: '仅队长可以编辑行程' })
    return
  }

  if (!Array.isArray(itineraries)) {
    res.status(400).json({ success: false, error: '行程格式不正确' })
    return
  }

  db.prepare('DELETE FROM team_itineraries WHERE team_id = ?').run(teamId)

  const insertItinerary = db.prepare(`
    INSERT INTO team_itineraries (id, team_id, day_index, route_node, accommodation, duration, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const saved: any[] = []
  itineraries.forEach((it) => {
    if (!it.routeNode?.trim()) return
    const id = it.id || uuidv4()
    insertItinerary.run(id, teamId, it.dayIndex || 1, it.routeNode, it.accommodation || null, it.duration || null, it.notes || null)
    saved.push({ id, team_id: teamId, day_index: it.dayIndex, route_node: it.routeNode, accommodation: it.accommodation || null, duration: it.duration || null, notes: it.notes || null })
  })

  res.json({ success: true, data: saved })
})

router.get('/:id/messages', authMiddleware, (req: Request, res: Response): void => {
  const teamId = req.params.id

  const member = db.prepare(`
    SELECT id FROM team_members WHERE team_id = ? AND user_id = ? AND status = 'approved'
  `).get(teamId, req.user!.userId) as any

  if (!member) {
    res.status(403).json({ success: false, error: '你不是该队伍成员' })
    return
  }

  const messages = db.prepare(`
    SELECT m.*, u.username, u.avatar
    FROM messages m
    LEFT JOIN users u ON m.user_id = u.id
    WHERE m.team_id = ?
    ORDER BY m.created_at ASC
  `).all(teamId) as any[]

  res.json({ success: true, data: messages })
})

router.post('/:id/messages', authMiddleware, (req: Request, res: Response): void => {
  const teamId = req.params.id
  const { content, type } = req.body

  if (!content) {
    res.status(400).json({ success: false, error: '消息内容不能为空' })
    return
  }

  const member = db.prepare(`
    SELECT id FROM team_members WHERE team_id = ? AND user_id = ? AND status = 'approved'
  `).get(teamId, req.user!.userId) as any

  if (!member) {
    res.status(403).json({ success: false, error: '你不是该队伍已审核成员' })
    return
  }

  const id = uuidv4()
  db.prepare(`
    INSERT INTO messages (id, team_id, user_id, content, type)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, teamId, req.user!.userId, content, type || 'text')

  const message = db.prepare(`
    SELECT m.*, u.username, u.avatar
    FROM messages m
    LEFT JOIN users u ON m.user_id = u.id
    WHERE m.id = ?
  `).get(id) as any

  res.status(201).json({ success: true, data: message })
})

export default router

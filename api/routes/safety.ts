import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.post('/checkin', authMiddleware, (req: Request, res: Response): void => {
  const { teamId, routeId, expectedReturnTime } = req.body
  const userId = req.user!.userId

  if (!routeId || !expectedReturnTime) {
    res.status(400).json({ success: false, error: '路线ID和预计返回时间不能为空' })
    return
  }

  const route = db.prepare('SELECT id FROM routes WHERE id = ?').get(routeId)
  if (!route) {
    res.status(404).json({ success: false, error: '路线不存在' })
    return
  }

  const activeCheckin = db.prepare(
    "SELECT id FROM safety_checkins WHERE user_id = ? AND status = 'active'"
  ).get(userId) as any

  if (activeCheckin) {
    res.status(409).json({ success: false, error: '已有进行中的安全签到' })
    return
  }

  const id = uuidv4()
  db.prepare(`
    INSERT INTO safety_checkins (id, user_id, team_id, route_id, expected_return_time, status)
    VALUES (?, ?, ?, ?, ?, 'active')
  `).run(id, userId, teamId || null, routeId, expectedReturnTime)

  const checkin = db.prepare('SELECT * FROM safety_checkins WHERE id = ?').get(id) as any
  res.status(201).json({ success: true, data: checkin })
})

router.post('/checkout', authMiddleware, (req: Request, res: Response): void => {
  const userId = req.user!.userId

  const activeCheckin = db.prepare(
    "SELECT * FROM safety_checkins WHERE user_id = ? AND status = 'active'"
  ).get(userId) as any

  if (!activeCheckin) {
    res.status(404).json({ success: false, error: '没有进行中的安全签到' })
    return
  }

  db.prepare(`
    UPDATE safety_checkins SET checkout_time = datetime('now'), status = 'returned'
    WHERE id = ?
  `).run(activeCheckin.id)

  const checkin = db.prepare('SELECT * FROM safety_checkins WHERE id = ?').get(activeCheckin.id) as any
  res.json({ success: true, data: checkin })
})

router.get('/status', authMiddleware, (req: Request, res: Response): void => {
  const userId = req.user!.userId

  const activeCheckin = db.prepare(`
    SELECT sc.*, r.name as route_name
    FROM safety_checkins sc
    LEFT JOIN routes r ON sc.route_id = r.id
    WHERE sc.user_id = ? AND sc.status = 'active'
  `).get(userId) as any

  res.json({ success: true, data: activeCheckin || null })
})

router.put('/contacts', authMiddleware, (req: Request, res: Response): void => {
  const userId = req.user!.userId
  const { contacts } = req.body

  if (!Array.isArray(contacts)) {
    res.status(400).json({ success: false, error: '联系人格式不正确' })
    return
  }

  db.prepare('DELETE FROM emergency_contacts WHERE user_id = ?').run(userId)

  const insertContact = db.prepare(
    'INSERT INTO emergency_contacts (id, user_id, name, phone) VALUES (?, ?, ?, ?)'
  )

  for (const contact of contacts) {
    if (contact.name && contact.phone) {
      insertContact.run(uuidv4(), userId, contact.name, contact.phone)
    }
  }

  const savedContacts = db.prepare('SELECT * FROM emergency_contacts WHERE user_id = ?').all(userId) as any[]
  res.json({ success: true, data: savedContacts })
})

router.get('/contacts', authMiddleware, (req: Request, res: Response): void => {
  const userId = req.user!.userId

  const contacts = db.prepare('SELECT * FROM emergency_contacts WHERE user_id = ?').all(userId) as any[]
  res.json({ success: true, data: contacts })
})

export default router

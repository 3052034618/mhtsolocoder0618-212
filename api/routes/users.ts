import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/me/routes', authMiddleware, (req: Request, res: Response): void => {
  const routes = db.prepare(`
    SELECT r.*,
      COALESCE(AVG(rv.rating), 0) as avg_rating,
      COUNT(DISTINCT rv.id) as review_count,
      COUNT(DISTINCT f.id) as favorite_count
    FROM routes r
    LEFT JOIN reviews rv ON r.id = rv.route_id
    LEFT JOIN favorites f ON r.id = f.route_id
    WHERE r.author_id = ?
    GROUP BY r.id
    ORDER BY r.created_at DESC
  `).all(req.user!.userId) as any[]

  const result = routes.map(r => ({
    ...r,
    season_recommendation: JSON.parse(r.season_recommendation || '[]'),
    photos: JSON.parse(r.photos || '[]'),
    avg_rating: Math.round(r.avg_rating * 10) / 10
  }))

  res.json({ success: true, data: result })
})

router.get('/me/favorites', authMiddleware, (req: Request, res: Response): void => {
  const routes = db.prepare(`
    SELECT r.*, u.username as author_name,
      COALESCE(AVG(rv.rating), 0) as avg_rating,
      COUNT(DISTINCT rv.id) as review_count
    FROM favorites f
    JOIN routes r ON f.route_id = r.id
    LEFT JOIN users u ON r.author_id = u.id
    LEFT JOIN reviews rv ON r.id = rv.route_id
    WHERE f.user_id = ?
    GROUP BY r.id
    ORDER BY f.created_at DESC
  `).all(req.user!.userId) as any[]

  const result = routes.map(r => ({
    ...r,
    season_recommendation: JSON.parse(r.season_recommendation || '[]'),
    photos: JSON.parse(r.photos || '[]'),
    avg_rating: Math.round(r.avg_rating * 10) / 10
  }))

  res.json({ success: true, data: result })
})

router.get('/me/teams', authMiddleware, (req: Request, res: Response): void => {
  const teams = db.prepare(`
    SELECT t.*, r.name as route_name, u.username as leader_name,
      COUNT(DISTINCT tm2.id) as member_count,
      tm.status as my_status
    FROM team_members tm
    JOIN teams t ON tm.team_id = t.id
    LEFT JOIN routes r ON t.route_id = r.id
    LEFT JOIN users u ON t.leader_id = u.id
    LEFT JOIN team_members tm2 ON t.id = tm2.team_id AND tm2.status = 'approved'
    WHERE tm.user_id = ?
    GROUP BY t.id
    ORDER BY t.created_at DESC
  `).all(req.user!.userId) as any[]

  res.json({ success: true, data: teams })
})

router.get('/:id/profile', (req: Request, res: Response): void => {
  const user = db.prepare(
    'SELECT id, username, avatar, created_at FROM users WHERE id = ?'
  ).get(req.params.id) as any

  if (!user) {
    res.status(404).json({ success: false, error: '用户不存在' })
    return
  }

  const routeCount = db.prepare('SELECT COUNT(*) as count FROM routes WHERE author_id = ?').get(user.id) as any
  const reviewCount = db.prepare('SELECT COUNT(*) as count FROM reviews WHERE user_id = ?').get(user.id) as any

  res.json({
    success: true,
    data: { ...user, route_count: routeCount.count, review_count: reviewCount.count }
  })
})

export default router

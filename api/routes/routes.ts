import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

const photosStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads', 'photos'))
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuidv4()}${ext}`)
  }
})

const gpxStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads', 'gpx'))
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuidv4()}${ext}`)
  }
})

const uploadPhotos = multer({ storage: photosStorage })
const uploadGpx = multer({ storage: gpxStorage })

router.get('/', (req: Request, res: Response): void => {
  const { province, difficulty, duration, startPoint } = req.query

  let sql = `
    SELECT r.*, u.username as author_name,
      COALESCE(AVG(rv.rating), 0) as average_rating,
      COUNT(DISTINCT rv.id) as review_count,
      COUNT(DISTINCT f.id) as favorite_count
    FROM routes r
    LEFT JOIN users u ON r.author_id = u.id
    LEFT JOIN reviews rv ON r.id = rv.route_id
    LEFT JOIN favorites f ON r.id = f.route_id
    WHERE 1=1
  `
  const params: any[] = []

  if (province) {
    sql += ' AND r.province = ?'
    params.push(province)
  }
  if (difficulty) {
    sql += ' AND r.difficulty = ?'
    params.push(difficulty)
  }
  if (duration) {
    sql += ' AND r.duration LIKE ?'
    params.push(`%${duration}%`)
  }
  if (startPoint) {
    sql += ' AND r.start_point LIKE ?'
    params.push(`%${startPoint}%`)
  }

  sql += ' GROUP BY r.id ORDER BY r.created_at DESC'

  const routes = db.prepare(sql).all(...params) as any[]

  const result = routes.map(r => ({
    ...r,
    season_recommendation: JSON.parse(r.season_recommendation || '[]'),
    photos: JSON.parse(r.photos || '[]'),
    average_rating: Math.round(r.average_rating * 10) / 10
  }))

  res.json({ success: true, data: result })
})

router.get('/:id', (req: Request, res: Response): void => {
  const route = db.prepare(`
    SELECT r.*, u.username as author_name, u.avatar as author_avatar
    FROM routes r
    LEFT JOIN users u ON r.author_id = u.id
    WHERE r.id = ?
  `).get(req.params.id) as any

  if (!route) {
    res.status(404).json({ success: false, error: '路线不存在' })
    return
  }

  const reviews = db.prepare(`
    SELECT rv.*, u.username, u.avatar
    FROM reviews rv
    LEFT JOIN users u ON rv.user_id = u.id
    WHERE rv.route_id = ?
    ORDER BY rv.created_at DESC
  `).all(route.id) as any[]

  const favoriteCount = db.prepare('SELECT COUNT(*) as count FROM favorites WHERE route_id = ?').get(route.id) as any
  const avgRating = db.prepare('SELECT COALESCE(AVG(rating), 0) as avg FROM reviews WHERE route_id = ?').get(route.id) as any

  res.json({
    success: true,
    data: {
      ...route,
      season_recommendation: JSON.parse(route.season_recommendation || '[]'),
      photos: JSON.parse(route.photos || '[]'),
      average_rating: Math.round(avgRating.avg * 10) / 10,
      favorite_count: favoriteCount.count,
      reviews
    }
  })
})

router.post('/', authMiddleware, uploadPhotos.array('photos', 9), uploadGpx.single('gpx'), (req: Request, res: Response): void => {
  const { name, province, startPoint, distance, elevationGain, elevationLoss, difficulty, duration, seasonRecommendation, precautions } = req.body
  const start_point = startPoint
  const elevation_gain = Number(elevationGain) || 0
  const elevation_loss = Number(elevationLoss) || 0
  const season_recommendation = seasonRecommendation

  if (!name || !province || !start_point || !distance || !difficulty) {
    res.status(400).json({ success: false, error: '缺少必填字段' })
    return
  }

  const id = uuidv4()
  const photos = (req.files as Express.Multer.File[] || []).map(f => `/uploads/photos/${f.filename}`)
  const gpxUrl = req.file ? `/uploads/gpx/${req.file.filename}` : null
  const seasonRec = Array.isArray(season_recommendation)
    ? season_recommendation
    : (season_recommendation ? JSON.parse(season_recommendation) : [])

  db.prepare(`
    INSERT INTO routes (id, name, province, start_point, distance, elevation_gain, elevation_loss,
      difficulty, duration, season_recommendation, precautions, photos, gpx_url, author_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, name, province, start_point, Number(distance), elevation_gain, elevation_loss,
    difficulty, duration, JSON.stringify(seasonRec), precautions || '', JSON.stringify(photos), gpxUrl, req.user!.userId
  )

  const route = db.prepare('SELECT * FROM routes WHERE id = ?').get(id) as any
  res.status(201).json({
    success: true,
    data: {
      ...route,
      season_recommendation: JSON.parse(route.season_recommendation || '[]'),
      photos: JSON.parse(route.photos || '[]')
    }
  })
})

router.post('/:id/favorite', authMiddleware, (req: Request, res: Response): void => {
  const routeId = req.params.id
  const userId = req.user!.userId

  const route = db.prepare('SELECT id FROM routes WHERE id = ?').get(routeId)
  if (!route) {
    res.status(404).json({ success: false, error: '路线不存在' })
    return
  }

  const existing = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND route_id = ?').get(userId, routeId) as any

  if (existing) {
    db.prepare('DELETE FROM favorites WHERE id = ?').run(existing.id)
    res.json({ success: true, data: { favorited: false } })
  } else {
    const id = uuidv4()
    db.prepare('INSERT INTO favorites (id, user_id, route_id) VALUES (?, ?, ?)').run(id, userId, routeId)
    res.json({ success: true, data: { favorited: true } })
  }
})

router.get('/:id/reviews', (req: Request, res: Response): void => {
  const reviews = db.prepare(`
    SELECT rv.*, u.username, u.avatar
    FROM reviews rv
    LEFT JOIN users u ON rv.user_id = u.id
    WHERE rv.route_id = ?
    ORDER BY rv.created_at DESC
  `).all(req.params.id) as any[]

  res.json({ success: true, data: reviews })
})

router.post('/:id/reviews', authMiddleware, (req: Request, res: Response): void => {
  const routeId = req.params.id
  const userId = req.user!.userId
  const { season, actual_duration, difficulty_feeling, rating, content } = req.body

  if (!rating || !content) {
    res.status(400).json({ success: false, error: '评分和评价内容不能为空' })
    return
  }

  const route = db.prepare('SELECT id FROM routes WHERE id = ?').get(routeId)
  if (!route) {
    res.status(404).json({ success: false, error: '路线不存在' })
    return
  }

  const id = uuidv4()
  db.prepare(`
    INSERT INTO reviews (id, route_id, user_id, season, actual_duration, difficulty_feeling, rating, content)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, routeId, userId, season || '', actual_duration || '', difficulty_feeling || '', Number(rating), content)

  const review = db.prepare(`
    SELECT rv.*, u.username, u.avatar
    FROM reviews rv
    LEFT JOIN users u ON rv.user_id = u.id
    WHERE rv.id = ?
  `).get(id) as any

  res.status(201).json({ success: true, data: review })
})

export default router

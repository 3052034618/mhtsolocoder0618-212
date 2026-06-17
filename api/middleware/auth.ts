import { type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = 'shanjing-secret-key-2024'

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string
        username: string
      }
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: '未提供认证令牌' })
    return
  }

  const token = authHeader.substring(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string }
    req.user = { userId: decoded.userId, username: decoded.username }
    next()
  } catch {
    res.status(401).json({ success: false, error: '令牌无效或已过期' })
  }
}

export { JWT_SECRET }

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Heart, Clock, Mountain, AlertTriangle, Star, Calendar, X, Send } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/hooks/useAuthStore'
import DifficultyBadge from '@/components/DifficultyBadge'
import StarRating from '@/components/StarRating'
import TeamCard from '@/components/TeamCard'
import type { Route as RouteType, Review, Team } from '@/types'

export default function RouteDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [route, setRoute] = useState<RouteType | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [photoModal, setPhotoModal] = useState<string | null>(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [newReview, setNewReview] = useState({ rating: 5, content: '', season: '', actualDuration: '', difficultyFeeling: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      api.routes.get(id).catch(() => null),
      api.routes.reviews(id).catch(() => []),
      api.teams.list({ routeId: id }).catch(() => []),
    ]).then(([routeData, reviewsData, teamsData]) => {
      setRoute(routeData)
      setReviews(reviewsData || [])
      setTeams(teamsData || [])
      setLoading(false)
    })
  }, [id])

  const handleToggleFavorite = async () => {
    if (!id || !user) return
    try {
      await api.routes.toggleFavorite(id)
      setRoute(prev => prev ? { ...prev, isFavorited: !prev.isFavorited, favoriteCount: prev.isFavorited ? prev.favoriteCount - 1 : prev.favoriteCount + 1 } : prev)
    } catch {}
  }

  const handleSubmitReview = async () => {
    if (!id || !newReview.content.trim()) return
    setSubmitting(true)
    try {
      await api.routes.addReview(id, newReview)
      const updatedReviews = await api.routes.reviews(id)
      setReviews(updatedReviews || [])
      setShowReviewForm(false)
      setNewReview({ rating: 5, content: '', season: '', actualDuration: '', difficultyFeeling: '' })
    } catch {} finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-20 bg-fog-200 rounded" />
          <div className="h-[400px] bg-fog-200 rounded-xl" />
          <div className="h-8 w-3/4 bg-fog-200 rounded" />
          <div className="h-6 w-1/2 bg-fog-200 rounded" />
        </div>
      </div>
    )
  }

  if (!route) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-400 text-lg">路线未找到</p>
        <button onClick={() => navigate('/')} className="btn-primary mt-4">返回首页</button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-forest-600 hover:text-forest-700 mb-4 transition-colors">
        <ArrowLeft size={18} />
        <span className="text-sm font-medium">返回</span>
      </button>

      <div className="relative h-[400px] rounded-xl overflow-hidden mb-6">
        <img src={route.photos?.[0] || '/favicon.svg'} alt={route.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-white mb-2">{route.name}</h1>
          <div className="flex items-center gap-3 text-white/80 text-sm">
            <span>{route.authorName}</span>
            <span>·</span>
            <Calendar size={14} />
            <span>{new Date(route.createdAt).toLocaleDateString('zh-CN')}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleToggleFavorite}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border transition-colors ${
            route.isFavorited ? 'border-red-200 bg-red-50 text-red-500' : 'border-fog-300 text-gray-500 hover:border-red-200 hover:text-red-400'
          }`}
        >
          <Heart size={16} className={route.isFavorited ? 'fill-red-500' : ''} />
          <span className="text-sm">{route.favoriteCount}</span>
        </button>
        {user && (
          <button onClick={() => setShowReviewForm(true)} className="btn-secondary text-sm">
            写评价
          </button>
        )}
      </div>

      <div className="card-static p-6 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-fog-50 rounded-lg">
            <Mountain size={20} className="mx-auto text-forest-500 mb-1" />
            <p className="text-lg font-semibold text-forest-800">{route.distance}km</p>
            <p className="text-xs text-gray-400">距离</p>
          </div>
          <div className="text-center p-3 bg-fog-50 rounded-lg">
            <Mountain size={20} className="mx-auto text-sand-500 mb-1" />
            <p className="text-lg font-semibold text-forest-800">↑{route.elevationGain}m</p>
            <p className="text-xs text-gray-400">累计爬升</p>
          </div>
          <div className="text-center p-3 bg-fog-50 rounded-lg">
            <Mountain size={20} className="mx-auto text-warning-400 mb-1" />
            <p className="text-lg font-semibold text-forest-800">↓{route.elevationLoss}m</p>
            <p className="text-xs text-gray-400">累计下降</p>
          </div>
          <div className="text-center p-3 bg-fog-50 rounded-lg">
            <Clock size={20} className="mx-auto text-forest-500 mb-1" />
            <p className="text-lg font-semibold text-forest-800">{route.duration}</p>
            <p className="text-xs text-gray-400">预计时长</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-gray-500">难度</span>
          <DifficultyBadge difficulty={route.difficulty} />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-500">推荐季节</span>
          <div className="flex gap-1.5">
            {route.seasonRecommendation?.map(s => (
              <span key={s} className="px-2 py-0.5 text-xs bg-forest-50 text-forest-700 rounded-full">{s}</span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1 mb-2">
          <Star size={14} className="fill-sand-400 text-sand-400" />
          <span className="text-sm font-medium">{route.averageRating?.toFixed(1) || '-'}</span>
        </div>
      </div>

      {route.precautions && (
        <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 mb-6 flex gap-3">
          <AlertTriangle size={20} className="text-warning-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-warning-600 mb-1">注意事项</h3>
            <p className="text-sm text-warning-700 whitespace-pre-line">{route.precautions}</p>
          </div>
        </div>
      )}

      {route.photos?.length > 1 && (
        <div className="mb-8">
          <h2 className="section-title mb-4">路线照片</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {route.photos.map((photo, i) => (
              <button key={i} onClick={() => setPhotoModal(photo)} className="aspect-square rounded-lg overflow-hidden hover:opacity-90 transition-opacity">
                <img src={photo} alt={`${route.name} ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="section-title mb-4">用户评价 ({reviews.length})</h2>
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map(review => (
              <div key={review.id} className="card-static p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-forest-100 flex items-center justify-center text-xs font-bold text-forest-700">
                      {review.userName?.[0] || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-forest-800">{review.userName}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{new Date(review.createdAt).toLocaleDateString('zh-CN')}</span>
                        {review.season && <span className="px-1.5 py-0.5 bg-forest-50 text-forest-600 rounded">{review.season}</span>}
                        {review.actualDuration && <span>{review.actualDuration}</span>}
                        {review.difficultyFeeling && <span>感受: {review.difficultyFeeling}</span>}
                      </div>
                    </div>
                  </div>
                  <StarRating rating={review.rating} size={14} />
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{review.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-8 text-gray-400">暂无评价</p>
        )}
      </div>

      {teams.length > 0 && (
        <div className="mb-8">
          <h2 className="section-title mb-4">相关组队</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {teams.map(team => <TeamCard key={team.id} team={team} />)}
          </div>
        </div>
      )}

      {photoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPhotoModal(null)}>
          <button onClick={() => setPhotoModal(null)} className="absolute top-4 right-4 text-white/80 hover:text-white">
            <X size={28} />
          </button>
          <img src={photoModal} alt="放大查看" className="max-w-full max-h-[85vh] object-contain rounded-lg" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {showReviewForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowReviewForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-semibold text-forest-800">写评价</h3>
              <button onClick={() => setShowReviewForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label-text">评分</label>
                <StarRating rating={newReview.rating} interactive onChange={r => setNewReview(prev => ({ ...prev, rating: r }))} size={24} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-text">出行季节</label>
                  <select value={newReview.season} onChange={e => setNewReview(prev => ({ ...prev, season: e.target.value }))} className="input-field">
                    <option value="">选择季节</option>
                    <option value="春">春</option>
                    <option value="夏">夏</option>
                    <option value="秋">秋</option>
                    <option value="冬">冬</option>
                  </select>
                </div>
                <div>
                  <label className="label-text">实际用时</label>
                  <input value={newReview.actualDuration} onChange={e => setNewReview(prev => ({ ...prev, actualDuration: e.target.value }))} placeholder="如: 5小时" className="input-field" />
                </div>
              </div>
              <div>
                <label className="label-text">难度感受</label>
                <select value={newReview.difficultyFeeling} onChange={e => setNewReview(prev => ({ ...prev, difficultyFeeling: e.target.value }))} className="input-field">
                  <option value="">选择感受</option>
                  <option value="简单">简单</option>
                  <option value="中等">中等</option>
                  <option value="困难">困难</option>
                  <option value="专家">专家</option>
                </select>
              </div>
              <div>
                <label className="label-text">评价内容</label>
                <textarea
                  value={newReview.content}
                  onChange={e => setNewReview(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  placeholder="分享你的徒步体验..."
                  className="input-field resize-none"
                />
              </div>
              <button onClick={handleSubmitReview} disabled={submitting || !newReview.content.trim()} className="btn-primary w-full flex items-center justify-center gap-2">
                <Send size={16} />
                {submitting ? '提交中...' : '提交评价'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

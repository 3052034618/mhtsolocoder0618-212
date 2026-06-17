import { Link } from 'react-router-dom'
import { Heart, Star, Clock, Mountain } from 'lucide-react'
import DifficultyBadge from './DifficultyBadge'
import type { Route } from '@/types'

interface RouteCardProps {
  route: Route
}

export default function RouteCard({ route }: RouteCardProps) {
  return (
    <Link to={`/route/${route.id}`} className="card flex overflow-hidden group">
      <div className="w-2/5 min-h-[180px] shrink-0">
        <img
          src={route.photos?.[0] || '/favicon.svg'}
          alt={route.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-serif text-lg font-semibold text-forest-800 line-clamp-1">{route.name}</h3>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <DifficultyBadge difficulty={route.difficulty} />
            <span className="text-xs text-gray-400">{route.province}</span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Mountain size={14} className="text-forest-500" />
            {route.distance}km
          </span>
          <span className="flex items-center gap-1">
            <Mountain size={14} className="text-sand-500" />
            ↑{route.elevationGain}m
          </span>
          <span className="flex items-center gap-1">
            <Clock size={14} className="text-forest-500" />
            {route.duration}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star size={14} className="fill-sand-400 text-sand-400" />
            <span className="text-sm font-medium text-gray-700">{route.averageRating?.toFixed(1) || '-'}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-400">
            <Heart
              size={16}
              className={`${route.isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-300'} transition-colors`}
            />
            <span>{route.favoriteCount || 0}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

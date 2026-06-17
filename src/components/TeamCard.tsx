import { Link } from 'react-router-dom'
import { MapPin, Users } from 'lucide-react'

interface TeamCardProps {
  team: {
    id: string
    routeName: string
    routePhoto?: string
    date: string
    meetingPoint: string
    expectedCount: number
    approvedCount?: number
    status: string
  }
}

const statusConfig: Record<string, { label: string; color: string }> = {
  recruiting: { label: '招募中', color: 'bg-green-100 text-green-700' },
  confirmed: { label: '已确认', color: 'bg-blue-100 text-blue-700' },
  full: { label: '已满', color: 'bg-gray-100 text-gray-500' },
}

export default function TeamCard({ team }: TeamCardProps) {
  const status = statusConfig[team.status] || statusConfig.recruiting
  const approved = team.approvedCount || 0
  const progress = team.expectedCount > 0 ? Math.min((approved / team.expectedCount) * 100, 100) : 0

  return (
    <Link
      to={`/team/${team.id}`}
      className="card shrink-0 w-64 overflow-hidden group"
    >
      <div className="relative h-32">
        <img
          src={team.routePhoto || '/favicon.svg'}
          alt={team.routeName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-900/80 to-transparent" />
        <div className="absolute bottom-2 left-3 right-3">
          <h4 className="text-white font-serif font-semibold text-sm truncate">{team.routeName}</h4>
          <p className="text-white/70 text-xs mt-0.5">{team.date}</p>
        </div>
        <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
          {status.label}
        </span>
      </div>

      <div className="p-3">
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
          <MapPin size={12} className="text-forest-500 shrink-0" />
          <span className="truncate">{team.meetingPoint}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-fog-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-forest-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 shrink-0 flex items-center gap-0.5">
            <Users size={12} />
            {approved}/{team.expectedCount}
          </span>
        </div>
      </div>
    </Link>
  )
}

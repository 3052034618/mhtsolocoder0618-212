import { Star } from 'lucide-react'

interface StarRatingProps {
  rating: number
  max?: number
  interactive?: boolean
  onChange?: (rating: number) => void
  size?: number
}

export default function StarRating({ rating, max = 5, interactive = false, onChange, size = 16 }: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => {
        const filled = i < rating
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(i + 1)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <Star
              size={size}
              className={filled ? 'fill-sand-400 text-sand-400' : 'text-gray-300'}
            />
          </button>
        )
      })}
    </div>
  )
}

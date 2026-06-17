export interface Route {
  id: string
  name: string
  province: string
  startPoint: string
  distance: number
  elevationGain: number
  elevationLoss: number
  difficulty: string
  duration: string
  seasonRecommendation: string[]
  precautions: string
  photos: string[]
  gpxUrl: string
  authorId: string
  authorName: string
  createdAt: string
  averageRating: number
  favoriteCount: number
  isFavorited?: boolean
}

export interface Review {
  id: string
  routeId: string
  userId: string
  userName: string
  userAvatar: string
  season: string
  actualDuration: string
  difficultyFeeling: string
  rating: number
  content: string
  createdAt: string
}

export interface Team {
  id: string
  routeId: string
  routeName: string
  routePhoto?: string
  leaderId: string
  leaderName: string
  date: string
  meetingPoint: string
  expectedCount: number
  notes: string
  status: string
  members: TeamMember[]
  createdAt: string
  approvedCount?: number
  itineraries?: ItineraryDay[]
}

export interface ItineraryDay {
  id: string
  teamId: string
  dayIndex: number
  routeNode: string
  accommodation?: string
  duration?: string
  notes?: string
}

export interface TeamMember {
  userId: string
  userName: string
  userAvatar: string
  status: 'pending' | 'approved' | 'rejected'
  joinedAt: string
  intro?: string | null
  experience?: string | null
}

export interface Message {
  id: string
  teamId: string
  userId: string
  userName: string
  content: string
  type: 'text' | 'system'
  createdAt: string
}

export interface SafetyCheckin {
  id: string
  userId: string
  teamId: string | null
  routeId: string | null
  checkinTime: string
  expectedReturnTime: string
  checkoutTime: string | null
  status: 'active' | 'completed' | 'overdue'
  routeName?: string
  teamName?: string
}

export interface EmergencyContact {
  id?: string
  name: string
  phone: string
}

export interface User {
  id: string
  username: string
  email: string
  avatar: string
  emergencyContacts: EmergencyContact[]
  createdAt: string
  routeCount?: number
  reviewCount?: number
}

export interface RouteFilters {
  province?: string
  difficulty?: string
  duration?: string
  startPoint?: string
}

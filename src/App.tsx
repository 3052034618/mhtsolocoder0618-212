import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/hooks/useAuthStore'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import RouteDetail from '@/pages/RouteDetail'
import NewRoute from '@/pages/NewRoute'
import Teams from '@/pages/Teams'
import TeamDetail from '@/pages/TeamDetail'
import NewTeam from '@/pages/NewTeam'
import Profile from '@/pages/Profile'
import Login from '@/pages/Login'
import Register from '@/pages/Register'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/route/:id" element={<Layout><RouteDetail /></Layout>} />
        <Route path="/route/new" element={<Layout><ProtectedRoute><NewRoute /></ProtectedRoute></Layout>} />
        <Route path="/teams" element={<Layout><Teams /></Layout>} />
        <Route path="/team/:id" element={<Layout><TeamDetail /></Layout>} />
        <Route path="/team/new" element={<Layout><ProtectedRoute><NewTeam /></ProtectedRoute></Layout>} />
        <Route path="/profile" element={<Layout><ProtectedRoute><Profile /></ProtectedRoute></Layout>} />
        <Route path="/login" element={<Layout><Login /></Layout>} />
        <Route path="/register" element={<Layout><Register /></Layout>} />
      </Routes>
    </Router>
  )
}

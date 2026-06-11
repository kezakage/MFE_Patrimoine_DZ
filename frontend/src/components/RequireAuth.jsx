import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const loc = useLocation()
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-sand-500">
        <Loader2 size={24} className="animate-spin"/>
      </div>
    )
  }
  if (!user) return <Navigate to="/connexion" state={{ from: loc.pathname }} replace />
  return children
}

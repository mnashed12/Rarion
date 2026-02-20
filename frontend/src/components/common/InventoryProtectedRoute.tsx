import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface InventoryProtectedRouteProps {
  children: ReactNode
}

export function InventoryProtectedRoute({ children }: InventoryProtectedRouteProps) {
  const { isInventoryAuthenticated } = useAuth()

  if (!isInventoryAuthenticated) {
    // Silently redirect — nav item is hidden so only direct URL access gets here
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

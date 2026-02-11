import { ReactNode } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { LoginModal } from '../common/LoginModal'
import { useNavigate } from 'react-router-dom'

interface InventoryProtectedRouteProps {
  children: ReactNode
}

export function InventoryProtectedRoute({ children }: InventoryProtectedRouteProps) {
  const { isInventoryAuthenticated, loginToInventory } = useAuth()
  const navigate = useNavigate()

  if (!isInventoryAuthenticated) {
    return (
      <LoginModal
        title="Inventory Access Required"
        description="Please enter the password to view inventory"
        onSubmit={loginToInventory}
        showClose={true}
        onClose={() => navigate('/')}
      />
    )
  }

  return <>{children}</>
}

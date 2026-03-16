import { ReactNode } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { LoginModal } from '../common/LoginModal'

interface AppProtectedRouteProps {
  children: ReactNode
}

export function AppProtectedRoute({ children }: AppProtectedRouteProps) {
  const { isInventoryAuthenticated, loginToInventory } = useAuth()

  if (!isInventoryAuthenticated) {
    return (
      <LoginModal
        title="Access Required"
        description="Please enter the password to access Rarion"
        onSubmit={loginToInventory}
        showClose={false}
      />
    )
  }

  return <>{children}</>
}

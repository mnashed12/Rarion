import { ReactNode } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { LoginModal } from '../common/LoginModal'

interface AppProtectedRouteProps {
  children: ReactNode
}

export function AppProtectedRoute({ children }: AppProtectedRouteProps) {
  const { isAppAuthenticated, loginToApp } = useAuth()

  if (!isAppAuthenticated) {
    return (
      <LoginModal
        title="Access Required"
        description="Please enter the password to access Rarion"
        onSubmit={loginToApp}
        showClose={false}
      />
    )
  }

  return <>{children}</>
}

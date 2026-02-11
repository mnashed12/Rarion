import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AuthContextType {
  isAppAuthenticated: boolean
  isInventoryAuthenticated: boolean
  loginToApp: (password: string) => boolean
  loginToInventory: (password: string) => boolean
  logoutFromApp: () => void
  logoutFromInventory: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAppAuthenticated, setIsAppAuthenticated] = useState(false)
  const [isInventoryAuthenticated, setIsInventoryAuthenticated] = useState(false)

  // Check localStorage on mount
  useEffect(() => {
    const appAuth = localStorage.getItem('app_auth')
    const inventoryAuth = localStorage.getItem('inventory_auth')
    
    if (appAuth === 'true') {
      setIsAppAuthenticated(true)
    }
    if (inventoryAuth === 'true') {
      setIsInventoryAuthenticated(true)
    }
  }, [])

  const loginToApp = (password: string): boolean => {
    const correctPassword = import.meta.env.VITE_APP_PASSWORD
    if (password === correctPassword) {
      setIsAppAuthenticated(true)
      localStorage.setItem('app_auth', 'true')
      return true
    }
    return false
  }

  const loginToInventory = (password: string): boolean => {
    const correctPassword = import.meta.env.VITE_INVENTORY_PASSWORD
    if (password === correctPassword) {
      setIsInventoryAuthenticated(true)
      localStorage.setItem('inventory_auth', 'true')
      return true
    }
    return false
  }

  const logoutFromApp = () => {
    setIsAppAuthenticated(false)
    setIsInventoryAuthenticated(false)
    localStorage.removeItem('app_auth')
    localStorage.removeItem('inventory_auth')
  }

  const logoutFromInventory = () => {
    setIsInventoryAuthenticated(false)
    localStorage.removeItem('inventory_auth')
  }

  return (
    <AuthContext.Provider
      value={{
        isAppAuthenticated,
        isInventoryAuthenticated,
        loginToApp,
        loginToInventory,
        logoutFromApp,
        logoutFromInventory,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

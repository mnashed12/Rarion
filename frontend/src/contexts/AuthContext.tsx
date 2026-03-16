import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AuthContextType {
  isInventoryAuthenticated: boolean
  currentUser: 'mina' | 'danny' | null
  loginToInventory: (password: string) => boolean
  logoutFromInventory: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isInventoryAuthenticated, setIsInventoryAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<'mina' | 'danny' | null>(null)

  // Check localStorage on mount
  useEffect(() => {
    const inventoryAuth = localStorage.getItem('inventory_auth')
    const storedUser = localStorage.getItem('app_user') as 'mina' | 'danny' | null

    if (inventoryAuth === 'true' && (storedUser === 'mina' || storedUser === 'danny')) {
      setIsInventoryAuthenticated(true)
      setCurrentUser(storedUser)
    }
  }, [])

  const loginToInventory = (password: string): boolean => {
    const minaPassword = import.meta.env.VITE_USER1_PASSWORD
    const dannyPassword = import.meta.env.VITE_USER2_PASSWORD
    if (password === minaPassword) {
      setIsInventoryAuthenticated(true)
      setCurrentUser('mina')
      localStorage.setItem('inventory_auth', 'true')
      localStorage.setItem('app_user', 'mina')
      return true
    }
    if (password === dannyPassword) {
      setIsInventoryAuthenticated(true)
      setCurrentUser('danny')
      localStorage.setItem('inventory_auth', 'true')
      localStorage.setItem('app_user', 'danny')
      return true
    }
    return false
  }

  const logoutFromInventory = () => {
    setIsInventoryAuthenticated(false)
    setCurrentUser(null)
    localStorage.removeItem('inventory_auth')
    localStorage.removeItem('app_user')
  }

  return (
    <AuthContext.Provider
      value={{
        isInventoryAuthenticated,
        currentUser,
        loginToInventory,
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

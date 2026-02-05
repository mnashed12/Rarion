/**
 * Layout Component
 * 
 * Pokemon-themed layout with:
 * - Gradient header with Pokemon branding
 * - Bottom navigation bar on mobile
 * - Animated navigation elements
 */

import { ReactNode, useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  CreditCard, 
  Package, 
  Video, 
  Menu,
  X,
  Sparkles
} from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

/**
 * Navigation items configuration
 */
const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/cards', label: 'Cards', icon: CreditCard },
  { path: '/inventory', label: 'Inventory', icon: Package },
  { path: '/streams', label: 'Streams', icon: Video },
]

function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Handle scroll for header shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const isActivePath = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - Pokemon themed gradient */}
      <header 
        className={`
          sticky top-0 z-50 
          transition-all duration-300
          ${scrolled 
            ? 'shadow-lg shadow-blue-900/20' 
            : ''
          }
        `}
        style={{
          background: 'linear-gradient(180deg, #1D2C5E 0%, #3B5CA8 100%)'
        }}
      >
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-red-500 via-yellow-400 to-red-500" />
        
        <div className="px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24">
          <div className="flex justify-between items-center h-16 sm:h-18">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 min-w-0 group">
              {/* Pokeball-style logo */}
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                <div className="absolute inset-0 rounded-full bg-gradient-to-b from-red-500 to-red-600 shadow-lg overflow-hidden">
                  <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-white" />
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-800 -translate-y-1/2" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-4 border-gray-800" />
                </div>
                <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl sm:text-2xl text-white tracking-tight">
                  PAKMAK
                </span>
                <span className="text-[10px] sm:text-xs text-blue-200 font-medium -mt-1 hidden sm:block">
                  Card Inventory Tracker
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = isActivePath(item.path)
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center gap-2 px-4 py-2.5 rounded-xl
                      text-sm font-semibold transition-all duration-200
                      ${isActive 
                        ? 'bg-white/20 text-white shadow-lg' 
                        : 'text-blue-100 hover:text-white hover:bg-white/10'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <div 
          className={`
            md:hidden overflow-hidden transition-all duration-300 ease-in-out
            ${mobileMenuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}
          `}
          style={{
            background: 'linear-gradient(180deg, #3B5CA8 0%, #2D4A8C 100%)'
          }}
        >
          <nav className="px-4 pb-4 pt-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = isActivePath(item.path)
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-4 py-3.5 rounded-xl
                    transition-all duration-200
                    ${isActive 
                      ? 'bg-white/20 text-white font-semibold' 
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {isActive && <Sparkles className="w-4 h-4 ml-auto text-yellow-400" />}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      {/* Main Content - Pokemon striped background */}
      <main className="flex-1 pb-20 md:pb-8 pokemon-content-bg">
        {/* Decorative pokeballs */}
        <div className="pokeball-deco" style={{ top: '15%', left: '3%' }} />
        <div className="pokeball-deco" style={{ top: '60%', right: '5%' }} />
        
        <div className="relative z-10 px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24 py-6 sm:py-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation - Pokemon themed */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t-2 border-blue-900/30"
        style={{
          background: 'linear-gradient(180deg, #1D2C5E 0%, #0F1A3D 100%)'
        }}
      >
        <div className="flex justify-around items-center h-16 px-2 pb-safe">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = isActivePath(item.path)
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex flex-col items-center justify-center relative
                  py-2 px-4 rounded-xl min-w-[68px]
                  transition-all duration-200
                  ${isActive 
                    ? 'text-yellow-400' 
                    : 'text-blue-300 hover:text-white'
                  }
                `}
              >
                <div className={`
                  relative p-1.5 rounded-xl transition-all duration-200
                  ${isActive ? 'bg-white/10' : ''}
                `}>
                  <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''} transition-transform`} />
                  {isActive && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                  )}
                </div>
                <span className={`text-xs mt-1 ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer - Pokemon striped dark style */}
      <footer className="hidden md:block pokemon-stripes-dark py-8 border-t-4 border-gray-700">
        <div className="px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-b from-red-500 to-red-600 relative overflow-hidden shadow-lg">
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-white" />
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-800 -translate-y-1/2" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-gray-800" />
              </div>
              <div>
                <span className="text-sm font-bold text-white">
                  PAKMAK
                </span>
                <p className="text-xs text-gray-400">
                  © {new Date().getFullYear()} Pokemon Card Inventory
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Pokemon is a trademark of Nintendo/The Pokemon Company
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout

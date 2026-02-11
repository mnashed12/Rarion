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
      {/* Header - Rarion themed gradient */}
      <header 
        className={`
          sticky top-0 z-50 
          transition-all duration-300
          ${scrolled 
            ? 'shadow-lg shadow-purple-900/30' 
            : ''
          }
        `}
        style={{
          background: 'linear-gradient(135deg, #0c1844 0%, #1e40af 25%, #7c3aed 60%, #ec4899 100%)'
        }}
      >
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500" />
        
        <div className="px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24">
          <div className="flex justify-between items-center h-16 sm:h-18">
            {/* Logo */}
            <Link to="/" className="flex items-end gap-1.5 min-w-0 group">
              <img 
                src="/RarionLogoPlainnobg.png" 
                alt="Rarion" 
                className="h-18 sm:h-18 w-auto object-contain transition-transform group-hover:scale-105"
              />
              <img 
                src="/rariontext.png" 
                alt="Rarion" 
                className="h-4 sm:h-6 w-auto object-contain pb-1"
              />
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
                        ? 'bg-white/20 text-white shadow-lg shadow-purple-500/20' 
                        : 'text-purple-100 hover:text-white hover:bg-white/10'
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
            background: 'linear-gradient(180deg, #7c3aed 0%, #1e40af 100%)'
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
                      : 'text-purple-100 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {isActive && <Sparkles className="w-4 h-4 ml-auto text-pink-400" />}
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

      {/* Mobile Bottom Navigation - Rarion themed */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t-2 border-purple-900/30"
        style={{
          background: 'linear-gradient(180deg, #1e40af 0%, #0c1844 100%)'
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
                    ? 'text-pink-400' 
                    : 'text-purple-300 hover:text-white'
                  }
                `}
              >
                <div className={`
                  relative p-1.5 rounded-xl transition-all duration-200
                  ${isActive ? 'bg-white/10' : ''}
                `}>
                  <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''} transition-transform`} />
                  {isActive && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-pink-400 rounded-full animate-pulse" />
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
              <img 
                src="/RarionLogo_no_bg.png" 
                alt="Rarion" 
                className="h-10 w-auto object-contain"
              />
              <div>
                <span className="text-sm font-bold text-white">
                  Rarion
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

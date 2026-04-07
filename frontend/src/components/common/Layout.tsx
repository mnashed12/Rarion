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
import { useAuth } from '../../contexts/AuthContext'
import { 
  Home, 
  Package, 
  Layers,
} from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

/**
 * Navigation items configuration
 */
const navItems = [
  { path: '/', label: 'Home', icon: Home },
  // { path: '/cards', label: 'Cards', icon: CreditCard },
  { path: '/decks', label: 'Card List', icon: Layers },
  { path: '/inventory', label: 'Inventory', icon: Package },
]

function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { isInventoryAuthenticated } = useAuth()
  const [scrolled, setScrolled] = useState(false)

  // Handle scroll for header shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Lock document scroll on mobile for homepage and card list page
  useEffect(() => {
    const noScrollPages = ['/', '/decks']
    if (noScrollPages.includes(location.pathname)) {
      document.documentElement.classList.add('no-doc-scroll-mobile')
    } else {
      document.documentElement.classList.remove('no-doc-scroll-mobile')
    }
    return () => {
      document.documentElement.classList.remove('no-doc-scroll-mobile')
    }
  }, [location.pathname])

  const isActivePath = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  // Admin-only nav items are hidden from regular visitors
  const visibleNavItems = navItems.filter(item => {
    if (item.path === '/inventory') {
      return isInventoryAuthenticated
    }
    return true
  })

  return (
    <div
      className={`${(location.pathname === '/' || location.pathname === '/decks') ? 'max-md:h-dvh max-md:min-h-0 max-md:overflow-hidden' : ''} min-h-screen flex flex-col`}
      style={location.pathname === '/inventory' ? { backgroundImage: `url(${'/images/deckbg.jpg'})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' } : undefined}
    >
      {/* Header - transparent on homepage + decks, gradient elsewhere */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${scrolled && location.pathname !== '/' && location.pathname !== '/decks' && location.pathname !== '/inventory' ? 'shadow-lg shadow-purple-900/30' : ''}`}
        style={location.pathname !== '/' && location.pathname !== '/decks' && location.pathname !== '/inventory' ? {
          background: 'linear-gradient(135deg, #0c1844 0%, #1e40af 25%, #7c3aed 60%, #ec4899 100%)'
        } : undefined}
      >
        {location.pathname !== '/' && location.pathname !== '/decks' && location.pathname !== '/inventory' && (
          <div className="h-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500" />
        )}
        <div className="px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24">
          <div className="flex justify-between items-center h-16 sm:h-18">
            {/* Logo */}
            <Link to="/" className="flex items-end gap-1.5 min-w-0 group">
              <img 
                src="/images/RarionLogoPlainnobg.png" 
                alt="Rarion" 
                className={`w-auto object-contain transition-transform group-hover:scale-105 ${(location.pathname === '/' || location.pathname === '/decks' || location.pathname === '/inventory') ? 'mt-8 h-18 sm:h-24' : 'h-18 sm:h-18'}`}
              />
              <img 
                src="/images/rariontext.png" 
                alt="Rarion" 
                className={`w-auto object-contain pb-1 ${(location.pathname === '/' || location.pathname === '/decks' || location.pathname === '/inventory') ? 'mb-4 h-8 sm:h-10' : 'h-8 sm:h-10'}`}
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              {visibleNavItems.map((item) => {
                const Icon = item.icon
                const isActive = isActivePath(item.path)
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center gap-2 px-4 py-2.5 rounded-xl
                      font-semibold transition-all duration-200
                      ${(location.pathname === '/' || location.pathname === '/decks' || location.pathname === '/inventory') ? 'mt-10 text-lg' : 'text-sm'}
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

          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        className={`flex-1 ${location.pathname === '/decks' || location.pathname === '/inventory' ? '' : 'pb-20 md:pb-8 pokemon-content-bg'} ${location.pathname === '/decks' ? 'max-md:flex max-md:flex-col max-md:overflow-hidden' : ''}`}
      >
        {/* Decorative pokeballs (hidden on decks/inventory — full-page bg takes over) */}
        {location.pathname !== '/decks' && location.pathname !== '/inventory' && (
          <>
            <div className="pokeball-deco" style={{ top: '15%', left: '3%' }} />
            <div className="pokeball-deco" style={{ top: '60%', right: '5%' }} />
          </>
        )}
        
        {location.pathname === '/decks' || location.pathname === '/inventory' ? (
          // Immersive full-bleed — no stacking context wrapper so modals can escape
          children
        ) : (
          <div className="relative z-10 px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24 py-6 sm:py-8">
            {children}
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation — hidden on immersive pages (/decks) */}
      {location.pathname !== '/decks' && (
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t-2 border-purple-900/30"
        style={{
          background: 'linear-gradient(180deg, #1e40af 0%, #0c1844 100%)'
        }}
      >
        <div className="flex justify-around items-center h-16 px-2 pb-safe">
          {visibleNavItems.map((item) => {
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
      )}

      {/* Footer — hidden on immersive pages (/decks) */}
      {location.pathname !== '/decks' && (
      <footer className="hidden md:block pokemon-stripes-dark py-8 border-t-4 border-gray-700">
        <div className="px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <img 
                src="/images/RarionLogo_no_bg.png" 
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
      )}
    </div>
  )
}

export default Layout

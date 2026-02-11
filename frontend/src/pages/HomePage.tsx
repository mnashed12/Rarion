/**
 * Home Page / Dashboard
 * 
 * Pokemon-themed dashboard with:
 * - Gradient hero section
 * - Animated stat cards with Pokemon styling
 */

import { Link } from 'react-router-dom'
import { 
  ArrowRight,
  Sparkles,
  Zap,
  Search,
  Plus
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../services/api'

/**
 * Bubble generator component for water effects
 */
function Bubbles({ count = 40 }: { count?: number }) {
  const bubbles = Array.from({ length: count }, (_, i) => {
    const size = Math.random() * 15 + 10 // 10-25px
    const top = Math.random() * 100 // 0-100%
    const right = Math.random() * 20 + 5 // 5-25%
    const delay = Math.random() * 0.5 // 0-0.5s
    
    return (
      <div
        key={i}
        className={`bubble bubble-${(i % 20) + 1}`}
        style={{
          width: size,
          height: size,
          top: `${top}%`,
          right: `${right}%`,
          animationDelay: `${delay}s`
        }}
      />
    )
  })
  
  return <>{bubbles}</>
}

/**
 * Ember/flame generator component for fire effects
 */
function Embers({ count = 40 }: { count?: number }) {
  const embers = Array.from({ length: count }, (_, i) => {
    const width = Math.random() * 20 + 15 // 15-35px
    const height = width * (1.3 + Math.random() * 0.4) // 1.3-1.7x taller
    const bottom = Math.random() * 30 // 0-30% from bottom
    const right = Math.random() * 25 + 5 // 5-30%
    const delay = Math.random() * 0.8 // 0-0.8s
    
    return (
      <div
        key={i}
        className="flame"
        style={{
          width: width,
          height: height,
          bottom: `${bottom}%`,
          right: `${right}%`,
          animationDelay: `${delay}s`
        }}
      />
    )
  })
  
  return <>{embers}</>
}

/**
 * Clean gradient flame beam effect
 */
function FlameBeam() {
  return <div className="flame-beam" />
}

/**
 * Pokemon-themed stat card with gradient and decorative elements
 */
interface StatCardProps {
  title: string
  value: string | number
  gradient: string
  link?: string
  loading?: boolean
  subtitle?: string
  backgroundImage?: string
  backgroundSize?: string
  hoverEffect?: React.ReactNode
  bgColor?: string
}

function StatCard({ title, value, gradient, link, loading, subtitle, backgroundImage, backgroundSize = '50%', hoverEffect, bgColor }: StatCardProps) {
  const content = (
    <div 
      className={`
        relative overflow-hidden rounded-2xl p-5 sm:p-6 
        ${backgroundImage ? (bgColor || 'bg-white') : gradient}
        transition-all duration-300
        hover:scale-[1.02] hover:shadow-2xl
        active:scale-[0.98]
        group cursor-pointer
      `}
      style={backgroundImage ? {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: backgroundSize,
        backgroundPosition: 'center right',
        backgroundRepeat: 'no-repeat',
      } : undefined}
    >
      {/* Decorative Pokeball background - only show if no background image */}
      {!backgroundImage && (
        <div className="absolute -right-8 -top-8 w-32 h-32 opacity-10">
          <div className="w-full h-full rounded-full border-8 border-white relative">
            <div className="absolute top-1/2 left-0 right-0 h-2 bg-white -translate-y-1/2" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full" />
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        <div>
          <p className={`text-3xl sm:text-4xl font-black ${backgroundImage ? 'text-gray-900' : 'text-white'} tracking-tight ${loading ? 'animate-pulse' : ''}`}>
            {loading ? '...' : value}
          </p>
          <p className={`text-sm font-bold ${backgroundImage ? 'text-gray-700' : 'text-white/90'} mt-1 uppercase tracking-wide`}>{title}</p>
          {subtitle && (
            <p className={`text-xs ${backgroundImage ? 'text-gray-500' : 'text-white/60'} mt-0.5`}>{subtitle}</p>
          )}
        </div>
      </div>
      
      {/* Custom hover effect */}
      {hoverEffect}
      
      {/* Shine effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
    </div>
  )

  if (link) {
    return <Link to={link} className="block">{content}</Link>
  }
  
  return content
}

function HomePage() {
  // Fetch real stats from API
  const { data: cardsData, isLoading: cardsLoading } = useQuery({
    queryKey: ['cards-count'],
    queryFn: async () => {
      const response = await apiClient.get('/cards/?page=1&page_size=1')
      return response.data.count
    }
  })

  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ['inventory-count'],
    queryFn: async () => {
      const response = await apiClient.get('/inventory/?page=1&page_size=1')
      return response.data.count
    }
  })
  
  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Hero Section - Pokemon themed */}
      <div 
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 lg:p-10 animate-slide-down"
        style={{
          background: 'linear-gradient(135deg, #1D2C5E 0%, #3B5CA8 50%, #CC0000 100%)'
        }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
          <div className="absolute inset-0">
            <div className="w-full h-full rounded-full border-8 border-white relative">
              <div className="absolute top-1/2 left-0 right-0 h-3 bg-white -translate-y-1/2" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full" />
            </div>
          </div>
        </div>
        <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-yellow-400/20 blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-400/20 rounded-full">
              <span className="text-xs font-bold text-yellow-300 uppercase tracking-wider">Welcome Trainer!</span>
            </div>
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-3 tracking-tight">
            Your Pokémon Collection
          </h1>
          <p className="text-blue-200 text-base sm:text-lg max-w-xl">
            Track, manage, and value your trading card collection with powerful tools built for collectors.
          </p>
          
          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              to="/cards"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white text-blue-900 font-bold rounded-xl hover:bg-yellow-400 transition-colors shadow-lg hover:shadow-xl"
            >
              <Search className="w-5 h-5" />
              Browse Cards
            </Link>
            <Link
              to="/inventory"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 backdrop-blur-sm text-white font-bold rounded-xl hover:bg-white/20 transition-colors border border-white/20"
            >
              <Plus className="w-5 h-5" />
              Add to Collection
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid - 2x2 on mobile, 4 columns on desktop */}
      <div className="animate-slide-down" style={{ animationDelay: '75ms' }}>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <StatCard
            title="Total Cards"
            value={cardsData?.toLocaleString() || '--'}
            subtitle="In database"
            gradient="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700"
            backgroundImage="/bulbasaur.png"
            backgroundSize="40%"
            bgColor="bg-green-200"
            link="/cards"
            loading={cardsLoading}
          />
          <StatCard
            title="In Collection"
            value={inventoryData?.toLocaleString() || '--'}
            subtitle="Cards owned"
            gradient="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700"
            backgroundImage="/squirtle.png"
            backgroundSize="25%"
            bgColor="bg-blue-200"
            link="/inventory"
            loading={inventoryLoading}
          />
          <StatCard
            title="Total Value"
            value="$--"
            subtitle="Estimated"
            gradient="bg-gradient-to-br from-purple-500 via-purple-600 to-violet-700"
            backgroundImage="/charmander.png"
            backgroundSize="15%"
            bgColor="bg-red-200"
          />
          <StatCard
            title="Streams"
            value="--"
            subtitle="Events recorded"
            gradient="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600"
            backgroundImage="/pikachu.png"
            backgroundSize="40%"
            bgColor="bg-yellow-200"
            link="/streams"
          />
        </div>
      </div>

      {/* Getting Started Card */}
      <div 
        className="relative overflow-hidden rounded-2xl border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 p-6 sm:p-8 animate-slide-down"
        style={{ animationDelay: '150ms' }}
      >
        
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">Ready to Start?</h3>
            <p className="text-gray-600">
              Our card database is loaded with over 22,000 Pokémon cards. Start browsing and building your collection today!
            </p>
          </div>
          <Link 
            to="/cards" 
            className="
              inline-flex items-center gap-2
              px-6 py-3 
              bg-gradient-to-r from-yellow-400 to-orange-500
              text-white text-sm font-bold
              rounded-xl 
              hover:from-yellow-500 hover:to-orange-600 
              transition-all duration-300
              shadow-lg hover:shadow-xl
              hover:-translate-y-0.5
              whitespace-nowrap
            "
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default HomePage

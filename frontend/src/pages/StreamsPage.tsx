/**
 * Streams Page
 * 
 * Pokemon-themed stream event management with:
 * - Gradient hero header
 * - Animated stat cards
 * - Stream cards with status indicators
 */

import { useState, useEffect } from 'react'
import { 
  Video, 
  Plus, 
  Calendar, 
  TrendingUp,
  Package,
  DollarSign,
  ChevronRight,
  SlidersHorizontal,
  Play,
  Clock,
  CheckCircle2,
  Sparkles,
  Zap
} from 'lucide-react'
import apiClient from '../services/api'

interface Stream {
  id: number
  title: string
  platform: string
  stream_date: string
  status: 'planned' | 'live' | 'completed'
  items_shown?: number
  items_sold?: number
  total_value?: number
}

function StreamsPage() {
  const [streams, setStreams] = useState<Stream[]>([])
  const [loading, setLoading] = useState(true)
  const [platformFilter, setPlatformFilter] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)

  // Fetch streams
  useEffect(() => {
    const fetchStreams = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (platformFilter) params.append('platform', platformFilter)
        
        const response = await apiClient.get(`/streams/?${params.toString()}`)
        setStreams(response.data.results || [])
      } catch (error) {
        console.error('Error fetching streams:', error)
        setStreams([]) // Empty state
      } finally {
        setLoading(false)
      }
    }

    fetchStreams()
  }, [platformFilter])

  const totalStreams = streams.length
  const thisMonth = streams.filter(s => {
    const streamDate = new Date(s.stream_date)
    const now = new Date()
    return streamDate.getMonth() === now.getMonth() && streamDate.getFullYear() === now.getFullYear()
  }).length
  const totalItemsShown = streams.reduce((sum, s) => sum + (s.items_shown || 0), 0)
  const totalItemsSold = streams.reduce((sum, s) => sum + (s.items_sold || 0), 0)

  const statusConfig = {
    planned: { 
      icon: Clock, 
      bg: 'bg-gradient-to-r from-blue-400 to-blue-500', 
      text: 'text-white',
      label: 'Planned' 
    },
    live: { 
      icon: Play, 
      bg: 'bg-gradient-to-r from-red-500 to-pink-500', 
      text: 'text-white',
      label: 'Live',
      pulse: true
    },
    completed: { 
      icon: CheckCircle2, 
      bg: 'bg-gradient-to-r from-emerald-400 to-emerald-500', 
      text: 'text-white',
      label: 'Completed' 
    }
  }

  const platformColors: Record<string, string> = {
    twitch: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white',
    youtube: 'bg-gradient-to-r from-red-500 to-red-600 text-white',
    other: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
  }

  return (
    <div className="space-y-6">
      {/* Page Header - Pokemon themed */}
      <div 
        className="relative overflow-hidden rounded-2xl p-5 sm:p-6 animate-slide-down"
        style={{
          background: 'linear-gradient(135deg, #9333EA 0%, #EC4899 100%)'
        }}
      >
        {/* Decorative pokeball */}
        <div className="absolute -right-10 -top-10 w-40 h-40 opacity-10">
          <div className="w-full h-full rounded-full border-8 border-white relative">
            <div className="absolute top-1/2 left-0 right-0 h-3 bg-white -translate-y-1/2" />
          </div>
        </div>
        
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-pink-200" />
              <span className="text-xs font-bold text-pink-100 uppercase tracking-wider">Live Events</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Stream Manager
            </h1>
            <p className="text-pink-100 text-sm mt-1">
              Track your card showcases and sales
            </p>
          </div>
          <button className="
            flex items-center gap-2 px-4 py-2.5
            bg-white/20 backdrop-blur-sm hover:bg-white/30
            text-white text-sm font-bold
            rounded-xl border border-white/20
            transition-all active:scale-[0.98]
          ">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Stream</span>
          </button>
        </div>
      </div>

      {/* Stats Summary - Pokemon themed */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-down" style={{ animationDelay: '75ms' }}>
        <div className="relative overflow-hidden bg-white rounded-2xl border-2 border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow group">
          <div className="absolute -right-4 -top-4 w-16 h-16 opacity-5 group-hover:opacity-10 transition-opacity">
            <Video className="w-full h-full" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Video className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase">Total</span>
          </div>
          <p className="text-2xl font-black text-gray-900">{totalStreams}</p>
        </div>
        
        <div className="relative overflow-hidden bg-white rounded-2xl border-2 border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase">This Month</span>
          </div>
          <p className="text-2xl font-black text-blue-600">{thisMonth}</p>
        </div>
        
        <div className="relative overflow-hidden bg-white rounded-2xl border-2 border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase">Shown</span>
          </div>
          <p className="text-2xl font-black text-orange-600">{totalItemsShown}</p>
        </div>
        
        <div className="relative overflow-hidden bg-white rounded-2xl border-2 border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase">Sold</span>
          </div>
          <p className="text-2xl font-black text-emerald-600">{totalItemsSold}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3 animate-slide-down" style={{ animationDelay: '150ms' }}>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`
              flex items-center justify-center gap-2
              h-12 px-4 rounded-xl border-2
              text-sm font-bold
              transition-all active:scale-[0.98]
              ${showFilters || platformFilter
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 border-purple-500 text-white'
                : 'bg-white border-gray-100 text-gray-700 hover:border-gray-200'
              }
            `}
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span>Filters</span>
            {platformFilter && (
              <span className="w-5 h-5 bg-white/20 text-white text-xs rounded-full flex items-center justify-center">
                1
              </span>
            )}
          </button>
        </div>

        {/* Filters Panel */}
        <div className={`
          overflow-hidden transition-all duration-300 ease-in-out
          ${showFilters ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}
        `}>
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-100 p-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Platform</label>
              <select
                className="
                  w-full h-11 px-3 bg-white border-2 border-gray-100 rounded-xl
                  text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                "
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
              >
                <option value="">All Platforms</option>
                <option value="twitch">Twitch</option>
                <option value="youtube">YouTube</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">From</label>
                <input
                  type="date"
                  className="
                    w-full h-11 px-3 bg-white border-2 border-gray-100 rounded-xl
                    text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                  "
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">To</label>
                <input
                  type="date"
                  className="
                    w-full h-11 px-3 bg-white border-2 border-gray-100 rounded-xl
                    text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                  "
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stream List */}
      <div className="animate-slide-down" style={{ animationDelay: '225ms' }}>
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border-2 border-gray-100 p-5 animate-pulse">
              <div className="space-y-3">
                <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full w-3/4" />
                <div className="h-4 bg-gray-200 rounded-full w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : streams.length === 0 ? (
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-white rounded-2xl border-2 border-purple-100 p-10 sm:p-16 text-center">
          <div className="absolute top-4 right-4 opacity-20">
            <Sparkles className="w-12 h-12 text-purple-400" />
          </div>
          <div className="absolute bottom-4 left-4 opacity-20">
            <Video className="w-10 h-10 text-pink-400" />
          </div>
          
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg">
            <Video className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Start Streaming!</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Create stream events to track which cards you showcase and sell during your live sessions.
          </p>
          <button className="
            inline-flex items-center gap-2 px-6 py-3
            bg-gradient-to-r from-purple-500 to-pink-500 
            text-white font-bold rounded-xl 
            hover:from-purple-600 hover:to-pink-600 
            transition-all shadow-lg hover:shadow-xl
            hover:-translate-y-0.5
          ">
            <Plus className="w-5 h-5" />
            Create Your First Stream
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {streams.map((stream) => {
            const status = statusConfig[stream.status] || statusConfig.planned
            const StatusIcon = status.icon
            
            return (
              <div
                key={stream.id}
                className="
                  bg-white rounded-2xl border-2 border-gray-100
                  p-5 hover:shadow-lg hover:border-gray-200
                  transition-all duration-200
                  group cursor-pointer
                "
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`
                        inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold shadow-sm
                        ${status.bg} ${status.text}
                        ${'pulse' in status && status.pulse ? 'animate-pulse' : ''}
                      `}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {status.label}
                      </span>
                      <span className={`
                        px-3 py-1 rounded-lg text-xs font-bold capitalize shadow-sm
                        ${platformColors[stream.platform] || platformColors.other}
                      `}>
                        {stream.platform}
                      </span>
                    </div>
                    
                    <h3 className="font-bold text-lg text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                      {stream.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 font-medium">
                      {new Date(stream.stream_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </p>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 mt-3">
                      <span className="flex items-center gap-1.5 text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
                        <Package className="w-4 h-4" />
                        {stream.items_shown || 0} shown
                      </span>
                      <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
                        <TrendingUp className="w-4 h-4" />
                        {stream.items_sold || 0} sold
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Quick Action Cards */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-yellow-500" />
          <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button className="
            relative overflow-hidden
            flex items-center gap-4 p-5
            bg-gradient-to-r from-purple-500 to-pink-500
            rounded-2xl text-white text-left
            hover:from-purple-600 hover:to-pink-600
            transition-all active:scale-[0.98]
            shadow-lg hover:shadow-xl
            hover:-translate-y-1
            group
          ">
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Plus className="w-7 h-7" />
            </div>
            <div>
              <p className="font-bold text-lg">Schedule Stream</p>
              <p className="text-sm text-white/80">Plan your next card showcase</p>
            </div>
          </button>
          
          <button className="
            relative overflow-hidden
            flex items-center gap-4 p-5
            bg-gradient-to-r from-red-500 to-orange-500
            rounded-2xl text-white text-left
            hover:from-red-600 hover:to-orange-600
            transition-all active:scale-[0.98]
            shadow-lg hover:shadow-xl
            hover:-translate-y-1
            group
          ">
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Play className="w-7 h-7" />
            </div>
            <div>
              <p className="font-bold text-lg">Go Live Now</p>
              <p className="text-sm text-white/80">Start streaming immediately</p>
            </div>
          </button>
        </div>
      </div>
      </div>
    </div>
  )
}

export default StreamsPage

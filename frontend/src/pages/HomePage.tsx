/**
 * Home Page
 * 
 * Full-screen infinite scrolling carousel of recently scanned/sold cards.
 * Mimics the play-button carousel animation from the Inventory page.
 */

import { useQuery } from '@tanstack/react-query'
import { Package } from 'lucide-react'
import apiClient from '../services/api'
import { InventoryItem } from '../types'

function HomePage() {
  // Fetch recently scanned cards
  const { data: recentCards = [], isLoading, isError, error } = useQuery<InventoryItem[]>({
    queryKey: ['recent-scans'],
    queryFn: async () => {
      const response = await apiClient.get('/inventory/recent_scans/?limit=50')
      return response.data
    },
    refetchInterval: 10000,
    retry: 1,
  })

  const bgStyle = {
    backgroundImage: `url(${import.meta.env.BASE_URL}images/151bg.jpg)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center" style={bgStyle}>
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative text-white/60 text-lg animate-pulse">Loading recent scans...</div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center" style={bgStyle}>
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative text-center">
          <Package className="w-16 h-16 text-red-400/60 mx-auto mb-4" />
          <p className="text-red-400 text-lg">Failed to load recent scans</p>
          <p className="text-white/30 text-sm mt-2 font-mono">{String((error as any)?.message || error)}</p>
        </div>
      </div>
    )
  }

  if (recentCards.length === 0) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center" style={bgStyle}>
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative text-center">
          <Package className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/40 text-lg">No recently scanned cards</p>
          <p className="text-white/20 text-sm mt-2">Scan cards via QR to see them here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-40 overflow-hidden" style={bgStyle}>
      <div className="absolute inset-0 bg-black/50" />

      {/* Scrolling cards container */}
      <div className="relative z-10 h-full flex items-center overflow-hidden">
        <div
          className="flex gap-6 px-6"
          style={{
            animation: `scroll-left ${recentCards.length * 3}s linear infinite`,
            width: `${recentCards.length * 2 * 320}px`,
          }}
        >
          {/* Duplicate cards for seamless loop */}
          {[...recentCards, ...recentCards].map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              className="flex-shrink-0"
              style={{
                width: '300px',
                perspective: '1000px',
              }}
            >
              <div className="relative w-full aspect-[2.5/3.5] group">
                {/* Card image */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl transform transition-all duration-300 hover:scale-105 hover:z-10">
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                    {item.card_detail?.image ? (
                      <img
                        src={item.card_detail.image}
                        alt={item.card_detail?.name || 'Card'}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-20 h-20 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Card info overlay on hover */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                  <h3 className="text-base font-black text-white mb-1 truncate">
                    {item.card_detail?.name || 'Unknown Card'}
                  </h3>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-1 bg-white/20 text-white rounded font-bold truncate max-w-[150px]">
                      {item.card_detail?.set_name || 'Unknown'}
                    </span>
                    {item.sold_at && (
                      <span className="px-2 py-1 bg-red-500/80 text-white rounded font-bold">
                        SOLD
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default HomePage

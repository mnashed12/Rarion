/**
 * Decks Page — Public read-only view (WOW redesign)
 *
 * Cosmic dark hero · Holographic pack-style deck cards ·
 * Live prestige pull-rate display · Photo card grid
 */

import { useState, useEffect } from 'react'
import {
  Package,
  Search,
  X,
} from 'lucide-react'
import apiClient from '../services/api'
import type { InventoryItem, Deck } from '../types'

// ─── helpers ────────────────────────────────────────────────────────────────

type PrestigeStats = { star: number; galaxy: number; cosmos: number; rarion: number; total: number }
type StatsMap = Record<number, PrestigeStats>

function mergePrestigeStats(deckList: Deck[], statsMap: StatsMap): Deck[] {
  return deckList.map(d => ({
    ...d,
    prestige_stats: statsMap[d.id] ?? { star: 0, galaxy: 0, cosmos: 0, rarion: 0, total: 0 },
  }))
}

// ─── prestige tier definitions ───────────────────────────────────────────────

const TIERS = [
  {
    key:          'star'   as const,
    label:        'Star',
    sym:          '★',
    range:        '$1–$5',
    accent:       '#e2e8f0',
    activeBar:    'bg-white/90',
    inactiveBar:  'bg-slate-300',
    condBg:       'rgba(226,232,240,0.15)',
    condBorder:   'rgba(226,232,240,0.30)',
  },
  {
    key:          'galaxy' as const,
    label:        'Galaxy',
    sym:          '✦',
    range:        '$6–$15',
    accent:       '#60a5fa',
    activeBar:    'bg-blue-400',
    inactiveBar:  'bg-blue-500',
    condBg:       'rgba(96,165,250,0.15)',
    condBorder:   'rgba(96,165,250,0.35)',
  },
  {
    key:          'cosmos' as const,
    label:        'Cosmos',
    sym:          '◆',
    range:        '$16–$75',
    accent:       '#c084fc',
    activeBar:    'bg-purple-400',
    inactiveBar:  'bg-purple-500',
    condBg:       'rgba(192,132,252,0.15)',
    condBorder:   'rgba(192,132,252,0.35)',
  },
  {
    key:          'rarion' as const,
    label:        'Rarion',
    sym:          '🔥',
    range:        '$76+',
    accent:       '#fb923c',
    activeBar:    'bg-orange-400',
    inactiveBar:  'bg-orange-500',
    condBg:       'rgba(251,146,60,0.15)',
    condBorder:   'rgba(251,146,60,0.40)',
  },
] as const

// Map deck background_image key → filename (default: PAKMAKDECK.PNG)
function getDeckImage(deck: Deck): string {
  if (deck.background_image === 'DANNYDECK') return 'DANNYDECK.PNG'
  return 'PAKMAKDECK.PNG'
}

// Deterministic starfield via golden-ratio spacing
const STARS = Array.from({ length: 60 }, (_, i) => ({
  left:    `${((i * 161.803) % 100).toFixed(1)}%`,
  top:     `${((i * 100.361) % 100).toFixed(1)}%`,
  size:    (i % 3) + 1,
  opacity: (0.12 + (i % 5) * 0.07).toFixed(2),
}))

// ─── component ───────────────────────────────────────────────────────────────

const TIER_ORDER = ['rarion', 'cosmos', 'galaxy', 'star'] as const

export default function DecksPage() {
  const [decks, setDecks]               = useState<Deck[]>([])
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null)
  const [statsMap, setStatsMap]         = useState<StatsMap>({})
  const [inventory, setInventory]       = useState<InventoryItem[]>([])
  const [loading, setLoading]           = useState(false)
  const [searchTerm, setSearchTerm]     = useState('')

  // ── fetch decks + prestige stats (initial load) ───────────────────────
  useEffect(() => {
    const fetchDecks = async () => {
      try {
        const [deckRes, statsRes] = await Promise.allSettled([
          apiClient.get('/decks/'),
          apiClient.get('/inventory/prestige_by_deck/'),
        ])
        if (deckRes.status === 'rejected') return
        const statsData: StatsMap = statsRes.status === 'fulfilled' ? statsRes.value.data : {}
        const fetched = mergePrestigeStats(deckRes.value.data.results || deckRes.value.data, statsData)
        setDecks(fetched)
        setStatsMap(statsData)
        if (fetched.length > 0) setSelectedDeck(fetched[0])
      } catch (err) {
        console.error('Error fetching decks:', err)
      }
    }
    fetchDecks()
  }, [])

  // ── poll prestige stats every 5s so bars update live after QR scans ───
  // Only updates statsMap — never touches selectedDeck so inventory doesn't refetch
  useEffect(() => {
    const pollStats = async () => {
      try {
        const res = await apiClient.get('/inventory/prestige_by_deck/')
        setStatsMap(res.data)
      } catch {
        // silent — don't disrupt UI if poll fails
      }
    }
    const interval = setInterval(pollStats, 5000)
    return () => clearInterval(interval)
  }, [])

  // ── fetch all inventory for selected deck ───────────────────────────
  useEffect(() => {
    if (!selectedDeck) return
    const fetchInventory = async () => {
      setLoading(true)
      try {
        // Page through all results — works regardless of server page_size cap
        const allItems: InventoryItem[] = []
        let url = `/inventory/?deck=${selectedDeck.id}&page_size=100${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}`
        while (url) {
          const res = await apiClient.get(url)
          allItems.push(...(res.data.results || []))
          const next: string | null = res.data.next
          if (!next) break
          // DRF returns a full URL — strip everything up to and including /api
          // so axios doesn't double-prepend the baseURL
          const apiIndex = next.indexOf('/api/')
          url = apiIndex !== -1 ? next.slice(apiIndex + 4) : next.replace(/^https?:\/\/[^/]+/, '')
        }
        setInventory(allItems)
      } catch (err) {
        console.error('Error fetching inventory:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchInventory()
  }, [selectedDeck?.id, searchTerm])

  // ── poll sold_at every 5s so cards cross out live when QR is scanned ─
  useEffect(() => {
    if (!selectedDeck) return
    const pollSoldAt = async () => {
      try {
        const allItems: InventoryItem[] = []
        let url = `/inventory/?deck=${selectedDeck.id}&page_size=100${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}`
        while (url) {
          const res = await apiClient.get(url)
          allItems.push(...(res.data.results || []))
          const next: string | null = res.data.next
          if (!next) break
          const apiIndex = next.indexOf('/api/')
          url = apiIndex !== -1 ? next.slice(apiIndex + 4) : next.replace(/^https?:\/\/[^/]+/, '')
        }
        // Merge only sold_at changes — avoids layout flash from full replace
        setInventory(prev => prev.map(item => {
          const updated = allItems.find(a => a.id === item.id)
          if (!updated || updated.sold_at === item.sold_at) return item
          return { ...item, sold_at: updated.sold_at }
        }))
      } catch {
        // silent — poll failures shouldn't disrupt the UI
      }
    }
    const interval = setInterval(pollSoldAt, 5000)
    return () => clearInterval(interval)
  }, [selectedDeck?.id, searchTerm])


  // ── shared card renderer (used by all tier rows) ──────────────────────
  const renderInventoryCard = (item: InventoryItem, idx: number, large = false) => {
    const isSold = !!item.sold_at
    return (
      <div
        key={`${item.id}-${idx}`}
        className={`relative flex-shrink-0 aspect-[3/4] rounded-2xl overflow-hidden shadow-lg ${large ? 'w-52 sm:w-60' : 'w-36'}`}
      >
        {/* Card content — dimmed when sold */}
        <div className={`w-full h-full transition-all duration-300 ${isSold ? 'opacity-40 grayscale' : ''}`}>
          {item.card_detail?.image ? (
            <img
              src={item.card_detail.image}
              alt={item.card_detail.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                const target = e.currentTarget
                target.onerror = null
                target.style.display = 'none'
                const fallback = target.nextElementSibling as HTMLElement | null
                if (fallback) fallback.style.display = 'flex'
              }}
            />
          ) : null}
          <div
            className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex flex-col items-center justify-center gap-2"
            style={{ display: item.card_detail?.image ? 'none' : 'flex' }}
          >
            <Package className="w-6 h-6 text-slate-500" />
            <span className="text-[9px] font-bold text-slate-400 text-center px-2 leading-tight">
              {item.card_detail?.name || 'Unknown'}
            </span>
          </div>
        </div>

        {/* PULLED stamp — shown when sold */}
        {isSold && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-red-500 font-black text-lg tracking-widest rotate-[-20deg] border-4 border-red-500 px-2 py-0.5 rounded opacity-90"
              style={{ textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}
            >
              PULLED
            </span>
          </div>
        )}
      </div>
    )
  }


  // ── render ────────────────────────────────────────────────────────────
  return (
    <div>

      {/* Fixed full-page background — stays still while content scrolls */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}images/deckbg.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* ════════════════════════════════════════════════════════════════
          COSMIC HERO
      ════════════════════════════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden px-6 sm:px-12 lg:px-20 pt-36 sm:pt-30"
      >
        {/* Static starfield */}
        <div className="absolute inset-0 pointer-events-none">
          {STARS.map((s, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{ left: s.left, top: s.top, width: s.size, height: s.size, opacity: s.opacity }}
            />
          ))}
        </div>

        {/* Ambient glow blobs */}
        <div className="absolute top-1/2 left-1/3 w-[500px] h-[500px] rounded-full blur-3xl -translate-y-1/2 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.20), transparent 70%)' }} />
        <div className="absolute top-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.14), transparent 70%)' }} />
      </div>

      {/* ════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ════════════════════════════════════════════════════════════════ */}
      <div className="px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24 pb-16 space-y-8">

        {/* ── DECK GRID ─────────────────────────────────────────────── */}
        {decks.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-white/20 p-16 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-white/30" />
            <p className="font-bold text-white/40">No decks available</p>
          </div>
        ) : (
          <div>
            {/* Outer scroll container — inner row centres when it fits, scrolls when it overflows */}
            <div className="overflow-x-auto pt-4 pb-6 hide-scrollbar">
              <div className="flex gap-4 sm:gap-5 justify-center overflow-visible" style={{ minWidth: 'max-content', scrollSnapType: 'x mandatory' }}>
              {decks.map(deck => {
                const isActive = selectedDeck?.id === deck.id
                const stats    = statsMap[deck.id] ?? deck.prestige_stats
                const total    = stats?.total ?? 0

                return (
                  <div
                    key={deck.id}
                    className="relative cursor-pointer flex-shrink-0 w-60 sm:w-72"
                    style={{ scrollSnapAlign: 'start' }}
                    onClick={() => setSelectedDeck(deck)}
                  >
                    {/* Depth shadow layers */}
                    <div className="absolute inset-0 rounded-[20px] translate-y-2.5 translate-x-1 bg-black/25" />
                    <div className="absolute inset-0 rounded-[20px] translate-y-1 bg-black/15" />

                    {/* Card face */}
                    <div
                      className={`card-holo relative aspect-[2.5/3.5] rounded-[20px] overflow-hidden flex flex-col transition-all duration-300 ${
                        isActive ? 'scale-[1.07] -rotate-1' : 'hover:scale-[1.04] hover:-translate-y-1'
                      }`}
                      style={{
                        backgroundImage: `url(${import.meta.env.BASE_URL}images/${getDeckImage(deck)})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        boxShadow: isActive
                          ? '0 0 0 2.5px #a855f7, 0 0 40px rgba(168,85,247,0.5), 0 20px 40px rgba(0,0,0,0.6)'
                          : '0 12px 32px rgba(0,0,0,0.5)',
                      }}
                    >
                      {/* Top scrim for name readability */}
                      <div className="absolute inset-0 pointer-events-none"
                        style={{ background: 'linear-gradient(to bottom, rgba(3,7,18,0.75) 0%, transparent 35%, transparent 50%, rgba(3,7,18,0.96) 100%)' }}
                      />

                      {/* Active inner ring */}
                      {isActive && (
                        <div className="absolute inset-0 rounded-[20px] pointer-events-none"
                          style={{ boxShadow: 'inset 0 0 0 2px rgba(168,85,247,0.7)' }} />
                      )}

                      {/* Deck name — top */}
                      <div className="absolute top-0 inset-x-0 z-10 px-4 pt-4">
                        <p className="font-black text-2xl text-white leading-tight tracking-tight">
                          {deck.name}
                        </p>
                      </div>

                      {/* Prestige bars — bottom */}
                      <div className="absolute bottom-0 inset-x-0 z-10 px-4 pb-5 space-y-2.5">
                        {TIERS.map(t => {
                          const pct = total > 0 ? Math.round((stats?.[t.key] ?? 0) / total * 100) : 0
                          return (
                            <div key={t.key} className="flex items-center gap-3">
                              <span className="text-[13px] font-black w-14 flex-shrink-0 leading-none" style={{ color: t.accent }}>
                                {t.label}
                              </span>
                              <div className="flex-1 h-3.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
                                <div
                                  className={`h-full rounded-full transition-all duration-700 ${t.activeBar}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-[13px] font-black w-9 text-right tabular-nums leading-none flex-shrink-0 text-white">
                                {pct}%
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>{/* end centering inner flex */}
            </div>{/* end scroll outer */}
          </div>
        )}

        {/* ── Search ────────────────────────────────────────────────── */}
        {selectedDeck && (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'rgba(255,255,255,0.4)' }} />
            <input
              type="text"
              placeholder={`Search ${selectedDeck.name}…`}
              className="w-full h-12 pl-11 pr-10 rounded-2xl text-sm font-medium text-white transition-all focus:outline-none"
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: '1.5px solid rgba(255,255,255,0.15)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
              onFocus={e  => (e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168,85,247,0.55)')}
              onBlur={e   => (e.currentTarget.style.boxShadow = 'none')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* ── PRESTIGE TIER ROWS ────────────────────────────────────── */}
        {selectedDeck && (
          loading ? (
            <div className="space-y-8">
              {TIER_ORDER.map(tierKey => {
                const tier = TIERS.find(t => t.key === tierKey)!
                return (
                  <div key={tierKey}>
                    {/* Tier label row — coloured accent hint */}
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <div
                        className="h-5 w-20 rounded-full animate-pulse"
                        style={{ background: tier.condBg, border: `1px solid ${tier.condBorder}` }}
                      />
                      <div className="flex-1 h-px" style={{ background: tier.condBorder }} />
                    </div>

                    {/* Card placeholders — overflow-hidden mirrors the real scrolling row */}
                    <div className="overflow-hidden">
                      <div className="flex gap-3">
                        {[...Array(8)].map((_, i) => (
                          <div
                            key={i}
                            className="flex-shrink-0 w-36 aspect-[3/4] rounded-2xl animate-pulse"
                            style={{
                              background: 'rgba(255,255,255,0.07)',
                              animationDelay: `${i * 120}ms`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : inventory.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-white/20 p-16 text-center">
              <Package className="w-10 h-10 mx-auto mb-3 text-white/30" />
              <p className="font-bold text-white/40">No cards found</p>
            </div>
          ) : (
            <div className="space-y-8">
              {TIER_ORDER.map(tierKey => {
                const tier = TIERS.find(t => t.key === tierKey)!
                const cards = inventory.filter(item => item.prestige === tierKey)
                if (cards.length === 0) return null

                return (
                  <div key={tierKey}>
                    {/* Row label */}
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <span className="text-xl font-black tracking-wide" style={{ color: tier.accent }}>
                        {tier.label}
                      </span>
                      <span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {cards.length} card{cards.length !== 1 ? 's' : ''}
                      </span>
                      <div className="flex-1 h-px" style={{ background: tier.condBorder }} />
                    </div>

                    <div className="overflow-x-auto pb-2">
                      <div className="flex gap-3" style={{ width: 'max-content' }}>
                        {cards.map((item, idx) => renderInventoryCard(item, idx, true))}
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Unassigned — cards with no prestige tier */}
              {(() => {
                const knownTiers = new Set(TIER_ORDER as readonly string[])
                const cards = inventory.filter(item => !knownTiers.has(item.prestige))
                if (cards.length === 0) return null

                return (
                  <div>
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <span className="text-xl font-black tracking-wide text-white/50">Unassigned</span>
                      <span className="text-sm font-bold text-white/30">
                        {cards.length} card{cards.length !== 1 ? 's' : ''}
                      </span>
                      <div className="flex-1 h-px bg-white/10" />
                    </div>
                    <div className="overflow-x-auto pb-2">
                      <div className="flex gap-3" style={{ width: 'max-content' }}>
                        {cards.map((item, idx) => renderInventoryCard(item, idx, true))}
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          )
        )}

      </div>
    </div>
  )
}

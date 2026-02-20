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
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
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

// Deterministic starfield via golden-ratio spacing
const STARS = Array.from({ length: 60 }, (_, i) => ({
  left:    `${((i * 161.803) % 100).toFixed(1)}%`,
  top:     `${((i * 100.361) % 100).toFixed(1)}%`,
  size:    (i % 3) + 1,
  opacity: (0.12 + (i % 5) * 0.07).toFixed(2),
}))

// ─── component ───────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 24

export default function DecksPage() {
  const [decks, setDecks]               = useState<Deck[]>([])
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null)
  const [inventory, setInventory]       = useState<InventoryItem[]>([])
  const [totalCount, setTotalCount]     = useState(0)
  const [loading, setLoading]           = useState(false)
  const [searchTerm, setSearchTerm]     = useState('')
  const [page, setPage]                 = useState(1)

  // ── fetch decks + prestige stats ──────────────────────────────────────
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
        if (fetched.length > 0) setSelectedDeck(fetched[0])
      } catch (err) {
        console.error('Error fetching decks:', err)
      }
    }
    fetchDecks()
  }, [])

  // ── fetch inventory when deck / search / page change ──────────────────
  useEffect(() => {
    if (!selectedDeck) return
    const fetchInventory = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.append('deck',      selectedDeck.id.toString())
        params.append('page',      page.toString())
        params.append('page_size', ITEMS_PER_PAGE.toString())
        if (searchTerm) params.append('search', searchTerm)
        const res = await apiClient.get(`/inventory/?${params}`)
        setInventory(res.data.results || [])
        setTotalCount(res.data.count   || 0)
      } catch (err) {
        console.error('Error fetching inventory:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchInventory()
  }, [selectedDeck, searchTerm, page])

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  // ── condition display ─────────────────────────────────────────────────
  const conditionLabel: Record<string, string> = {
    mint: 'M', near_mint: 'NM', lightly_played: 'LP',
    moderately_played: 'MP', heavily_played: 'HP', damaged: 'D',
  }
  const conditionColor: Record<string, string> = {
    mint:               'bg-teal-500 text-white',
    near_mint:          'bg-emerald-500 text-white',
    lightly_played:     'bg-blue-500 text-white',
    moderately_played:  'bg-amber-400 text-black',
    heavily_played:     'bg-orange-500 text-white',
    damaged:            'bg-red-600 text-white',
  }

  // ── render ────────────────────────────────────────────────────────────
  return (
    // Bleed edge-to-edge and up behind the transparent sticky header
    <div className="-mt-[5.5rem] sm:-mt-24 -mx-4 sm:-mx-6 lg:-mx-10 xl:-mx-16 2xl:-mx-24">

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
                const stats    = deck.prestige_stats
                const total    = stats?.total ?? 0

                return (
                  <div
                    key={deck.id}
                    className="relative cursor-pointer flex-shrink-0 w-36 sm:w-44"
                    style={{ scrollSnapAlign: 'start' }}
                    onClick={() => { setSelectedDeck(deck); setPage(1) }}
                  >
                    {/* Depth shadow layers */}
                    <div className="absolute inset-0 rounded-[20px] translate-y-2.5 translate-x-1 bg-black/25" />
                    <div className="absolute inset-0 rounded-[20px] translate-y-1 bg-black/15" />

                    {/* Card face with holographic sweep on hover */}
                    <div
                      className={`card-holo relative aspect-[2.5/3.5] rounded-[20px] overflow-hidden flex flex-col p-4 transition-all duration-300 ${
                        isActive ? 'scale-[1.07] -rotate-1' : 'hover:scale-[1.04] hover:-translate-y-1'
                      }`}
                      style={{
                        background: isActive
                          ? 'linear-gradient(145deg, #1e1b4b 0%, #4c1d95 45%, #7c1d4d 100%)'
                          : 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
                        boxShadow: isActive
                          ? '0 0 0 2.5px #a855f7, 0 0 50px rgba(168,85,247,0.45), 0 20px 40px rgba(0,0,0,0.55)'
                          : '0 12px 32px rgba(0,0,0,0.45)',
                      }}
                    >
                      {/* Subtle diagonal texture */}
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          backgroundImage:
                            'repeating-linear-gradient(-45deg, rgba(255,255,255,0.025) 0, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 9px)',
                        }}
                      />

                      {/* Glow orb */}
                      <div
                        className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 ${isActive ? 'opacity-35' : 'opacity-10'}`}
                        style={{
                          background: isActive
                            ? 'radial-gradient(circle, #a855f7, #ec4899)'
                            : 'radial-gradient(circle, #6366f1, #3b82f6)',
                        }}
                      />

                      {/* Deck name section */}
                      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center gap-1.5">
                        <h3 className="font-black text-sm text-white leading-tight">{deck.name}</h3>
                        {total > 0 && (
                          <p className="text-[10px] font-semibold" style={{ color: isActive ? '#d8b4fe' : 'rgba(255,255,255,0.3)' }}>
                            {total} card{total !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>

                      {/* Prestige bars */}
                      <div className="relative z-10 mt-2 w-full space-y-1.5">
                        {TIERS.map(t => {
                          const count = stats?.[t.key] ?? 0
                          const pct   = total > 0 ? Math.round((count / total) * 100) : 0
                          return (
                            <div key={t.key} className="flex items-center gap-1.5">
                              <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/10">
                                <div
                                  className={`h-full rounded-full transition-all duration-700 ${isActive ? t.activeBar : t.inactiveBar}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span
                                className="text-[9px] font-bold w-6 text-right tabular-nums leading-none flex-shrink-0"
                                style={{ color: isActive ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.28)' }}
                              >
                                {pct}%
                              </span>
                            </div>
                          )
                        })}
                      </div>

                      {/* State indicator */}
                      <div className="relative z-10 mt-2 text-center">
                        <span
                          className="text-[10px] font-black tracking-widest uppercase"
                          style={{ color: isActive ? '#f9a8d4' : 'rgba(255,255,255,0.18)' }}
                        >
                          {isActive ? '● VIEWING' : 'SELECT'}
                        </span>
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
              onChange={e => { setSearchTerm(e.target.value); setPage(1) }}
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

        {/* ── CARD PHOTO GRID ───────────────────────────────────────── */}
        {selectedDeck && (
          loading ? (
            // Skeleton grid
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-2xl skeleton" />
              ))}
            </div>
          ) : inventory.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-white/20 p-16 text-center">
              <Package className="w-10 h-10 mx-auto mb-3 text-white/30" />
              <p className="font-bold text-white/40">No cards found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
              {inventory.map(item => {
                const tier = TIERS.find(t => t.key === item.prestige) ?? TIERS[0]
                return (
                  <div
                    key={item.id}
                    className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Card image */}
                    {item.card_detail?.image ? (
                      <img
                        src={item.card_detail.image}
                        alt={item.card_detail.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center gap-2">
                        <Package className="w-8 h-8 text-slate-300" />
                        <span className="text-[10px] font-bold text-slate-400 text-center px-2 leading-tight">
                          {item.card_detail?.name || 'Unknown'}
                        </span>
                      </div>
                    )}

                    {/* Bottom gradient + name */}
                    <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-9">
                      <p className="text-white text-[11px] font-bold truncate leading-tight drop-shadow">
                        {item.card_detail?.name || 'Unknown'}
                      </p>
                      <p className="text-white/50 text-[9px] truncate mt-0.5">
                        {item.card_detail?.set_name || ''}
                      </p>
                    </div>

                    {/* Prestige badge — top right */}
                    <div className="absolute top-2 right-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm backdrop-blur-sm"
                        style={{
                          background: tier.condBg,
                          border:     `1.5px solid ${tier.condBorder}`,
                        }}
                        title={`${tier.label} — ${tier.range}`}
                      >
                        {tier.sym}
                      </div>
                    </div>

                    {/* Condition badge — top left */}
                    <div className="absolute top-2 left-2">
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${conditionColor[item.condition] || 'bg-gray-500 text-white'}`}>
                        {conditionLabel[item.condition] || item.condition}
                      </span>
                    </div>

                    {/* Qty badge — bottom right */}
                    {item.quantity > 1 && (
                      <div className="absolute bottom-2 right-2">
                        <span className="text-[10px] font-black text-white bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
                          ×{item.quantity}
                        </span>
                      </div>
                    )}

                    {/* Tier-tinted hover glow border */}
                    <div
                      className="absolute inset-0 rounded-2xl border-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{
                        borderColor: tier.accent,
                        boxShadow: `inset 0 0 20px ${tier.accent}20`,
                      }}
                    />
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* ── PAGINATION ────────────────────────────────────────────── */}
        {selectedDeck && totalPages > 1 && (
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-2 px-5 py-3 text-white text-sm font-bold rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <span className="font-black text-white">{page}</span>
              {' '}of{' '}
              <span className="font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>{totalPages}</span>
            </span>

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-2 px-5 py-3 text-white text-sm font-bold rounded-2xl shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
              style={{
                background:  'linear-gradient(135deg, #7c3aed, #be185d)',
                boxShadow:   '0 4px 20px rgba(124,58,237,0.40)',
              }}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

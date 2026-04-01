/**
 * Home Page
 *
 * Three-row infinite carousel of recently scanned/sold cards.
 *   Row 1 (50% height) — Rarion prestige      — scrolls left
 *   Row 2 (25% height) — Cosmos prestige       — scrolls right
 *   Row 3 (25% height) — All other cards       — scrolls left
 *
 * Live pull notification fires whenever a new card appears in the feed.
 */

import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Sparkles, Trash2 } from 'lucide-react'
import apiClient from '../services/api'
import { InventoryItem } from '../types'
import { useAuth } from '../contexts/AuthContext'

// ── prestige config ───────────────────────────────────────────────────────────

const PRESTIGE_CONFIG: Record<string, { label: string; sym: string; glow: string; border: string; badge: string }> = {
  rarion: {
    label:  'Rarion',
    sym:    '🔥',
    glow:   'rgba(251,146,60,0.7)',
    border: '#fb923c',
    badge:  'linear-gradient(135deg, #f97316, #dc2626)',
  },
  cosmos: {
    label:  'Cosmos',
    sym:    '◆',
    glow:   'rgba(192,132,252,0.7)',
    border: '#c084fc',
    badge:  'linear-gradient(135deg, #a855f7, #7c3aed)',
  },
  galaxy: {
    label:  'Galaxy',
    sym:    '✦',
    glow:   'rgba(96,165,250,0.6)',
    border: '#60a5fa',
    badge:  'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  },
  star: {
    label:  'Star',
    sym:    '★',
    glow:   'rgba(226,232,240,0.5)',
    border: '#e2e8f0',
    badge:  'linear-gradient(135deg, #94a3b8, #475569)',
  },
}

// ── pull notification ─────────────────────────────────────────────────────────

interface PullNotifProps {
  item: InventoryItem
  onDone: () => void
}

function PullNotification({ item, onDone }: PullNotifProps) {
  const [phase, setPhase] = useState<'in' | 'show' | 'out'>('in')
  const cfg = PRESTIGE_CONFIG[item.prestige] ?? PRESTIGE_CONFIG.star

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('show'), 30)
    const t2 = setTimeout(() => setPhase('out'),  5500)
    const t3 = setTimeout(() => onDone(),          6400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  const cardScale      = phase === 'in' ? 0.4 : phase === 'out' ? 0.3 : 1
  const cardOpacity    = phase === 'show' ? 1 : 0
  const cardY          = phase === 'in' ? '60px' : phase === 'out' ? '-40px' : '0px'

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
      style={{
        background: phase === 'show' ? 'rgba(0,0,0,0.82)' : 'rgba(0,0,0,0)',
        transition: 'background 0.45s ease',
        backdropFilter: phase === 'show' ? 'blur(8px)' : 'blur(0px)',
      }}
    >
      <div
        style={{
          opacity:    cardOpacity,
          transform:  `scale(${cardScale}) translateY(${cardY})`,
          transition: 'opacity 0.45s ease, transform 0.55s cubic-bezier(0.34,1.4,0.64,1)',
          width: 'min(420px, 88vw)',
        }}
      >
        {/* Glow halo behind the card */}
        <div
          className="absolute inset-0 rounded-3xl blur-3xl opacity-60 pointer-events-none -z-10"
          style={{
            background: `radial-gradient(ellipse at center, ${cfg.glow} 0%, transparent 70%)`,
            transform: 'scale(1.6)',
          }}
        />

        <div
          className="relative rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, rgba(10,6,30,0.98) 0%, rgba(20,12,50,0.98) 100%)',
            border: `2.5px solid ${cfg.border}`,
            boxShadow: `0 0 60px ${cfg.glow}, 0 30px 80px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.08)`,
          }}
        >
          {/* Shimmer sweep */}
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: `linear-gradient(110deg, transparent 20%, ${cfg.glow} 50%, transparent 80%)`,
              animation: 'shimmer-sweep 1.6s ease-out forwards',
            }}
          />

          {/* JUST PULLED label */}
          <div className="flex items-center justify-center gap-2 pt-5 pb-3">
            <Sparkles className="w-4 h-4" style={{ color: cfg.border }} />
            <span className="text-xs font-black tracking-[0.3em] uppercase" style={{ color: cfg.border }}>
              just pulled
            </span>
            <Sparkles className="w-4 h-4" style={{ color: cfg.border }} />
          </div>

          {/* Card image — large and centred */}
          <div className="flex justify-center px-8">
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                width: '75%',
                aspectRatio: '2.5/3.5',
                boxShadow: `0 0 40px ${cfg.glow}, 0 16px 48px rgba(0,0,0,0.8)`,
                border: `2px solid ${cfg.border}`,
              }}
            >
              {item.card_detail?.image ? (
                <img src={item.card_detail.image} alt={item.card_detail.name} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                  <Package className="w-16 h-16 text-slate-500" />
                </div>
              )}
            </div>
          </div>

          {/* Card name + set + prestige */}
          <div className="text-center px-6 pt-4 pb-6">
            <p className="text-white font-black text-2xl leading-tight mb-1">
              {item.card_detail?.name || 'Unknown Card'}
            </p>
            {item.card_detail?.set_name && (
              <p className="text-white/40 text-sm font-semibold mb-3">{item.card_detail.set_name}</p>
            )}
            <span
              className="inline-block text-sm font-black px-4 py-1.5 rounded-full text-white"
              style={{ background: cfg.badge, boxShadow: `0 4px 16px ${cfg.glow}` }}
            >
              {cfg.sym} {cfg.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── card strip ───────────────────────────────────────────────────────────────

interface StripProps {
  cards: InventoryItem[]
  direction: 'left' | 'right'
  /** flex-grow weight — strips fill available height proportionally */
  grow: number
  align?: 'start' | 'center' | 'end'
}

function CardStrip({ cards, direction, grow, align = 'center' }: StripProps) {
  if (cards.length === 0) {
    return (
      <div
        className="flex items-center justify-center overflow-hidden"
        style={{ flexGrow: grow, flexShrink: 1, flexBasis: 0, minHeight: 0 }}
      >
        <p className="text-white/15 text-xs font-bold tracking-widest uppercase">no cards</p>
      </div>
    )
  }

  const repsPerHalf = Math.max(2, Math.ceil(30 / cards.length))
  const half  = Array.from({ length: repsPerHalf }, () => cards).flat()
  const track = [...half, ...half]
  const speed = grow >= 35 ? half.length * 9 : half.length * 7
  const anim  = direction === 'left'
    ? `scroll-left ${speed}s linear infinite`
    : `scroll-right ${speed}s linear infinite`

  const alignClass = align === 'start' ? 'items-start' : align === 'end' ? 'items-end' : 'items-center'

  return (
    <div className="overflow-hidden w-full" style={{ flexGrow: grow, flexShrink: 1, flexBasis: 0, minHeight: 0 }}>
      <div className={`flex gap-2 sm:gap-4 h-full ${alignClass}`} style={{ animation: anim, width: 'max-content' }}>
        {track.map((item, idx) => (
          <div
            key={`${item.id}-${idx}`}
            className="flex-shrink-0 h-[70%] relative"
            style={{ aspectRatio: '2.5 / 3.5' }}
          >
            <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl">
              {item.card_detail?.image ? (
                <img
                  src={item.card_detail.image}
                  alt={item.card_detail?.name || 'Card'}
                  className="w-full h-full object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                  <Package className="w-1/4 h-1/4 text-slate-500" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── page ─────────────────────────────────────────────────────────────────────

function HomePage() {
  const { isInventoryAuthenticated } = useAuth()
  const [notification, setNotification] = useState<InventoryItem | null>(null)
  const [hiddenIds, setHiddenIds] = useState<Set<number>>(new Set())
  const seenIds = useRef<Set<number>>(new Set())
  const initialized = useRef(false)

  const { data: recentCards = [], isLoading: recentLoading, isError, error } = useQuery<InventoryItem[]>({
    queryKey: ['recent-scans'],
    queryFn: async () => {
      const response = await apiClient.get('/inventory/recent_scans/?limit=100')
      return response.data
    },
    refetchInterval: 4000,
    retry: 1,
  })

  const { data: showcaseCards = [], isLoading: showcaseLoading } = useQuery<InventoryItem[]>({
    queryKey: ['showcase-cards'],
    queryFn: async () => {
      const response = await apiClient.get('/inventory/showcase_cards/')
      return response.data
    },
    staleTime: 5 * 60 * 1000,   // re-fetch every 5 min so the random set refreshes
    retry: 1,
  })

  const isLoading = recentLoading && showcaseLoading

  // Detect newly added cards — skip the very first load
  useEffect(() => {
    if (recentCards.length === 0) return

    if (!initialized.current) {
      // Seed seen IDs on first load — no notification
      recentCards.forEach(c => seenIds.current.add(c.id))
      initialized.current = true
      return
    }

    // Find cards not seen before — newest first (index 0 = most recent)
    const newCard = recentCards.find(c => !seenIds.current.has(c.id))
    if (newCard) {
      recentCards.forEach(c => seenIds.current.add(c.id))
      setNotification(newCard)
    }
  }, [recentCards])

  const bgStyle = {
    backgroundImage: `url(${import.meta.env.BASE_URL}images/151bg.jpg)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center" style={bgStyle}>
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative text-white/60 text-lg animate-pulse">Loading...</div>
      </div>
    )
  }

  if (isError && showcaseCards.length === 0) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center" style={bgStyle}>
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative text-center">
          <Package className="w-16 h-16 text-red-400/60 mx-auto mb-4" />
          <p className="text-red-400 text-lg">Failed to load cards</p>
          <p className="text-white/30 text-sm mt-2 font-mono">{String((error as any)?.message || error)}</p>
        </div>
      </div>
    )
  }

  const visibleCards = recentCards.filter(c => !hiddenIds.has(c.id))

  // Build strip data from showcase cards (random high-prestige selection),
  // falling back to recent cards if showcase hasn't loaded yet.
  const stripSource = showcaseCards.length > 0 ? showcaseCards : visibleCards
  const rarionCards = stripSource.filter(c => c.prestige === 'rarion')
  const cosmosCards = stripSource.filter(c => c.prestige === 'cosmos')
  const galaxyCards = stripSource.filter(c => c.prestige === 'galaxy')

  return (
    <>
      <div className="fixed inset-0 z-40 overflow-hidden flex flex-col" style={bgStyle}>
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex flex-col h-full pt-20 sm:pt-24 pb-16 md:pb-0">
          <CardStrip cards={rarionCards} direction="left"  grow={38} align="end" />
          {/* Recently Pulled heading */}
          <div className="flex items-center justify-center gap-3 sm:gap-5 flex-shrink-0 py-0.5 sm:py-0">
            <span className="block h-px w-12 sm:w-32 bg-gradient-to-r from-transparent to-white/30" />
            <span
              className="text-base sm:text-2xl lg:text-4xl font-black tracking-[0.12em] sm:tracking-[0.2em] uppercase whitespace-nowrap"
              style={{
                background: 'linear-gradient(90deg, #fb923c 0%, #c084fc 50%, #60a5fa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 18px rgba(192,132,252,0.65))',
              }}
            >
              Recently Pulled
            </span>
            <span className="block h-px w-12 sm:w-32 bg-gradient-to-l from-transparent to-white/30" />
          </div>
          <CardStrip cards={cosmosCards} direction="right" grow={28} align="end" />
          <CardStrip cards={galaxyCards} direction="left"  grow={28} align="start" />
        </div>

        {/* Footer — sits in the bottom padding gap, above mobile nav */}
        <div className="absolute bottom-16 md:bottom-0 left-0 right-0 z-20 flex items-center justify-between px-5 py-2.5">
          {/* Left: logo + copyright */}
          <div className="flex items-center gap-2.5">
            <img src="/images/RarionLogoPlainnobg.png" alt="Rarion" className="h-4 w-auto opacity-50" />
            <span className="text-white/30 text-[10px] font-medium hidden sm:inline">© {new Date().getFullYear()} Rarion. All rights reserved.</span>
          </div>

          {/* Center: disclaimer */}
          <span className="text-white/25 text-[9px] text-center hidden md:block">
            Not affiliated with Nintendo or The Pokémon Company International.
          </span>

          {/* Right: legal links + admin clear */}
          <div className="flex items-center gap-4">
            <Link to="/tos"     className="text-white/35 hover:text-white/70 text-[10px] font-medium transition-colors">Terms</Link>
            <Link to="/privacy" className="text-white/35 hover:text-white/70 text-[10px] font-medium transition-colors">Privacy</Link>
            {isInventoryAuthenticated && (
              <button
                onClick={() => setHiddenIds(new Set(recentCards.map(c => c.id)))}
                title="Clear homepage cards"
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-white/35 hover:text-red-400 hover:bg-red-500/10 transition-all text-[10px] font-medium border border-transparent hover:border-red-500/20"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pull notification — rendered outside z-40 container so it floats on top */}
      {notification && (
        <PullNotification
          item={notification}
          onDone={() => setNotification(null)}
        />
      )}
    </>
  )
}

export default HomePage



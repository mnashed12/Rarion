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
import { Package, Sparkles } from 'lucide-react'
import apiClient from '../services/api'
import { InventoryItem } from '../types'

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
    const t1 = setTimeout(() => setPhase('show'), 50)   // let 'in' render first
    const t2 = setTimeout(() => setPhase('out'),  4500)
    const t3 = setTimeout(() => onDone(),          5200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  const translateY = phase === 'in' ? '100%' : phase === 'out' ? '120%' : '0%'
  const opacity    = phase === 'show' ? 1 : 0

  return (
    <div
      className="fixed bottom-8 left-1/2 z-[9999] pointer-events-none"
      style={{
        transform:    `translateX(-50%) translateY(${translateY})`,
        opacity,
        transition:   'transform 0.55s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease',
        width:        'min(480px, 92vw)',
      }}
    >
      {/* Card shell */}
      <div
        className="relative rounded-2xl overflow-hidden flex items-center gap-4 p-4"
        style={{
          background:   'linear-gradient(135deg, rgba(15,10,40,0.97) 0%, rgba(30,20,60,0.97) 100%)',
          border:       `2px solid ${cfg.border}`,
          boxShadow:    `0 0 40px ${cfg.glow}, 0 20px 60px rgba(0,0,0,0.7)`,
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Animated shimmer sweep */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(105deg, transparent 30%, ${cfg.glow} 50%, transparent 70%)`,
            animation:  'shimmer-sweep 1.8s ease-out forwards',
          }}
        />

        {/* Card thumbnail */}
        <div
          className="relative flex-shrink-0 rounded-xl overflow-hidden"
          style={{
            width: '70px',
            aspectRatio: '2.5/3.5',
            boxShadow: `0 0 20px ${cfg.glow}`,
            border: `2px solid ${cfg.border}`,
          }}
        >
          {item.card_detail?.image ? (
            <img
              src={item.card_detail.image}
              alt={item.card_detail.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full bg-slate-800 flex items-center justify-center">
              <Package className="w-6 h-6 text-slate-500" />
            </div>
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 relative z-10">
          {/* Top label */}
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3.5 h-3.5 flex-shrink-0" style={{ color: cfg.border }} />
            <span className="text-[11px] font-black tracking-widest uppercase" style={{ color: cfg.border }}>
              just pulled
            </span>
          </div>

          {/* Card name */}
          <p className="text-white font-black text-lg leading-tight truncate">
            {item.card_detail?.name || 'Unknown Card'}
          </p>

          {/* Set + prestige badge row */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {item.card_detail?.set_name && (
              <span className="text-white/40 text-[11px] font-semibold truncate max-w-[180px]">
                {item.card_detail.set_name}
              </span>
            )}
            <span
              className="text-[11px] font-black px-2 py-0.5 rounded-full text-white flex-shrink-0"
              style={{ background: cfg.badge }}
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
  rowHeight: string
  align?: 'start' | 'center' | 'end'
}

function CardStrip({ cards, direction, rowHeight, align = 'center' }: StripProps) {
  if (cards.length === 0) {
    return (
      <div
        className="flex items-center justify-center overflow-hidden flex-shrink-0"
        style={{ height: rowHeight }}
      >
        <p className="text-white/15 text-xs font-bold tracking-widest uppercase">no cards</p>
      </div>
    )
  }

  const repsPerHalf = Math.max(2, Math.ceil(30 / cards.length))
  const half  = Array.from({ length: repsPerHalf }, () => cards).flat()
  const track = [...half, ...half]
  const speed = rowHeight === '38%' ? half.length * 9 : half.length * 7
  const anim  = direction === 'left'
    ? `scroll-left ${speed}s linear infinite`
    : `scroll-right ${speed}s linear infinite`

  const alignClass = align === 'start' ? 'items-start' : align === 'end' ? 'items-end' : 'items-center'

  return (
    <div className="overflow-hidden flex-shrink-0 w-full" style={{ height: rowHeight }}>
      <div className={`flex gap-4 h-full ${alignClass}`} style={{ animation: anim, width: 'max-content' }}>
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
  const [notification, setNotification] = useState<InventoryItem | null>(null)
  const seenIds = useRef<Set<number>>(new Set())
  const initialized = useRef(false)

  const { data: recentCards = [], isLoading, isError, error } = useQuery<InventoryItem[]>({
    queryKey: ['recent-scans'],
    queryFn: async () => {
      const response = await apiClient.get('/inventory/recent_scans/?limit=100')
      return response.data
    },
    refetchInterval: 4000,
    retry: 1,
  })

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

  const rarionCards = recentCards.filter(c => c.prestige === 'rarion')
  const cosmosCards = recentCards.filter(c => c.prestige === 'cosmos')
  const otherCards  = recentCards.filter(c => c.prestige !== 'rarion' && c.prestige !== 'cosmos')

  return (
    <>
      <div className="fixed inset-0 z-40 overflow-hidden flex flex-col" style={bgStyle}>
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex flex-col h-full pt-20 sm:pt-24">
          <CardStrip cards={rarionCards} direction="left"  rowHeight="38%" align="end" />
          <CardStrip cards={cosmosCards} direction="right" rowHeight="31%" align="end" />
          <CardStrip cards={otherCards}  direction="left"  rowHeight="31%" align="start" />
        </div>

        {/* Footer — floats above cards in the empty bottom space */}
        <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between px-5 py-2.5">
          {/* Left: logo + copyright */}
          <div className="flex items-center gap-2.5">
            <img src="/images/RarionLogoPlainnobg.png" alt="Rarion" className="h-4 w-auto opacity-50" />
            <span className="text-white/30 text-[10px] font-medium hidden sm:inline">© {new Date().getFullYear()} Rarion. All rights reserved.</span>
          </div>

          {/* Center: disclaimer */}
          <span className="text-white/25 text-[9px] text-center hidden md:block">
            Not affiliated with Nintendo or The Pokémon Company International.
          </span>

          {/* Right: legal links */}
          <div className="flex items-center gap-4">
            <Link to="/tos"     className="text-white/35 hover:text-white/70 text-[10px] font-medium transition-colors">Terms</Link>
            <Link to="/privacy" className="text-white/35 hover:text-white/70 text-[10px] font-medium transition-colors">Privacy</Link>
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



/**
 * Inventory Page
 * 
 * Pokemon-themed inventory management with:
 * - Gradient stat cards
 * - Animated card list
 * - Condition badges with Pokemon colors
 */

import { useState, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { 
  Package, 
  Plus, 
  Search, 
  SlidersHorizontal,
  Download, 
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  Play,
  Upload,
  FolderPlus,
  Printer,
  QrCode,
  Undo2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import apiClient, { API_BASE_URL } from '../services/api'
import type { InventoryItem, Deck } from '../types'
import { Toast, ConfirmModal, type ToastType } from '../components/common'

// ── prestige config (mirrors HomePage) ───────────────────────────────────────
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
function PullNotification({ item, onDone }: { item: InventoryItem; onDone: () => void }) {
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
        {/* Glow halo */}
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
                <img src={item.card_detail.image} alt={item.card_detail?.name || 'Card'} className="w-full h-full object-contain" />
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

// Map deck background_image key → filename (default: PAKMAKDECK.PNG)
function getDeckImage(deck: Deck): string {
  if (deck.background_image === 'DANNYDECK') return 'DANNYDECK.PNG'
  return 'PAKMAKDECK.PNG'
}

function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [decks, setDecks] = useState<Deck[]>([])
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [conditionFilter, setConditionFilter] = useState<string>('')
  const [prestigeFilter, setPrestigeFilter] = useState<string>('')
  const [minPrice, setMinPrice] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')
  const [ordering, setOrdering] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null)
  const [carouselDeck, setCarouselDeck] = useState<Deck | null>(null)
  const [carouselCards, setCarouselCards] = useState<InventoryItem[]>([])
  const [, setCarouselIndex] = useState(0)
  const [, setCarouselLoading] = useState(false)
  const [fadedCards, setFadedCards] = useState<Set<number>>(new Set())
  const [carouselNotification, setCarouselNotification] = useState<InventoryItem | null>(null)
  const [uploadingDeckId, setUploadingDeckId] = useState<number | null>(null)
  const [importModal, setImportModal] = useState<{ deckName: string; phase: number } | null>(null)
  const [importResult, setImportResult] = useState<{ imported: number; updated: number; not_found: number; not_found_cards?: string[]; errors?: number; error_details?: string[] } | null>(null)
  const [failedCards, setFailedCards] = useState<{ deckId: number; deckName: string; cards: string[] } | null>(() => {
    try {
      const stored = localStorage.getItem('pakmak_failed_cards')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })

  const [manualAddModal, setManualAddModal] = useState<{ deckId: number; deckName: string; prefill?: string } | null>(null)
  const [manualAddForm, setManualAddForm] = useState({ name: '', set_name: '', card_number: '', condition: 'near_mint', quantity: '1', purchase_price: '', current_price: '', notes: '' })
  const [manualAddImage, setManualAddImage] = useState<File | null>(null)
  const [manualAddLoading, setManualAddLoading] = useState(false)
  const [editItem, setEditItem] = useState<InventoryItem | null>(null)
  const [editForm, setEditForm] = useState({ condition: 'near_mint', quantity: '1', purchase_price: '', current_price: '', notes: '', prestige: 'star', location: '' })
  const [editLoading, setEditLoading] = useState(false)
  const [deckModal, setDeckModal] = useState<{ mode: 'create' | 'rename'; deck?: Deck; name: string; background_image: 'PAKMAKDECK' | 'DANNYDECK' } | null>(null)
  const [_deckStats, setDeckStats] = useState<{ total_items: number; total_quantity: number; total_value: number; low_stock: number } | null>(null)
  
  // Scanner state
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scannerDeck, setScannerDeck] = useState<Deck | null>(null)
  const [lastSoldCard, setLastSoldCard] = useState<{ name: string; auction_code: string } | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const queryClient = useQueryClient()
  const [assigningPrestige, setAssigningPrestige] = useState(false)


  // Sync failedCards to localStorage whenever it changes
  useEffect(() => {
    if (failedCards) {
      localStorage.setItem('pakmak_failed_cards', JSON.stringify(failedCards))
    } else {
      localStorage.removeItem('pakmak_failed_cards')
    }
  }, [failedCards])

  // Fun loading messages for import
  const importMessages = [
    "Shuffling the deck...",
    "Catching wild cards...",
    "Consulting Professor Oak...",
    "Scanning the Pokédex...",
    "Evolving your collection...",
    "Training at the gym...",
    "Battling for rare cards...",
    "Opening booster packs...",
  ]

  const ITEMS_PER_PAGE = 20

  // Fetch decks
  useEffect(() => {
    const fetchDecks = async () => {
      try {
        const [deckRes, statsRes] = await Promise.allSettled([
          apiClient.get('/decks/'),
          apiClient.get('/inventory/prestige_by_deck/'),
        ])
        if (deckRes.status === 'rejected') {
          console.error('Error fetching decks:', deckRes.reason)
          return
        }
        const statsData = statsRes.status === 'fulfilled' ? statsRes.value.data : {}
        const fetchedDecks = mergePrestigeStats(
          deckRes.value.data.results || deckRes.value.data,
          statsData
        )
        setDecks(fetchedDecks)
        // Auto-select first deck if available
        if (fetchedDecks.length > 0 && !selectedDeck) {
          setSelectedDeck(fetchedDecks[0])
        }
      } catch (error) {
        console.error('Error fetching decks:', error)
      }
    }
    fetchDecks()
  }, [])

  // Fetch inventory items for selected deck
  useEffect(() => {
    if (!selectedDeck) {
      setLoading(false)
      setDeckStats(null)
      return
    }

    const controller = new AbortController()

    const fetchInventory = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (searchTerm) params.append('search', searchTerm)
        if (conditionFilter) params.append('condition', conditionFilter)
        if (prestigeFilter) params.append('prestige', prestigeFilter)
        if (minPrice) params.append('min_price', minPrice)
        if (maxPrice) params.append('max_price', maxPrice)
        if (ordering) params.append('ordering', ordering)
        params.append('deck', selectedDeck.id.toString())
        params.append('page', page.toString())
        params.append('page_size', ITEMS_PER_PAGE.toString())

        const response = await apiClient.get(`/inventory/?${params.toString()}`, { signal: controller.signal })
        setInventory(response.data.results || [])
        setTotalCount(response.data.count || 0)
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'name' in error && (error as { name: string }).name === 'CanceledError') return
        console.error('Error fetching inventory:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInventory()
    return () => controller.abort()
  }, [searchTerm, conditionFilter, prestigeFilter, minPrice, maxPrice, ordering, page, selectedDeck])

  // Fetch deck stats (separate from pagination)
  useEffect(() => {
    if (!selectedDeck) return

    const fetchDeckStats = async () => {
      try {
        const response = await apiClient.get(`/inventory/stats/?deck=${selectedDeck.id}`)
        setDeckStats(response.data)
      } catch (error) {
        console.error('Error fetching deck stats:', error)
      }
    }

    fetchDeckStats()
  }, [selectedDeck])

  // Keyboard navigation for carousel - Escape to close
  useEffect(() => {
    if (!carouselDeck) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCarouselDeck(null)
        setCarouselCards([])
        setCarouselIndex(0)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [carouselDeck])

  // Poll recent_scans while the carousel is open — fire PullNotification and
  // stamp PULLED on any card whose QR gets scanned (mirrors the homepage feed).
  const carouselSeenIds = useRef<Set<number>>(new Set())
  useEffect(() => {
    if (!carouselDeck) {
      carouselSeenIds.current = new Set()
      return
    }

    const initialized = { current: false }

    const poll = async () => {
      try {
        const res = await apiClient.get('/inventory/recent_scans/?limit=50')
        const items: InventoryItem[] = res.data

        if (!initialized.current) {
          // Seed on first load — don't fire notifications for pre-existing sold cards
          items.forEach(item => carouselSeenIds.current.add(item.id))
          initialized.current = true
          return
        }

        const newItems = items.filter(item => !carouselSeenIds.current.has(item.id))
        if (newItems.length === 0) return
        newItems.forEach(item => carouselSeenIds.current.add(item.id))

        // Mark all newly-sold cards that live in this carousel
        setCarouselCards(prev => {
          const newIds = new Set(newItems.map(i => i.id))
          let hit: InventoryItem | undefined
          const updated = prev.map(item => {
            if (newIds.has(item.id) && !item.sold_at) {
              const soldVersion = { ...item, sold_at: new Date().toISOString() }
              if (!hit) hit = soldVersion
              return soldVersion
            }
            return item
          })
          if (hit) setCarouselNotification(hit)
          return updated
        })
      } catch {
        // silently ignore poll errors
      }
    }

    poll() // immediate first tick
    const interval = setInterval(poll, 3000)
    return () => clearInterval(interval)
  }, [carouselDeck])

  // Handle CSV file upload for a deck
  const handleCsvUpload = async (deckId: number, file: File) => {
    const deck = decks.find(d => d.id === deckId)
    setUploadingDeckId(deckId)
    setImportResult(null)
    setImportModal({ deckName: deck?.name || 'Deck', phase: 0 })
    
    // Cycle through fun messages
    const messageInterval = setInterval(() => {
      setImportModal(prev => prev ? { ...prev, phase: (prev.phase + 1) % importMessages.length } : null)
    }, 800)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('clear', 'true') // Clear existing items in deck
      
      const response = await apiClient.post(`/decks/${deckId}/import_csv/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes for large CSV imports
      })
      
      const result = response.data
      console.log('[CSV Import] Full response:', result)
      clearInterval(messageInterval)
      setImportResult(result)
      
      // Refresh the inventory and stats if this is the selected deck
      if (selectedDeck?.id === deckId) {
        setPage(1) // This will trigger a refetch
        // Also refresh stats
        const statsResponse = await apiClient.get(`/inventory/stats/?deck=${deckId}`)
        setDeckStats(statsResponse.data)
      }
      // Refresh all deck prestige stats (bars on cards update live)
      await refreshDecks()
      
      // Persist failed cards so user can add them manually
      if (result.not_found_cards && result.not_found_cards.length > 0) {
        setFailedCards({ deckId: deckId, deckName: deck?.name || 'Deck', cards: result.not_found_cards })

      }

      // Auto-close after showing results
      setTimeout(() => {
        setImportModal(null)
        setImportResult(null)
        setUploadingDeckId(null)
      }, 3000)
    } catch (error: any) {
      clearInterval(messageInterval)
      console.error('[CSV Import] Error:', error)
      console.error('[CSV Import] Response data:', error.response?.data)

      const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout')

      // Keep the modal open to show the timeout state instead of silently dismissing
      if (isTimeout) {
        setImportResult({
          imported: 0,
          updated: 0,
          not_found: 0,
          errors: 0,
          error_details: [],
          not_found_cards: [],
          _timed_out: true,
        } as any)
        // Auto-close after displaying the message
        setTimeout(() => {
          setImportModal(null)
          setImportResult(null)
          setUploadingDeckId(null)
        }, 5000)
      } else {
        setImportModal(null)
        setUploadingDeckId(null)
        setToast({
          message: error.response?.data?.error || 'Failed to import CSV',
          type: 'error',
        })
      }
    }
  }

  // Merge prestige stats from /inventory/prestige_by_deck/ into a deck list
  const mergePrestigeStats = (deckList: Deck[], statsMap: Record<number, { star: number; galaxy: number; cosmos: number; rarion: number; total: number }>): Deck[] =>
    deckList.map(d => ({ ...d, prestige_stats: statsMap[d.id] ?? { star: 0, galaxy: 0, cosmos: 0, rarion: 0, total: 0 } }))

  // Refresh decks list and keep selectedDeck in sync (so prestige bars update)
  const refreshDecks = async () => {
    const [deckRes, statsRes] = await Promise.allSettled([
      apiClient.get('/decks/'),
      apiClient.get('/inventory/prestige_by_deck/'),
    ])
    if (deckRes.status === 'rejected') return
    const statsData = statsRes.status === 'fulfilled' ? statsRes.value.data : {}
    const fresh = mergePrestigeStats(deckRes.value.data.results || deckRes.value.data, statsData)
    setDecks(fresh)
    setSelectedDeck(prev => prev ? (fresh.find(d => d.id === prev.id) ?? prev) : prev)
  }

  // Handle creating a new deck
  const handleCreateDeck = async () => {
    if (!deckModal?.name.trim()) return
    
    try {
      const response = await apiClient.post('/decks/', {
        name: deckModal.name.trim(),
        background_image: deckModal.background_image,
      })
      const newDeck = response.data
      setDecks(prev => [...prev, newDeck])
      setSelectedDeck(newDeck)
      setDeckModal(null)
      setToast({ message: `Deck "${newDeck.name}" created!`, type: 'success' })
    } catch (error: any) {
      console.error('Error creating deck:', error)
      setToast({ message: error.response?.data?.error || 'Failed to create deck', type: 'error' })
    }
  }

  // Handle renaming a deck
  const handleRenameDeck = async () => {
    if (!deckModal?.deck || !deckModal.name.trim()) return
    
    try {
      const response = await apiClient.patch(`/decks/${deckModal.deck.id}/`, {
        name: deckModal.name.trim(),
        background_image: deckModal.background_image,
      })
      const updatedDeck = response.data
      setDecks(prev => prev.map(d => d.id === updatedDeck.id ? updatedDeck : d))
      if (selectedDeck?.id === updatedDeck.id) {
        setSelectedDeck(updatedDeck)
      }
      setDeckModal(null)
      setToast({ message: `Deck renamed to "${updatedDeck.name}"`, type: 'success' })
    } catch (error: any) {
      console.error('Error renaming deck:', error)
      setToast({ message: error.response?.data?.error || 'Failed to rename deck', type: 'error' })
    }
  }

  // Open scanner for a deck
  const openScanner = (deck: Deck) => {
    setScannerDeck(deck)
    setScannerOpen(true)
    setLastSoldCard(null)
  }

  // Close scanner
  const closeScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current = null
      } catch (e) {
        // Ignore errors on stop
      }
    }
    setScannerOpen(false)
    setScannerDeck(null)
    setLastSoldCard(null)
    
    // Refresh inventory + deck prestige stats when scanner closes
    if (selectedDeck) {
      setPage(1)
      const statsResponse = await apiClient.get(`/inventory/stats/?deck=${selectedDeck.id}`)
      setDeckStats(statsResponse.data)
    }
    await refreshDecks()
  }

  // Handle successful QR scan
  const handleScan = async (code: string) => {
    try {
      const response = await apiClient.post('/inventory/sell_by_code/', { auction_code: code })
      const cardName = response.data.item?.card_detail?.name || 'Card'
      setLastSoldCard({ name: cardName, auction_code: code })
      setToast({ message: `Sold: ${cardName}`, type: 'success' })
      
      // Update local inventory state to show strikethrough
      setInventory(prev => prev.map(item => 
        item.auction_code === code ? { ...item, sold_at: new Date().toISOString() } : item
      ))
      // Also cross out the card in the carousel animation if it is open
      setCarouselCards(prev => {
        const updated = prev.map(item =>
          item.auction_code === code ? { ...item, sold_at: new Date().toISOString() } : item
        )
        // Fire pull notification if the carousel is open and this card belongs to it
        const hit = updated.find(item => item.auction_code === code)
        if (hit) setCarouselNotification(hit)
        return updated
      })
      // Invalidate the homepage recent-scans cache so it refreshes immediately
      queryClient.invalidateQueries({ queryKey: ['recent-scans'] })
      // Refresh deck prestige stats (a card was sold, pull rates change live)
      await refreshDecks()
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to mark as sold'
      setToast({ message: errorMsg, type: 'error' })
    }
  }

  // Manually add a card to a deck
  const handleManualAdd = async () => {
    if (!manualAddModal) return
    setManualAddLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', manualAddForm.name)
      formData.append('set_name', manualAddForm.set_name)
      formData.append('card_number', manualAddForm.card_number)
      formData.append('condition', manualAddForm.condition)
      formData.append('quantity', manualAddForm.quantity)
      formData.append('purchase_price', manualAddForm.purchase_price)
      formData.append('current_price', manualAddForm.current_price)
      formData.append('notes', manualAddForm.notes)
      if (manualAddImage) formData.append('image', manualAddImage)

      await apiClient.post(`/decks/${manualAddModal.deckId}/add_card_manual/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      // Remove this card from the failed list if it was there
      if (failedCards) {
        const remaining = failedCards.cards.filter(c => !c.toLowerCase().includes(manualAddForm.name.toLowerCase()))
        setFailedCards(remaining.length > 0 ? { ...failedCards, cards: remaining } : null)
      }

      setToast({ message: `${manualAddForm.name} added to deck!`, type: 'success' })
      setManualAddModal(null)
      setManualAddForm({ name: '', set_name: '', card_number: '', condition: 'near_mint', quantity: '1', purchase_price: '', current_price: '', notes: '' })
      setManualAddImage(null)

      if (selectedDeck?.id === manualAddModal.deckId) {
        setPage(1)
      }
      await refreshDecks()
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || 'Failed to add card', type: 'error' })
    } finally {
      setManualAddLoading(false)
    }
  }

  // Auto-assign prestige based on price
  const handleAutoAssignPrestige = async () => {
    setAssigningPrestige(true)
    try {
      const body = selectedDeck ? { deck_id: selectedDeck.id } : {}
      const response = await apiClient.post('/inventory/auto_assign_prestige/', body)
      const { updated, total } = response.data
      setToast({ message: `Prestige updated: ${updated} of ${total} cards reassigned`, type: 'success' })
      // Refresh deck prestige stats (pull rate bars update)
      await refreshDecks()
      // Refresh inventory
      const params = new URLSearchParams()
      if (selectedDeck) params.append('deck', selectedDeck.id.toString())
      params.append('page', page.toString())
      params.append('page_size', '20')
      const inv = await apiClient.get(`/inventory/?${params.toString()}`)
      setInventory(inv.data.results || [])
    } catch {
      setToast({ message: 'Failed to assign prestige', type: 'error' })
    } finally {
      setAssigningPrestige(false)
    }
  }

  // Undo last sale
  const handleUndoSale = async () => {
    if (!lastSoldCard) return
    
    try {
      await apiClient.post('/inventory/unsell_by_code/', { auction_code: lastSoldCard.auction_code })
      setToast({ message: `Restored: ${lastSoldCard.name}`, type: 'success' })
      setLastSoldCard(null)
      
      // Update local inventory state
      setInventory(prev => prev.map(item => 
        item.auction_code === lastSoldCard.auction_code ? { ...item, sold_at: null } : item
      ))
      // Also restore the card in the carousel animation if it is open
      setCarouselCards(prev => prev.map(item =>
        item.auction_code === lastSoldCard.auction_code ? { ...item, sold_at: null } : item
      ))
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || 'Failed to undo sale', type: 'error' })
    }
  }

  // Initialize scanner when modal opens
  useEffect(() => {
    if (!scannerOpen) return

    const initScanner = async () => {
      try {
        const scanner = new Html5Qrcode('qr-reader')
        scannerRef.current = scanner
        
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            handleScan(decodedText)
          },
          () => {
            // Ignore errors during scanning
          }
        )
      } catch (err) {
        console.error('Failed to start scanner:', err)
        setToast({ message: 'Failed to access camera', type: 'error' })
      }
    }

    // Small delay to ensure DOM is ready
    setTimeout(initScanner, 100)

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [scannerOpen])

  // Use stats from API (accurate for entire deck)

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  const conditionLabels: Record<string, string> = {
    mint: 'Mint',
    near_mint: 'Near Mint',
    lightly_played: 'Lightly Played',
    moderately_played: 'Mod. Played',
    heavily_played: 'Heavily Played',
    damaged: 'Damaged'
  }

  const conditionColors: Record<string, string> = {
    mint: 'bg-gradient-to-r from-teal-400 to-teal-500 text-white',
    near_mint: 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-white',
    lightly_played: 'bg-gradient-to-r from-blue-400 to-blue-500 text-white',
    moderately_played: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black',
    heavily_played: 'bg-gradient-to-r from-orange-400 to-orange-500 text-white',
    damaged: 'bg-gradient-to-r from-red-500 to-red-600 text-white'
  }

  const prestigeColors: Record<string, string> = {
    star: 'bg-white text-black border-gray-300',
    galaxy: 'bg-gradient-to-r from-blue-400 to-blue-500 text-white border-blue-400',
    cosmos: 'bg-gradient-to-r from-purple-400 to-purple-500 text-white border-purple-400',
    rarion: 'bg-gradient-to-r from-orange-400 to-orange-500 text-white border-orange-400'
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24 py-6 pb-24 md:pb-8 min-h-screen">
      {/* Deck Selector */}
      <div className="animate-slide-down" style={{ animationDelay: '150ms' }}>
        {decks.length === 0 ? (
          <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-100 p-10 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg">
              <FolderPlus className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Create Your First Deck!</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Organize your card collection into decks. Create a deck to get started!
            </p>
            <button 
              onClick={() => setDeckModal({ mode: 'create', name: '', background_image: 'PAKMAKDECK' })}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Create Deck
            </button>
          </div>
        ) : (
          <div className="rounded-2xl p-5 pt-10">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {decks.map((deck) => (
                <div
                  key={deck.id}
                  className="relative group"
                  onClick={() => {
                    setSelectedDeck(deck)
                    setPage(1)
                  }}
                >
                  {/* Stacked card effect - bottom layers */}
                  <div className="absolute inset-0 bg-gray-200 rounded-2xl transform translate-y-2 translate-x-1 opacity-40"></div>
                  <div className="absolute inset-0 bg-gray-300 rounded-2xl transform translate-y-1 translate-x-0.5 opacity-60"></div>
                  
                  {/* Main deck card */}
                  <div
                    className={`
                      relative aspect-[3/4] rounded-2xl border-4 transition-all cursor-pointer
                      flex flex-col items-center justify-center p-4
                      ${selectedDeck?.id === deck.id 
                        ? 'border-emerald-600 text-white shadow-2xl shadow-emerald-500/50 scale-105 -rotate-2' 
                        : 'border-gray-300 text-gray-700 hover:border-emerald-400 hover:shadow-xl hover:-translate-y-1'
                      }
                    `}
                    style={{
                      backgroundImage: selectedDeck?.id === deck.id
                        ? `linear-gradient(135deg, rgba(16,185,129,0.72) 0%, rgba(5,150,105,0.80) 100%), url(${import.meta.env.BASE_URL}images/${getDeckImage(deck)})`
                        : `linear-gradient(135deg, rgba(255,255,255,0.70) 0%, rgba(243,244,246,0.78) 100%), url(${import.meta.env.BASE_URL}images/${getDeckImage(deck)})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    {/* Card back pattern - decorative lines */}
                    <div className={`absolute inset-0 rounded-xl overflow-hidden ${selectedDeck?.id === deck.id ? 'opacity-10' : 'opacity-5'}`}>
                      <div className="absolute inset-0" style={{
                        backgroundImage: 'repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 1px, transparent 10px)',
                      }}></div>
                      <div className="absolute inset-0" style={{
                        backgroundImage: 'repeating-linear-gradient(-45deg, currentColor 0, currentColor 1px, transparent 1px, transparent 10px)',
                      }}></div>
                    </div>

                    {/* Top Left - Upload CSV */}
                    <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-all">
                      <label
                        className={`
                          p-1.5 rounded-lg transition-all cursor-pointer flex
                          ${uploadingDeckId === deck.id ? 'animate-pulse' : ''}
                          ${selectedDeck?.id === deck.id 
                            ? 'bg-blue-500/20 hover:bg-blue-500/30 text-white' 
                            : 'bg-white/80 hover:bg-blue-50 text-gray-400 hover:text-blue-600 shadow-sm'
                          }
                        `}
                        onClick={(e) => e.stopPropagation()}
                        title="Import CSV"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <input
                          type="file"
                          accept=".csv"
                          className="hidden"
                          disabled={uploadingDeckId === deck.id}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleCsvUpload(deck.id, file)
                              e.target.value = '' // Reset for same file re-upload
                            }
                          }}
                        />
                      </label>
                    </div>

                    {/* Top Right - Play, Rename, Delete */}
                    <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      {/* Play button */}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          setCarouselLoading(true)
                          setCarouselDeck(deck)
                          setCarouselIndex(0)
                          setFadedCards(new Set()) // Reset faded cards
                          try {
                            const allCards: InventoryItem[] = []
                            let url: string | null = `/inventory/?deck=${deck.id}&page_size=100`
                            while (url) {
                              const res: { data: { results: InventoryItem[]; next: string | null } } = await apiClient.get(url)
                              allCards.push(...(res.data.results || []))
                              const next: string | null = res.data.next
                              if (!next) break
                              const apiIndex: number = next.indexOf('/api/')
                              url = apiIndex !== -1 ? next.slice(apiIndex + 4) : next.replace(/^https?:\/\/[^/]+/, '')
                            }
                            setCarouselCards(allCards)
                          } catch (error) {
                            console.error('Error fetching deck cards:', error)
                            setToast({ message: 'Failed to load deck cards', type: 'error' })
                          } finally {
                            setCarouselLoading(false)
                          }
                        }}
                        className={`
                          p-1.5 rounded-lg transition-all
                          ${selectedDeck?.id === deck.id 
                            ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-white' 
                            : 'bg-white/80 hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 shadow-sm'
                          }
                        `}
                        title="View Cards"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                      {/* Rename button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeckModal({ mode: 'rename', deck, name: deck.name, background_image: deck.background_image ?? 'PAKMAKDECK' })
                        }}
                        className={`
                          p-1.5 rounded-lg transition-all
                          ${selectedDeck?.id === deck.id 
                            ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-white' 
                            : 'bg-white/80 hover:bg-yellow-50 text-gray-400 hover:text-yellow-600 shadow-sm'
                          }
                        `}
                        title="Rename Deck"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setConfirmModal({
                            message: `Delete deck "${deck.name}"? This will remove all cards from this deck.`,
                            onConfirm: async () => {
                              try {
                                await apiClient.delete(`/decks/${deck.id}/`)
                                const updatedDecks = decks.filter(d => d.id !== deck.id)
                                setDecks(updatedDecks)
                                if (selectedDeck?.id === deck.id) {
                                  setSelectedDeck(updatedDecks.length > 0 ? updatedDecks[0] : null)
                                }
                                setToast({ message: 'Deck deleted successfully', type: 'success' })
                              } catch (error) {
                                console.error('Error deleting deck:', error)
                                setToast({ message: 'Failed to delete deck', type: 'error' })
                              }
                            }
                          })
                        }}
                        className={`
                          p-1.5 rounded-lg transition-all
                          ${selectedDeck?.id === deck.id 
                            ? 'bg-red-500/20 hover:bg-red-500/30 text-white' 
                            : 'bg-white/80 hover:bg-red-50 text-gray-400 hover:text-red-600 shadow-sm'
                          }
                        `}
                        title="Delete Deck"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Bottom Left - Print QR Labels, Scan QR */}
                    <div className="absolute bottom-2 left-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      {/* Print Labels button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(`${API_BASE_URL}/decks/${deck.id}/print_labels/`, '_blank')
                        }}
                        className={`
                          p-1.5 rounded-lg transition-all
                          ${selectedDeck?.id === deck.id 
                            ? 'bg-purple-500/20 hover:bg-purple-500/30 text-white' 
                            : 'bg-white/80 hover:bg-purple-50 text-gray-400 hover:text-purple-600 shadow-sm'
                          }
                        `}
                        title="Print QR Labels"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      {/* Scan QR button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openScanner(deck)
                        }}
                        className={`
                          p-1.5 rounded-lg transition-all
                          ${selectedDeck?.id === deck.id 
                            ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-white' 
                            : 'bg-white/80 hover:bg-cyan-50 text-gray-400 hover:text-cyan-600 shadow-sm'
                          }
                        `}
                        title="Scan to Sell"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                    </div>
 
                    {/* Deck name + card count */}
                    <div className="relative z-10 text-center flex-1 flex items-center justify-center flex-col gap-1">
                      <h3 className={`
                        font-black text-sm leading-tight
                        ${selectedDeck?.id === deck.id ? 'text-white' : 'text-gray-800'}
                      `}>
                        {deck.name}
                      </h3>
                      {(deck.prestige_stats?.total ?? 0) > 0 && (
                        <span className={`
                          text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums
                          ${selectedDeck?.id === deck.id
                            ? 'bg-white/20 text-white'
                            : 'bg-gray-200 text-gray-500'}
                        `}>
                          {deck.prestige_stats!.total} cards
                        </span>
                      )}
                    </div>

                    {/* Prestige Pull Rate Bars */}
                    <div className="relative z-10 mt-auto w-full space-y-1 pb-1">
                      {(['star', 'galaxy', 'cosmos', 'rarion'] as const).map((tier) => {
                        const stats = deck.prestige_stats
                        const count = stats?.[tier] ?? 0
                        const total = stats?.total ?? 0
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0
                        const isActive = selectedDeck?.id === deck.id
                        const barBg = isActive ? 'bg-white/20' : 'bg-black/10'
                        const fillColors: Record<string, string> = {
                          star: isActive ? 'bg-white' : 'bg-gray-400',
                          galaxy: isActive ? 'bg-blue-300' : 'bg-blue-500',
                          cosmos: isActive ? 'bg-purple-300' : 'bg-purple-500',
                          rarion: isActive ? 'bg-orange-300' : 'bg-orange-500',
                        }
                        return (
                          <div key={tier} className="flex items-center gap-1">
                            <div className={`flex-1 h-1.5 rounded-full ${barBg} overflow-hidden`}>
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${fillColors[tier]}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className={`text-[9px] font-bold w-6 text-right leading-none tabular-nums ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                              {pct}%
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Bottom badge */}
                    <div className={`
                      relative z-10 pt-1 text-xs font-bold
                      ${selectedDeck?.id === deck.id ? 'text-emerald-100' : 'text-gray-500'}
                    `}>
                      {selectedDeck?.id === deck.id ? 'ACTIVE' : 'SELECT'}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Create New Deck Card */}
              <div
                onClick={() => setDeckModal({ mode: 'create', name: '', background_image: 'PAKMAKDECK' })}
                className="group relative cursor-pointer"
              >
                {/* Main card */}
                <div
                  className="
                    relative aspect-[3/4] rounded-2xl border-4 border-dashed transition-all
                    flex flex-col items-center justify-center p-4
                    bg-gradient-to-br from-gray-50 via-white to-gray-50 border-gray-300 text-gray-400
                    hover:border-emerald-400 hover:text-emerald-500 hover:shadow-xl hover:-translate-y-1
                    hover:bg-gradient-to-br hover:from-emerald-50 hover:via-white hover:to-emerald-50
                  "
                >
                  <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-emerald-100 flex items-center justify-center mb-3 transition-colors">
                    <FolderPlus className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-sm text-center">
                    New Deck
                  </h3>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search and Filters - Only show when deck is selected */}
      {selectedDeck && (
      <div className="space-y-3 animate-slide-down" style={{ animationDelay: '225ms' }}>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search your collection..."
              className="
                w-full h-12 pl-11 pr-4
                bg-white border-2 border-gray-100 rounded-xl
                text-sm font-medium placeholder:text-gray-400
                focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
                transition-all shadow-sm
              "
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`
              flex items-center justify-center gap-2
              h-12 px-4 rounded-xl border-2
              text-sm font-bold
              transition-all active:scale-[0.98]
              ${showFilters || conditionFilter || prestigeFilter || minPrice || maxPrice
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 border-emerald-500 text-white'
                : 'bg-white border-gray-100 text-gray-700 hover:border-gray-200'
              }
            `}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>

          <button className="
            flex items-center justify-center
            h-12 px-4 rounded-xl border-2 border-gray-100
            bg-white text-gray-600 hover:bg-gray-50
            font-bold
            transition-all active:scale-[0.98]
          ">
            <Download className="w-5 h-5" />
          </button>

          {/* Manual add button */}
          <button
            onClick={() => {
              setManualAddForm({ name: '', set_name: '', card_number: '', condition: 'near_mint', quantity: '1', purchase_price: '', current_price: '', notes: '' })
              setManualAddImage(null)
              setManualAddModal({ deckId: selectedDeck.id, deckName: selectedDeck.name })
            }}
            className="flex items-center justify-center gap-2 h-12 px-4 rounded-xl border-2 border-gray-100 bg-white text-gray-600 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-600 font-bold transition-all active:scale-[0.98]"
            title="Add Card Manually"
          >
            <Plus className="w-5 h-5" />
          </button>

          {failedCards && failedCards.deckId === selectedDeck.id && (
            <div className="relative flex items-center justify-center h-12 px-4 rounded-xl border-2 border-orange-300 bg-orange-50 text-orange-600 font-bold">
              <AlertTriangle className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-orange-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1">
                {failedCards.cards.length}
              </span>
            </div>
          )}
        </div>

        {/* Failed imports banner — stays until all cards are manually added */}
        {failedCards && failedCards.deckId === selectedDeck.id && (
          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
            <p className="text-orange-700 font-bold text-sm mb-2">
              ⚠ {failedCards.cards.length} card{failedCards.cards.length !== 1 ? 's' : ''} not found in the database — add them manually:
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {failedCards.cards.map((card, i) => {
                // Format: "Card Name (number) - Set Name"
                const nameMatch = card.match(/^(.+?)\s*\(([^)]+)\)\s*-\s*(.+)$/)
                const namePart    = nameMatch ? nameMatch[1].trim() : card.split(' (')[0]
                const numberPart  = nameMatch ? nameMatch[2].trim() : ''
                const setPart     = nameMatch ? nameMatch[3].trim() : ''
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-orange-600 text-xs font-mono truncate flex-1">{card}</span>
                    <button
                      onClick={() => {
                        setManualAddForm({ name: namePart, set_name: setPart, card_number: numberPart, condition: 'near_mint', quantity: '1', purchase_price: '', current_price: '', notes: '' })
                        setManualAddImage(null)
                        setManualAddModal({ deckId: selectedDeck.id, deckName: selectedDeck.name, prefill: card })
                      }}
                      className="flex-shrink-0 px-4 py-1.5 text-sm font-bold bg-orange-500 text-white rounded-lg hover:bg-orange-600 active:scale-95 transition-all"
                    >
                      Add
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Filters Panel */}
        <div className={`
          overflow-hidden transition-all duration-300 ease-in-out
          ${showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
        `}>
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-100 p-4 space-y-4">
            {/* Condition pills */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Condition</label>
              <div className="flex flex-wrap gap-2">
                {[['', 'All'], ['near_mint', 'Near Mint'], ['lightly_played', 'Lightly Played'], ['moderately_played', 'Mod. Played'], ['heavily_played', 'Heavily Played'], ['damaged', 'Damaged']].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => { setConditionFilter(val); setPage(1) }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border-2 transition-all ${
                      conditionFilter === val
                        ? val === '' ? 'bg-gray-800 text-white border-gray-800' : `${conditionColors[val] || 'bg-gray-500 text-white'} border-transparent`
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {/* Prestige pills */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Prestige</label>
              <div className="flex flex-wrap gap-2">
                {[['', 'All'], ['star', 'Star'], ['galaxy', 'Galaxy'], ['cosmos', 'Cosmos'], ['rarion', 'Rarion']].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => { setPrestigeFilter(val); setPage(1) }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border-2 transition-all ${
                      prestigeFilter === val
                        ? val === '' ? 'bg-gray-800 text-white border-gray-800' : `${prestigeColors[val] || 'bg-gray-500 text-white'} border-transparent`
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {/* Price range */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Price Range</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">$</span>
                  <input
                    type="number"
                    placeholder="Min"
                    min="0"
                    value={minPrice}
                    onChange={(e) => { setMinPrice(e.target.value); setPage(1) }}
                    className="w-full h-9 pl-7 pr-3 bg-white border-2 border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <span className="text-gray-400 font-bold text-sm">—</span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">$</span>
                  <input
                    type="number"
                    placeholder="Max"
                    min="0"
                    value={maxPrice}
                    onChange={(e) => { setMaxPrice(e.target.value); setPage(1) }}
                    className="w-full h-9 pl-7 pr-3 bg-white border-2 border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                {(minPrice || maxPrice) && (
                  <button
                    onClick={() => { setMinPrice(''); setMaxPrice(''); setPage(1) }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Inventory List - Only show when deck is selected */}
      {selectedDeck && (
      <div className="animate-slide-down" style={{ animationDelay: '300ms' }}>
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border-2 border-gray-100 p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-16 h-22 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-gray-200 rounded-full w-3/4" />
                  <div className="h-4 bg-gray-200 rounded-full w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : inventory.length === 0 ? (
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-100 p-10 sm:p-16 text-center">
          <div className="absolute top-4 right-4 opacity-20">
            <Sparkles className="w-12 h-12 text-gray-400" />
          </div>
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg">
            <Package className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Start Your Collection!</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Your inventory is empty. Browse the card database and add cards to start tracking your collection.
          </p>
          <Link 
            to="/cards"
            className="
              inline-flex items-center gap-2 px-6 py-3
              bg-gradient-to-r from-emerald-500 to-emerald-600 
              text-white font-bold rounded-xl 
              hover:from-emerald-600 hover:to-emerald-700 
              transition-all shadow-lg hover:shadow-xl
            "
          >
            <Plus className="w-5 h-5" />
            Browse Cards
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Mobile: Card Layout */}
          <div className="sm:hidden space-y-3">
            {inventory.map((item) => (
              <div
                key={item.id}
                className={`
                  bg-white rounded-2xl border-2 border-gray-100
                  p-4 hover:shadow-lg hover:border-gray-200
                  transition-all duration-200 group
                  ${item.sold_at ? 'opacity-50' : ''}
                `}
              >
                <div className="flex gap-4">
                  {/* Card Image */}
                  <div className="w-16 h-22 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                    <Package className="w-6 h-6 text-gray-400" />
                    {item.sold_at && (
                      <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                        <span className="text-red-600 font-black text-xs transform -rotate-12">SOLD</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-gray-900 truncate ${item.sold_at ? 'line-through' : ''}`}>
                      {item.card_detail?.name || 'Unknown Card'}
                    </h3>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {item.card_detail?.set_name || 'Unknown Set'}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`
                        px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm
                        ${conditionColors[item.condition] || 'bg-gray-400 text-white'}
                      `}>
                        {conditionLabels[item.condition] || item.condition}
                      </span>
                      <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                        ×{item.quantity}
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex flex-col items-end justify-between">
                    <span className="font-black text-emerald-600 text-lg">
                      ${parseFloat(item.current_price as any || 0).toFixed(2)}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditItem(item)
                          setEditForm({
                            condition: item.condition,
                            quantity: String(item.quantity),
                            purchase_price: item.purchase_price ?? '',
                            current_price: item.current_price ?? '',
                            notes: item.notes ?? '',
                            prestige: item.prestige,
                            location: item.location ?? '',
                          })
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table Layout */}
          <div className="hidden sm:block bg-white rounded-2xl border-2 border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-100" style={{ background: 'linear-gradient(180deg, #f9fafb 0%, #f3f4f6 100%)' }}>
                  {([
                    { label: 'Card', field: 'card__name', align: 'left' },
                    { label: 'Set', field: '', align: 'left' },
                    { label: 'Condition', field: 'condition', align: 'center' },
                    { label: 'Prestige', field: 'prestige', align: 'center', extra: (
                      <button
                        onClick={handleAutoAssignPrestige}
                        disabled={assigningPrestige}
                        title="Auto-assign prestige based on price"
                        className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {assigningPrestige ? '...' : 'AUTO'}
                      </button>
                    )},
                    { label: 'Qty', field: 'quantity', align: 'center' },
                    { label: 'Price', field: 'current_price', align: 'right' },
                    { label: 'Actions', field: '', align: 'right' },
                  ] as { label: string; field: string; align: string; extra?: React.ReactNode }[]).map(({ label, field, align, extra }) => {
                    const isActive = ordering === field || ordering === `-${field}`
                    const isDesc = ordering === `-${field}`
                    const handleSort = () => {
                      if (!field) return
                      if (ordering === field) setOrdering(`-${field}`)
                      else if (ordering === `-${field}`) setOrdering('')
                      else setOrdering(field)
                      setPage(1)
                    }
                    return (
                      <th
                        key={label}
                        onClick={field ? handleSort : undefined}
                        className={`
                          text-xs font-bold text-gray-600 uppercase tracking-wider px-5 py-4
                          text-${align}
                          ${field ? 'cursor-pointer select-none hover:bg-gray-100 transition-colors' : ''}
                          ${isActive ? 'text-emerald-600' : ''}
                        `}
                      >
                        <div className={`flex items-center gap-1 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'}`}>
                          {label}
                          {extra}
                          {field && (
                            isActive
                              ? (isDesc ? <ArrowDown className="w-3.5 h-3.5 text-emerald-500" /> : <ArrowUp className="w-3.5 h-3.5 text-emerald-500" />)
                              : <ArrowUpDown className="w-3.5 h-3.5 text-gray-300" />
                          )}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inventory.map((item) => (
                  <tr key={item.id} className={`hover:bg-gray-50/80 transition-colors group ${item.sold_at ? 'opacity-50 bg-gray-50' : ''}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center overflow-hidden relative">
                          {item.card_detail?.image ? (
                            <img 
                              src={item.card_detail.image} 
                              alt={item.card_detail.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-gray-400" />
                          )}
                          {item.sold_at && (
                            <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
                              <span className="text-red-600 font-black text-[8px] transform -rotate-12 bg-white/80 px-1 rounded">SOLD</span>
                            </div>
                          )}
                        </div>
                        <span className={`font-bold text-gray-900 truncate max-w-[200px] ${item.sold_at ? 'line-through text-gray-500' : ''}`}>
                          {item.card_detail?.name || 'Unknown Card'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 font-medium">
                      {item.card_detail?.set_name || 'Unknown'}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`
                        inline-flex px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm
                        ${conditionColors[item.condition] || 'bg-gray-400 text-white'}
                      `}>
                        {conditionLabels[item.condition] || item.condition}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <select
                        value={item.prestige}
                        onChange={async (e) => {
                          try {
                            await apiClient.patch(`/inventory/${item.id}/`, { prestige: e.target.value })
                            // Refresh inventory
                            const params = new URLSearchParams()
                            if (searchTerm) params.append('search', searchTerm)
                            if (conditionFilter) params.append('condition', conditionFilter)
                            if (selectedDeck) params.append('deck', selectedDeck.id.toString())
                            params.append('page', page.toString())
                            params.append('page_size', '20')
                            const response = await apiClient.get(`/inventory/?${params.toString()}`)
                            setInventory(response.data.results || [])
                          } catch (error) {
                            console.error('Error updating prestige:', error)
                          }
                        }}
                        className={`
                          px-3 py-1.5 rounded-lg text-xs font-bold border-2
                          focus:outline-none focus:ring-2 focus:ring-offset-2
                          transition-all cursor-pointer shadow-sm
                          ${prestigeColors[item.prestige] || 'bg-gray-100 text-gray-700 border-gray-200'}
                        `}
                      >
                        <option value="star">Star</option>
                        <option value="galaxy">Galaxy</option>
                        <option value="cosmos">Cosmos</option>
                        <option value="rarion">Rarion</option>
                      </select>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="font-bold text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg">
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-xl font-black text-emerald-600">
                        ${parseFloat(item.current_price as any || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditItem(item)
                            setEditForm({
                              condition: item.condition,
                              quantity: String(item.quantity),
                              purchase_price: item.purchase_price ?? '',
                              current_price: item.current_price ?? '',
                              notes: item.notes ?? '',
                              prestige: item.prestige,
                              location: item.location ?? '',
                            })
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setConfirmModal({
                              message: 'Are you sure you want to remove this card from the deck?',
                              onConfirm: async () => {
                                try {
                                  await apiClient.delete(`/inventory/${item.id}/`)
                                  // Refresh inventory
                                  const params = new URLSearchParams()
                                  if (searchTerm) params.append('search', searchTerm)
                                  if (conditionFilter) params.append('condition', conditionFilter)
                                  if (selectedDeck) params.append('deck', selectedDeck.id.toString())
                                  params.append('page', page.toString())
                                  params.append('page_size', '20')
                                  const response = await apiClient.get(`/inventory/?${params.toString()}`)
                                  setInventory(response.data.results || [])
                                  setTotalCount(response.data.count || 0)
                                  setToast({ message: 'Card removed from deck', type: 'success' })
                                } catch (error) {
                                  console.error('Error deleting inventory item:', error)
                                  setToast({ message: 'Failed to remove card from deck', type: 'error' })
                                }
                              }
                            })
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>
      )}

      {/* Pagination - Only show when deck is selected */}
      {selectedDeck && totalPages > 1 && (
        <div className="flex justify-between items-center bg-gradient-to-r from-gray-50 to-white rounded-2xl border-2 border-gray-100 p-4 animate-slide-down" style={{ animationDelay: '300ms' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="
              flex items-center gap-2 px-4 py-2.5
              bg-white hover:bg-gray-50 
              text-gray-700 text-sm font-bold
              rounded-xl border-2 border-gray-100
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all
            "
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-gray-900">{page}</span>
            <span className="text-sm text-gray-400">of</span>
            <span className="text-sm font-bold text-gray-600">{totalPages}</span>
          </div>
          
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="
              flex items-center gap-2 px-4 py-2.5
              bg-gradient-to-r from-emerald-500 to-emerald-600 
              hover:from-emerald-600 hover:to-emerald-700
              text-white text-sm font-bold
              rounded-xl
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all shadow-md
            "
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirm modal */}
      {confirmModal && (
        <ConfirmModal
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {/* Deck Create/Rename Modal */}
      {deckModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                deckModal.mode === 'create' 
                  ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' 
                  : 'bg-gradient-to-br from-yellow-400 to-orange-500'
              }`}>
                {deckModal.mode === 'create' 
                  ? <FolderPlus className="w-6 h-6 text-white" />
                  : <Edit2 className="w-6 h-6 text-white" />
                }
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">
                  {deckModal.mode === 'create' ? 'Create New Deck' : 'Rename Deck'}
                </h3>
                <p className="text-sm text-gray-500">
                  {deckModal.mode === 'create' 
                    ? 'Give your deck a memorable name'
                    : `Editing "${deckModal.deck?.name}"`
                  }
                </p>
              </div>
            </div>

            {/* Input */}
            <input
              type="text"
              value={deckModal.name}
              onChange={(e) => setDeckModal({ ...deckModal, name: e.target.value })}
              placeholder="Enter deck name..."
              className="
                w-full h-14 px-4
                bg-gray-50 border-2 border-gray-200 rounded-xl
                text-lg font-medium placeholder:text-gray-400
                focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
                transition-all
              "
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  deckModal.mode === 'create' ? handleCreateDeck() : handleRenameDeck()
                }
                if (e.key === 'Escape') {
                  setDeckModal(null)
                }
              }}
            />

            {/* Background image picker — only shown when creating */}
            {deckModal.mode === 'create' && (
              <div className="mt-5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Deck Background</p>
                <div className="grid grid-cols-2 gap-3">
                  {(['PAKMAKDECK', 'DANNYDECK'] as const).map(img => (
                    <button
                      key={img}
                      type="button"
                      onClick={() => setDeckModal({ ...deckModal, background_image: img })}
                      className={`relative rounded-xl overflow-hidden border-4 transition-all ${
                        deckModal.background_image === img
                          ? 'border-emerald-500 scale-[1.03] shadow-lg shadow-emerald-200'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <img
                        src={`${import.meta.env.BASE_URL}images/${img}.PNG`}
                        alt={img}
                        className="w-full aspect-[3/4] object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2">
                        <span className="text-white text-xs font-black">
                          {img === 'PAKMAKDECK' ? 'Pakmak' : 'Danny'}
                        </span>
                      </div>
                      {deckModal.background_image === img && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-[10px] font-black">✓</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeckModal(null)}
                className="
                  flex-1 h-12 px-4
                  bg-gray-100 hover:bg-gray-200
                  text-gray-700 font-bold rounded-xl
                  transition-all
                "
              >
                Cancel
              </button>
              <button
                onClick={deckModal.mode === 'create' ? handleCreateDeck : handleRenameDeck}
                disabled={!deckModal.name.trim()}
                className="
                  flex-1 h-12 px-4
                  bg-gradient-to-r from-emerald-500 to-emerald-600 
                  hover:from-emerald-600 hover:to-emerald-700
                  text-white font-bold rounded-xl
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all shadow-lg
                "
              >
                {deckModal.mode === 'create' ? 'Create Deck' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {scannerOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center animate-fade-in">
          {/* Close button */}
          <button
            onClick={closeScanner}
            className="absolute top-6 right-6 z-10 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Header */}
          <div className="absolute top-6 left-6 z-10">
            <h2 className="text-2xl font-black text-white mb-1">
              <QrCode className="w-6 h-6 inline-block mr-2" />
              Scan to Sell
            </h2>
            <p className="text-sm text-gray-400">
              {scannerDeck?.name} • Point camera at QR code
            </p>
          </div>

          {/* Scanner container */}
          <div className="w-full max-w-md px-4">
            <div 
              id="qr-reader" 
              className="rounded-2xl overflow-hidden bg-gray-900"
              style={{ width: '100%' }}
            ></div>
          </div>

          {/* Last sold card / Undo */}
          {lastSoldCard && (
            <div className="mt-6 flex items-center gap-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl px-6 py-4">
              <div className="text-emerald-400">
                <span className="text-sm">Last sold:</span>
                <div className="font-bold text-lg">{lastSoldCard.name}</div>
              </div>
              <button
                onClick={handleUndoSale}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
              >
                <Undo2 className="w-4 h-4" />
                Undo
              </button>
            </div>
          )}

          {/* Instructions */}
          <div className="absolute bottom-6 text-center text-gray-500 text-sm">
            Cards are marked as sold instantly • Press ESC to close
          </div>
        </div>
      )}

      {/* Import Loading Modal */}
      {importModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center animate-fade-in">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 max-w-md w-full mx-4 border-2 border-emerald-500/30 shadow-2xl shadow-emerald-500/20">
            {/* Pokeball animation */}
            <div className="flex justify-center mb-6">
              <div className="relative w-24 h-24">
                {/* Outer ring */}
                <div className={`absolute inset-0 rounded-full border-4 border-red-500 ${!importResult ? 'animate-spin' : ''}`} 
                     style={{ animationDuration: '2s', borderTopColor: 'white', borderLeftColor: 'white' }}>
                </div>
                {/* Inner pokeball */}
                <div className="absolute inset-2 rounded-full bg-gradient-to-b from-red-500 via-red-500 to-white overflow-hidden">
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-800 -translate-y-1/2"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-4 border-gray-800 z-10">
                    <div className={`absolute inset-1 rounded-full ${importResult ? 'bg-emerald-400 animate-pulse' : 'bg-gray-300'}`}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-black text-white text-center mb-2">
              {(importResult as any)?._timed_out
                ? 'Import Timed Out'
                : importResult
                  ? 'Import Complete!'
                  : 'Importing Cards...'}
            </h3>
            
            {/* Deck name */}
            <p className="text-emerald-400 text-center font-bold mb-4">
              {importModal.deckName}
            </p>

            {importResult ? (
              (importResult as any)._timed_out ? (
                /* Timeout state */
                <div className="space-y-3">
                  <div className="bg-yellow-500/20 rounded-xl p-4 border border-yellow-500/30 text-center">
                    <p className="text-yellow-300 font-bold mb-2">The server took too long to respond.</p>
                    <p className="text-yellow-200/80 text-sm">Your CSV may still be processing on the server. Wait a minute then refresh the page to see if cards were imported.</p>
                  </div>
                  <p className="text-center text-gray-400 text-sm animate-pulse">Closing automatically...</p>
                </div>
              ) : (
                /* Normal results */
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-emerald-500/20 rounded-xl p-3 border border-emerald-500/30">
                    <span className="text-emerald-300">Cards Imported</span>
                    <span className="text-2xl font-black text-emerald-400">{importResult.imported}</span>
                  </div>
                  <div className="flex items-center justify-between bg-blue-500/20 rounded-xl p-3 border border-blue-500/30">
                    <span className="text-blue-300">Cards Updated</span>
                    <span className="text-2xl font-black text-blue-400">{importResult.updated}</span>
                  </div>
                  {importResult.not_found > 0 && (
                    <div className="flex items-center justify-between bg-orange-500/20 rounded-xl p-3 border border-orange-500/30">
                      <span className="text-orange-300">Not Found</span>
                      <span className="text-2xl font-black text-orange-400">{importResult.not_found}</span>
                    </div>
                  )}
                  {importResult.not_found_cards && importResult.not_found_cards.length > 0 && (
                    <div className="bg-orange-500/10 rounded-xl p-3 border border-orange-500/20 max-h-32 overflow-y-auto">
                      <p className="text-orange-300 text-xs font-bold mb-1 uppercase tracking-wide">Unmatched cards:</p>
                      {importResult.not_found_cards.map((c: string, i: number) => (
                        <p key={i} className="text-orange-200/70 text-[10px] font-mono truncate">{c}</p>
                      ))}
                    </div>
                  )}
                  {(importResult.errors ?? 0) > 0 && (
                    <div className="bg-red-500/20 rounded-xl p-3 border border-red-500/30">
                      <p className="text-red-300 text-xs font-bold mb-1 uppercase tracking-wide">Errors: {importResult.errors}</p>
                      {importResult.error_details && importResult.error_details.map((e: string, i: number) => (
                        <p key={i} className="text-red-200/70 text-[10px] font-mono truncate">{e}</p>
                      ))}
                    </div>
                  )}
                  <p className="text-center text-gray-400 text-sm mt-4 animate-pulse">
                    Closing automatically...
                  </p>
                </div>
              )
            ) : (
              /* Loading message */
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 text-xl text-gray-300 mb-4">
                  <span className="font-bold">{importMessages[importModal.phase]}</span>
                </div>
                
                {/* Progress bar */}
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-400 via-yellow-400 to-emerald-400 rounded-full animate-pulse"
                    style={{ 
                      width: '100%',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.5s ease-in-out infinite'
                    }}
                  ></div>
                </div>
                
                {/* Animated loading dots */}
                <div className="flex justify-center gap-3 mt-6">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '450ms' }}></div>
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Add Card Modal */}
      {/* Edit Card Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-black text-gray-900">Edit Card</h3>
                <p className="text-sm text-gray-500 mt-0.5 truncate max-w-[260px]">
                  {editItem.card_detail?.name || 'Unknown Card'} — {editItem.card_detail?.set_name || ''}
                </p>
              </div>
              <button onClick={() => setEditItem(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Fields */}
            <div className="px-6 py-4 space-y-4 max-h-[65vh] overflow-y-auto">
              {/* Condition */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Condition</label>
                <select
                  value={editForm.condition}
                  onChange={e => setEditForm(f => ({ ...f, condition: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 focus:border-blue-400 focus:outline-none text-sm font-medium"
                >
                  <option value="near_mint">Near Mint</option>
                  <option value="lightly_played">Lightly Played</option>
                  <option value="moderately_played">Moderately Played</option>
                  <option value="heavily_played">Heavily Played</option>
                  <option value="damaged">Damaged</option>
                </select>
              </div>

              {/* Prestige */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Prestige</label>
                <select
                  value={editForm.prestige}
                  onChange={e => setEditForm(f => ({ ...f, prestige: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 focus:border-blue-400 focus:outline-none text-sm font-medium"
                >
                  <option value="star">Star</option>
                  <option value="galaxy">Galaxy</option>
                  <option value="cosmos">Cosmos</option>
                  <option value="rarion">Rarion</option>
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.quantity}
                  onChange={e => setEditForm(f => ({ ...f, quantity: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 focus:border-blue-400 focus:outline-none text-sm font-medium"
                />
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Purchase Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={editForm.purchase_price}
                    onChange={e => setEditForm(f => ({ ...f, purchase_price: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 focus:border-blue-400 focus:outline-none text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Current Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={editForm.current_price}
                    onChange={e => setEditForm(f => ({ ...f, current_price: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 focus:border-blue-400 focus:outline-none text-sm font-medium"
                  />
                </div>
              </div>

              {/* Location / Portfolio */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Location / Portfolio</label>
                <input
                  type="text"
                  placeholder="e.g. Main, Batch 1"
                  value={editForm.location}
                  onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 focus:border-blue-400 focus:outline-none text-sm font-medium"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Notes</label>
                <textarea
                  rows={3}
                  placeholder="Any notes about this card…"
                  value={editForm.notes}
                  onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-400 focus:outline-none text-sm font-medium resize-none"
                />
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setEditItem(null)}
                className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={editLoading}
                onClick={async () => {
                  setEditLoading(true)
                  try {
                    await apiClient.patch(`/inventory/${editItem.id}/`, {
                      condition: editForm.condition,
                      prestige: editForm.prestige,
                      quantity: parseInt(editForm.quantity) || 0,
                      purchase_price: editForm.purchase_price || null,
                      current_price: editForm.current_price || null,
                      notes: editForm.notes,
                      location: editForm.location,
                    })
                    setInventory(prev => prev.map(i =>
                      i.id === editItem.id
                        ? { ...i, condition: editForm.condition as InventoryItem['condition'], prestige: editForm.prestige, quantity: parseInt(editForm.quantity) || 0, purchase_price: editForm.purchase_price || null, current_price: editForm.current_price || null, notes: editForm.notes, location: editForm.location }
                        : i
                    ))
                    setEditItem(null)
                    setToast({ message: 'Card updated', type: 'success' })
                  } catch (err) {
                    console.error('Error updating card:', err)
                    setToast({ message: 'Failed to update card', type: 'error' })
                  } finally {
                    setEditLoading(false)
                  }
                }}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {editLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {manualAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-xl font-black text-gray-900">Add Card Manually</h3>
                <p className="text-sm text-gray-500 mt-0.5">{manualAddModal.deckName}</p>
              </div>
              <button
                onClick={() => setManualAddModal(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Card Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Card Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={manualAddForm.name}
                  onChange={e => setManualAddForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Charizard"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              {/* Set & Card Number */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Set Name</label>
                  <input
                    type="text"
                    value={manualAddForm.set_name}
                    onChange={e => setManualAddForm(f => ({ ...f, set_name: e.target.value }))}
                    placeholder="e.g. Base Set"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Card Number</label>
                  <input
                    type="text"
                    value={manualAddForm.card_number}
                    onChange={e => setManualAddForm(f => ({ ...f, card_number: e.target.value }))}
                    placeholder="e.g. 4/102"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              {/* Condition & Quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Condition</label>
                  <select
                    value={manualAddForm.condition}
                    onChange={e => setManualAddForm(f => ({ ...f, condition: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="near_mint">Near Mint</option>
                    <option value="lightly_played">Lightly Played</option>
                    <option value="moderately_played">Moderately Played</option>
                    <option value="heavily_played">Heavily Played</option>
                    <option value="damaged">Damaged</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={manualAddForm.quantity}
                    onChange={e => setManualAddForm(f => ({ ...f, quantity: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Purchase Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={manualAddForm.purchase_price}
                    onChange={e => setManualAddForm(f => ({ ...f, purchase_price: e.target.value }))}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Current Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={manualAddForm.current_price}
                    onChange={e => setManualAddForm(f => ({ ...f, current_price: e.target.value }))}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
                <textarea
                  value={manualAddForm.notes}
                  onChange={e => setManualAddForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Optional notes..."
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Card Image (optional)</label>
                <label className="flex items-center gap-3 cursor-pointer border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 hover:border-orange-400 transition-colors group">
                  <Upload className="w-5 h-5 text-gray-400 group-hover:text-orange-400 flex-shrink-0" />
                  <span className="text-sm text-gray-500 group-hover:text-orange-500 truncate">
                    {manualAddImage ? manualAddImage.name : 'Click to upload image'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => setManualAddImage(e.target.files?.[0] ?? null)}
                  />
                </label>
                {manualAddImage && (
                  <button
                    onClick={() => setManualAddImage(null)}
                    className="mt-1 text-xs text-red-500 hover:underline"
                  >
                    Remove image
                  </button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setManualAddModal(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleManualAdd}
                disabled={!manualAddForm.name.trim() || manualAddLoading}
                className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {manualAddLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add to Deck
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Carousel Modal */}
      {carouselDeck && carouselCards.length > 0 && (
        <div className="fixed inset-0 z-[60] bg-black/95 animate-fade-in overflow-hidden">
          <button
            onClick={() => { setCarouselDeck(null); setCarouselCards([]); setCarouselIndex(0) }}
            className="absolute top-6 right-6 z-10 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all shadow-2xl"
          >
            <X className="w-6 h-6" />
          </button>
          {(() => {
            const renderRow = (rowCards: typeof carouselCards, cardWidth = 180, extraPaddingTop = 0) => {
              if (rowCards.length === 0) return null
              const doubled = [...rowCards, ...rowCards]
              const slotWidth = cardWidth + 12
              return (
                <div className="flex-1 overflow-hidden flex items-center" style={{ paddingTop: extraPaddingTop }}>
                  <div
                    className="flex gap-3 px-4"
                    style={{
                      animation: `scroll-left ${rowCards.length * 3}s linear infinite`,
                      width: `${doubled.length * slotWidth}px`,
                    }}
                  >
                    {doubled.map((item, idx) => {
                      const isFaded = fadedCards.has(item.id)
                      const isSold  = !!item.sold_at
                      return (
                        <div key={`${item.id}-${idx}`} className="flex-shrink-0" style={{ width: `${cardWidth}px`, perspective: '1000px' }}>
                          <div className="relative w-full aspect-[2.5/3.5]">
                            <div className={`absolute inset-0 rounded-2xl overflow-hidden shadow-2xl ${isFaded ? 'opacity-30' : isSold ? 'opacity-40 grayscale' : 'opacity-100'}`}>
                              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                                {item.card_detail?.image ? (
                                  <img src={item.card_detail.image} alt={item.card_detail?.name || 'Card'} className="w-full h-full object-contain" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-20 h-20 text-gray-400" />
                                  </div>
                                )}
                              </div>
                            </div>
                            {isSold && (
                              <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                                <div className="bg-red-600/85 text-white font-black text-xl px-5 py-2 rounded-xl shadow-lg tracking-widest" style={{ transform: 'rotate(-18deg)' }}>
                                  PULLED
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            }
            const topRow    = carouselCards.filter(c => c.prestige === 'rarion' || c.prestige === 'cosmos')
            const bottomRow = carouselCards.filter(c => c.prestige !== 'rarion' && c.prestige !== 'cosmos')
            return (
              <div className="fixed inset-0 bg-black pt-10 pb-8 flex flex-col gap-4">
                {renderRow(topRow, 220, 32)}
                {renderRow(bottomRow, 160)}
              </div>
            )
          })()}
          {carouselNotification && (
            <PullNotification item={carouselNotification} onDone={() => setCarouselNotification(null)} />
          )}
        </div>
      )}
    </div>
  )
}

export default InventoryPage

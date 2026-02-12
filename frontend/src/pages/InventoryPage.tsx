/**
 * Inventory Page
 * 
 * Pokemon-themed inventory management with:
 * - Gradient stat cards
 * - Animated card list
 * - Condition badges with Pokemon colors
 */

import { useState, useEffect, useRef } from 'react'
import { 
  Package, 
  Plus, 
  Search, 
  SlidersHorizontal,
  Download, 
  TrendingUp,
  AlertTriangle,
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
  Undo2
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import apiClient, { API_BASE_URL } from '../services/api'
import type { InventoryItem, Deck } from '../types'
import { Toast, ConfirmModal, type ToastType } from '../components/common'

function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [decks, setDecks] = useState<Deck[]>([])
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [conditionFilter, setConditionFilter] = useState<string>('')
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
  const [uploadingDeckId, setUploadingDeckId] = useState<number | null>(null)
  const [importModal, setImportModal] = useState<{ deckName: string; phase: number } | null>(null)
  const [importResult, setImportResult] = useState<{ imported: number; updated: number; not_found: number } | null>(null)
  const [deckModal, setDeckModal] = useState<{ mode: 'create' | 'rename'; deck?: Deck; name: string } | null>(null)
  const [deckStats, setDeckStats] = useState<{ total_items: number; total_quantity: number; total_value: number; low_stock: number } | null>(null)
  
  // Scanner state
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scannerDeck, setScannerDeck] = useState<Deck | null>(null)
  const [lastSoldCard, setLastSoldCard] = useState<{ name: string; auction_code: string } | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)


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
        const response = await apiClient.get('/decks/')
        const fetchedDecks = response.data.results || response.data
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

    const fetchInventory = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (searchTerm) params.append('search', searchTerm)
        if (conditionFilter) params.append('condition', conditionFilter)
        params.append('deck', selectedDeck.id.toString())
        params.append('page', page.toString())
        params.append('page_size', ITEMS_PER_PAGE.toString())

        const response = await apiClient.get(`/inventory/?${params.toString()}`)
        setInventory(response.data.results || [])
        setTotalCount(response.data.count || 0)
      } catch (error) {
        console.error('Error fetching inventory:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInventory()
  }, [searchTerm, conditionFilter, page, selectedDeck])

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
      })
      
      const result = response.data
      clearInterval(messageInterval)
      setImportResult(result)
      
      // Refresh the inventory and stats if this is the selected deck
      if (selectedDeck?.id === deckId) {
        setPage(1) // This will trigger a refetch
        // Also refresh stats
        const statsResponse = await apiClient.get(`/inventory/stats/?deck=${deckId}`)
        setDeckStats(statsResponse.data)
      }
      
      // Auto-close after showing results
      setTimeout(() => {
        setImportModal(null)
        setImportResult(null)
        setUploadingDeckId(null)
      }, 3000)
    } catch (error: any) {
      clearInterval(messageInterval)
      console.error('Error uploading CSV:', error)
      setImportModal(null)
      setUploadingDeckId(null)
      setToast({ 
        message: error.response?.data?.error || 'Failed to import CSV', 
        type: 'error' 
      })
    }
  }

  // Handle creating a new deck
  const handleCreateDeck = async () => {
    if (!deckModal?.name.trim()) return
    
    try {
      const response = await apiClient.post('/decks/', { name: deckModal.name.trim() })
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
      const response = await apiClient.patch(`/decks/${deckModal.deck.id}/`, { name: deckModal.name.trim() })
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
    
    // Refresh inventory if we're viewing this deck
    if (selectedDeck) {
      setPage(1)
      const statsResponse = await apiClient.get(`/inventory/stats/?deck=${selectedDeck.id}`)
      setDeckStats(statsResponse.data)
    }
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
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to mark as sold'
      setToast({ message: errorMsg, type: 'error' })
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
  const totalItems = deckStats?.total_items || totalCount
  const totalQuantity = deckStats?.total_quantity || 0
  const totalValue = deckStats?.total_value || 0
  const lowStockItems = deckStats?.low_stock || 0

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  const conditionLabels: Record<string, string> = {
    NM: 'Near Mint',
    LP: 'Lightly Played',
    MP: 'Mod. Played',
    HP: 'Heavily Played',
    DMG: 'Damaged'
  }

  const conditionColors: Record<string, string> = {
    NM: 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-white',
    LP: 'bg-gradient-to-r from-blue-400 to-blue-500 text-white',
    MP: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white',
    HP: 'bg-gradient-to-r from-orange-400 to-orange-500 text-white',
    DMG: 'bg-gradient-to-r from-red-400 to-red-500 text-white'
  }

  const prestigeColors: Record<string, string> = {
    common: 'bg-gradient-to-r from-gray-400 to-gray-500 text-black border-gray-400',
    uncommon: 'bg-gradient-to-r from-slate-100 to-white text-black border-gray-300',
    rare: 'bg-gradient-to-r from-blue-400 to-blue-500 text-black border-blue-400',
    epic: 'bg-gradient-to-r from-purple-400 to-purple-500 text-black border-purple-400',
    legendary: 'bg-gradient-to-r from-orange-400 to-orange-500 text-black border-orange-400'
  }

  return (
    <div className="space-y-6">
      {/* Page Header - Pokemon themed */}
      <div 
        className="relative overflow-hidden rounded-2xl p-5 sm:p-6 animate-slide-down"
        style={{
          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
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
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">Collection</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              My Inventory
            </h1>
            <p className="text-emerald-100 text-sm mt-1">
              {loading ? 'Loading...' : `${totalCount} cards in your collection`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link 
              to="/cards"
              className="
                flex items-center gap-2 px-4 py-2.5
                bg-white/20 backdrop-blur-sm hover:bg-white/30
                text-white text-sm font-bold
                rounded-xl border border-white/20
                transition-all active:scale-[0.98]
              "
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Cards</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Summary - Pokemon themed */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-down" style={{ animationDelay: '75ms' }}>
        <div className="relative overflow-hidden bg-white rounded-2xl border-2 border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute -right-4 -top-4 w-16 h-16 opacity-5">
            <Package className="w-full h-full" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase">Unique</span>
          </div>
          <p className="text-2xl font-black text-gray-900">{totalItems.toLocaleString()}</p>
        </div>
        
        <div className="relative overflow-hidden bg-white rounded-2xl border-2 border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">#</span>
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase">Total Qty</span>
          </div>
          <p className="text-2xl font-black text-gray-900">{totalQuantity.toLocaleString()}</p>
        </div>
        
        <div className="relative overflow-hidden bg-white rounded-2xl border-2 border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase">Value</span>
          </div>
          <p className="text-2xl font-black text-emerald-600">${totalValue.toFixed(2)}</p>
        </div>
        
        <div className="relative overflow-hidden bg-white rounded-2xl border-2 border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase">Low Stock</span>
          </div>
          <p className="text-2xl font-black text-amber-600">{lowStockItems}</p>
        </div>
      </div>

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
              onClick={() => setDeckModal({ mode: 'create', name: '' })}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Create Deck
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-5">
            <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Select Deck</h2>
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
                        ? 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 border-emerald-600 text-white shadow-2xl shadow-emerald-500/50 scale-105 -rotate-2' 
                        : 'bg-gradient-to-br from-white via-gray-50 to-gray-100 border-gray-300 text-gray-700 hover:border-emerald-400 hover:shadow-xl hover:-translate-y-1'
                      }
                    `}
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
                            const response = await apiClient.get(`/inventory/?deck=${deck.id}&page_size=1000`)
                            setCarouselCards(response.data.results || [])
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
                          setDeckModal({ mode: 'rename', deck, name: deck.name })
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
 
                    {/* Deck name */}
                    <div className="relative z-10 text-center flex-1 flex items-center">
                      <h3 className={`
                        font-black text-sm leading-tight
                        ${selectedDeck?.id === deck.id ? 'text-white' : 'text-gray-800'}
                      `}>
                        {deck.name}
                      </h3>
                    </div>

                    {/* Bottom badge */}
                    <div className={`
                      relative z-10 mt-auto pt-2 text-xs font-bold
                      ${selectedDeck?.id === deck.id ? 'text-emerald-100' : 'text-gray-500'}
                    `}>
                      {selectedDeck?.id === deck.id ? 'ACTIVE' : 'SELECT'}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Create New Deck Card */}
              <div
                onClick={() => setDeckModal({ mode: 'create', name: '' })}
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
              ${showFilters || conditionFilter
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
        </div>

        {/* Filters Panel */}
        <div className={`
          overflow-hidden transition-all duration-300 ease-in-out
          ${showFilters ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}
        `}>
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-100 p-4">
            <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Condition</label>
            <select
              className="
                w-full h-11 px-3 bg-white border-2 border-gray-100 rounded-xl
                text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
              "
              value={conditionFilter}
              onChange={(e) => {
                setConditionFilter(e.target.value)
                setPage(1)
              }}
            >
              <option value="">All Conditions</option>
              <option value="NM">Near Mint</option>
              <option value="LP">Lightly Played</option>
              <option value="MP">Moderately Played</option>
              <option value="HP">Heavily Played</option>
              <option value="DMG">Damaged</option>
            </select>
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
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
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
                  <th className="text-left text-xs font-bold text-gray-600 uppercase tracking-wider px-5 py-4">Card</th>
                  <th className="text-left text-xs font-bold text-gray-600 uppercase tracking-wider px-5 py-4">Set</th>
                  <th className="text-center text-xs font-bold text-gray-600 uppercase tracking-wider px-5 py-4">Condition</th>
                  <th className="text-center text-xs font-bold text-gray-600 uppercase tracking-wider px-5 py-4">Prestige</th>
                  <th className="text-center text-xs font-bold text-gray-600 uppercase tracking-wider px-5 py-4">Qty</th>
                  <th className="text-right text-xs font-bold text-gray-600 uppercase tracking-wider px-5 py-4">Price</th>
                  <th className="text-right text-xs font-bold text-gray-600 uppercase tracking-wider px-5 py-4">Actions</th>
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
                        <option value="common">Common</option>
                        <option value="uncommon">Uncommon</option>
                        <option value="rare">Rare</option>
                        <option value="epic">Epic</option>
                        <option value="legendary">Legendary</option>
                      </select>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="font-bold text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg">
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-black text-emerald-600">
                      ${parseFloat(item.current_price as any || 0).toFixed(2)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
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
              {importResult ? 'Import Complete!' : 'Importing Cards...'}
            </h3>
            
            {/* Deck name */}
            <p className="text-emerald-400 text-center font-bold mb-4">
              {importModal.deckName}
            </p>

            {importResult ? (
              /* Results */
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
                <p className="text-center text-gray-400 text-sm mt-4 animate-pulse">
                  Closing automatically...
                </p>
              </div>
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

      {/* Carousel Modal */}
      {carouselDeck && carouselCards.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 animate-fade-in overflow-hidden">
          {/* Close button */}
          <button
            onClick={() => {
              setCarouselDeck(null)
              setCarouselCards([])
              setCarouselIndex(0)
            }}
            className="absolute top-6 right-6 z-10 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all shadow-2xl"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Deck title */}
          <div className="absolute top-6 left-6 z-10">
            <h2 className="text-3xl font-black text-white mb-1">{carouselDeck.name}</h2>
            <p className="text-sm text-gray-400">
              {carouselCards.length} cards in this deck
            </p>
          </div>

          {/* Scrolling cards container */}
          <div className="h-full pt-24 pb-12 overflow-hidden">
            <div 
              className="flex gap-6 px-6 h-full items-center"
              style={{
                animation: `scroll-left ${carouselCards.length * 3}s linear infinite`,
                width: `${carouselCards.length * 2 * 320}px`
              }}
            >
              {/* Duplicate cards for seamless loop */}
              {[...carouselCards, ...carouselCards].map((item, idx) => {
                const isFaded = fadedCards.has(item.id)
                return (
                <div
                  key={`${item.id}-${idx}`}
                  className="flex-shrink-0"
                  style={{ 
                    width: '300px',
                    perspective: '1000px'
                  }}
                  onClick={() => {
                    setFadedCards(prev => {
                      const newSet = new Set(prev)
                      if (newSet.has(item.id)) {
                        newSet.delete(item.id)
                      } else {
                        newSet.add(item.id)
                      }
                      return newSet
                    })
                  }}
                >
                  <div className="relative w-full aspect-[2.5/3.5] group">
                    {/* Card container */}
                    <div className={`absolute inset-0 rounded-2xl overflow-hidden shadow-2xl transform transition-all duration-300 hover:scale-105 hover:z-10 cursor-pointer ${
                      isFaded ? 'opacity-30' : 'opacity-100'
                    }`}>
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

                    {/* Card info overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                      <h3 className="text-base font-black text-white mb-1 truncate">
                        {item.card_detail?.name || 'Unknown Card'}
                      </h3>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-1 bg-white/20 text-white rounded font-bold truncate max-w-[150px]">
                          {item.card_detail?.set_name || 'Unknown'}
                        </span>
                        <span className="px-2 py-1 bg-emerald-500/80 text-white rounded font-bold">
                          x{item.quantity}
                        </span>
                      </div>
                    </div>

                    {/* Prestige badge - always visible */}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-full px-4">
                      <div className={`
                        inline-flex px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg border-2 mx-auto
                        ${prestigeColors[item.prestige] || prestigeColors.common}
                      `}>
                        {item.prestige_display || item.prestige}
                      </div>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          </div>

          {/* Press ESC hint */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-gray-400 text-sm">
            Press ESC to close
          </div>
        </div>
      )}
    </div>
  )
}

export default InventoryPage

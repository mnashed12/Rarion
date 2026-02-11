/**
 * Cards Page
 * 
 * Pokemon-themed marketplace-style card browser with:
 * - Gradient headers and Pokemon type badges
 * - Holographic card effects on rare cards
 * - Animated hover effects
 */

import { useState, useEffect } from 'react'
import { 
  Search, 
  Plus, 
  Package, 
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Star
} from 'lucide-react'
import apiClient from '../services/api'
import type { Card, PokemonSet, Deck } from '../types'
import { Toast, type ToastType } from '../components/common'

interface AddToInventoryModal {
  card: Card | null
  isOpen: boolean
}

/**
 * Get Pokemon type color class
 */
// @ts-ignore: keeping for future use
function _getTypeColor(type: string | undefined): string {
  const colors: Record<string, string> = {
    'fire': 'from-orange-500 to-red-600',
    'water': 'from-blue-400 to-blue-600',
    'grass': 'from-green-400 to-green-600',
    'lightning': 'from-yellow-400 to-amber-500',
    'electric': 'from-yellow-400 to-amber-500',
    'psychic': 'from-purple-400 to-purple-600',
    'fighting': 'from-orange-600 to-red-700',
    'darkness': 'from-gray-700 to-gray-900',
    'dark': 'from-gray-700 to-gray-900',
    'metal': 'from-gray-400 to-gray-600',
    'steel': 'from-gray-400 to-gray-600',
    'fairy': 'from-pink-400 to-pink-600',
    'dragon': 'from-indigo-500 to-purple-700',
    'colorless': 'from-gray-300 to-gray-500',
    'normal': 'from-gray-300 to-gray-500',
  }
  return colors[type?.toLowerCase() || ''] || 'from-gray-400 to-gray-600'
}

/**
 * Get rarity styling
 */
function getRarityStyle(rarity: string | undefined): { bg: string; text: string; glow: boolean } {
  const r = rarity?.toLowerCase() || ''
  if (r.includes('secret')) return { bg: 'bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400', text: 'text-amber-900', glow: true }
  if (r.includes('ultra')) return { bg: 'bg-gradient-to-r from-purple-500 to-pink-500', text: 'text-white', glow: true }
  if (r.includes('holo')) return { bg: 'bg-gradient-to-r from-blue-400 to-cyan-400', text: 'text-white', glow: true }
  if (r.includes('rare')) return { bg: 'bg-gradient-to-r from-amber-400 to-yellow-500', text: 'text-amber-900', glow: false }
  if (r.includes('uncommon')) return { bg: 'bg-gray-600', text: 'text-white', glow: false }
  return { bg: 'bg-gray-400', text: 'text-white', glow: false }
}

function CardsPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [sets, setSets] = useState<PokemonSet[]>([])
  const [decks, setDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSet, setSelectedSet] = useState<string>('')
  const [selectedRarity, setSelectedRarity] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('name')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [modal, setModal] = useState<AddToInventoryModal>({ card: null, isOpen: false })
  const [showFilters, setShowFilters] = useState(false)
  const [showDeckModal, setShowDeckModal] = useState(false)
  const [newDeckName, setNewDeckName] = useState('')
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const [inventoryForm, setInventoryForm] = useState({
    quantity: 1,
    condition: 'near_mint', // default to valid backend value
    current_price: '',
    location: '',
    notes: '',
    deck_id: decks.length > 0 ? decks[0].id : null
  })

  const ITEMS_PER_PAGE = 24

  // Fetch sets for filter (ordered chronologically by release date)
  useEffect(() => {
    const fetchSets = async () => {
      try {
        const response = await apiClient.get('/sets/?ordering=-release_date')
        setSets(response.data.results || response.data)
      } catch (error) {
        console.error('Error fetching sets:', error)
      }
    }
    fetchSets()
  }, [])

  // Fetch decks from the backend when the page loads
  useEffect(() => {
    const fetchDecks = async () => {
      try {
        const response = await apiClient.get('/decks/')
        setDecks(response.data.results || response.data)
      } catch (error) {
        console.error('Error fetching decks:', error)
      }
    }
    fetchDecks()
  }, [])

  // Fetch cards with filters
  useEffect(() => {
    const fetchCards = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (searchTerm) params.append('search', searchTerm)
        if (selectedSet) params.append('pokemon_set', selectedSet)
        if (selectedRarity) params.append('rarity', selectedRarity)
        if (selectedType) params.append('card_type', selectedType)
        if (sortBy) params.append('ordering', sortBy)
        params.append('page', page.toString())
        params.append('page_size', ITEMS_PER_PAGE.toString())

        const response = await apiClient.get(`/cards/?${params.toString()}`)
        setCards(response.data.results || [])
        setTotalCount(response.data.count || 0)
      } catch (error) {
        console.error('Error fetching cards:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCards()
  }, [searchTerm, selectedSet, selectedRarity, selectedType, sortBy, page])

  const openAddToInventory = (card: Card) => {
    setModal({ card, isOpen: true })
    setInventoryForm({
      quantity: 1,
      condition: 'near_mint', // default to valid backend value
      current_price: '',
      location: '',
      notes: '',
      deck_id: decks.length > 0 ? decks[0].id : null
    })
  }

  const closeModal = () => {
    setModal({ card: null, isOpen: false })
  }

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDeckName.trim()) return

    try {
      const response = await apiClient.post('/decks/', { name: newDeckName })
      const newDeck = response.data
      setDecks([...decks, newDeck])
      setNewDeckName('')
      setShowDeckModal(false)
      // Set the new deck as selected in the form
      setInventoryForm({ ...inventoryForm, deck_id: newDeck.id })
      setToast({ message: `Deck "${newDeck.name}" created!`, type: 'success' })
    } catch (error: any) {
      console.error('Error creating deck:', error)
      setToast({ message: error.response?.data?.detail || 'Failed to create deck', type: 'error' })
    }
  }

  const handleAddToInventory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modal.card) return

    try {
      await apiClient.post('/inventory/', {
        card: modal.card.id,
        quantity: inventoryForm.quantity,
        condition: inventoryForm.condition,
        current_price: inventoryForm.current_price || null,
        location: inventoryForm.location,
        notes: inventoryForm.notes,
        deck_id: inventoryForm.deck_id
      })

      setToast({ message: `${modal.card.name} added to inventory!`, type: 'success' })
      closeModal()
    } catch (error: any) {
      // Log the error response for easier debugging
      if (error.response) {
        console.error('Error response data:', error.response.data)
        const errorData = error.response.data
        let errorMessage = 'Failed to add to inventory'
        
        if (errorData.non_field_errors) {
          errorMessage = errorData.non_field_errors.join(', ')
        } else if (typeof errorData === 'object') {
          errorMessage = Object.entries(errorData)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('\n')
        }
        
        setToast({ message: errorMessage, type: 'error' })
      } else {
        setToast({ message: 'Failed to add to inventory', type: 'error' })
      }
      console.error('Error adding to inventory:', error)
    }
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setSelectedSet('')
    setSelectedRarity('')
    setSelectedType('')
    setPage(1)
  }

  const activeFilterCount = [selectedSet, selectedRarity, selectedType].filter(Boolean).length

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <div className="space-y-6">
      {/* Page Header - Pokemon themed with Search Bar and Filters */}
      <div 
        className="relative overflow-hidden rounded-2xl p-5 sm:p-6 animate-slide-down"
        style={{
          background: 'linear-gradient(135deg, #3B5CA8 0%, #1D2C5E 100%)'
        }}
      >
        {/* Decorative pokeball */}
        <div className="absolute -right-10 -top-10 w-40 h-40 opacity-10">
          <div className="w-full h-full rounded-full border-8 border-white relative">
            <div className="absolute top-1/2 left-0 right-0 h-3 bg-white -translate-y-1/2" />
          </div>
        </div>
        
        <div className="relative z-10 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">Card Database</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Browse Cards
            </h1>
            <p className="text-blue-200 text-sm mt-1">
              {loading ? 'Loading...' : `${totalCount.toLocaleString()} cards available`}
            </p>
          </div>

          {/* Search Bar in Header */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" />
              <input
                type="text"
                placeholder="Search by name, set, or number..."
                className="
                  w-full h-12 pl-11 pr-4
                  bg-white/95 backdrop-blur-sm border-2 border-white/50 rounded-xl
                  text-sm placeholder:text-gray-400
                  focus:outline-none focus:ring-2 focus:ring-white focus:border-white focus:bg-white
                  transition-all shadow-lg
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            
            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`
                flex items-center justify-center gap-2
                h-12 px-4 rounded-xl border-2
                text-sm font-bold
                transition-all active:scale-[0.98]
                shadow-lg
                ${showFilters || activeFilterCount > 0
                  ? 'bg-white border-white text-blue-600'
                  : 'bg-white/20 backdrop-blur-sm border-white/50 text-white hover:bg-white/30'
                }
              `}
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className={`w-5 h-5 ${showFilters ? 'bg-blue-500' : 'bg-white/30'} ${showFilters ? 'text-white' : 'text-blue-200'} text-xs rounded-full flex items-center justify-center`}>
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Active Filter Pills */}
          {!showFilters && activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedSet && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm text-white shadow-sm border border-white/30">
                  {sets.find(s => s.id.toString() === selectedSet)?.name}
                  <button
                    onClick={() => setSelectedSet('')}
                    className="ml-2 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedRarity && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm text-white shadow-sm border border-white/30">
                  {selectedRarity.replace('_', ' ')}
                  <button
                    onClick={() => setSelectedRarity('')}
                    className="ml-2 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Collapsible Filters Panel */}
          <div className={`
            overflow-hidden transition-all duration-300 ease-in-out
            ${showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
          `}>
            <div className="rounded-xl space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Set Filter */}
                <div>
                  <select
                    style={{ outline: 'none', boxShadow: 'none' }}
                    className="
                      w-full h-11 px-3 bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-xl
                      text-sm font-medium text-white appearance-none
                      transition-all
                      [&>option]:text-gray-900 [&>option]:bg-white
                    "
                    value={selectedSet}
                    onChange={(e) => {
                      setSelectedSet(e.target.value)
                      setPage(1)
                    }}
                  >
                    <option value="">All Sets</option>
                    {sets.map((set) => (
                      <option key={set.id} value={set.id}>
                        {set.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Rarity Filter */}
                <div>
                  <select
                    style={{ outline: 'none', boxShadow: 'none' }}
                    className="
                      w-full h-11 px-3 bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-xl
                      text-sm font-medium text-white appearance-none
                      transition-all
                      [&>option]:text-gray-900 [&>option]:bg-white
                    "
                    value={selectedRarity}
                    onChange={(e) => {
                      setSelectedRarity(e.target.value)
                      setPage(1)
                    }}
                  >
                    <option value="">All Rarities</option>
                    <option value="common">Common</option>
                    <option value="uncommon">Uncommon</option>
                    <option value="rare">Rare</option>
                    <option value="rare_holo">Rare Holo</option>
                    <option value="rare_ultra">Ultra Rare</option>
                    <option value="rare_secret">Secret Rare</option>
                    <option value="promo">Promo</option>
                  </select>
                </div>
                
                {/* Sort By */}
                <div>
                  <select
                    className="
                      w-full h-11 px-3 bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-xl
                      text-sm font-medium text-white appearance-none
                      transition-all
                      [&>option]:text-gray-900 [&>option]:bg-white
                    "
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value)
                      setPage(1)
                    }}
                  >
                    <option value="name">Name (A-Z)</option>
                    <option value="-name">Name (Z-A)</option>
                    <option value="card_number">Card # (Low-High)</option>
                    <option value="-card_number">Card # (High-Low)</option>
                    <option value="-pokemon_set__release_date,card_number">Newest Sets</option>
                    <option value="pokemon_set__release_date,card_number">Oldest Sets</option>
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-white/80 hover:text-white font-bold flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Empty container to maintain structure */}
      <div className="hidden">

      </div>

      {/* Cards Grid - Pokemon themed */}
      <div className="animate-slide-down" style={{ animationDelay: '75ms' }}>
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden shadow-md">
              <div className="aspect-[2.5/3.5] skeleton rounded-2xl" />
            </div>
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-100 p-10 sm:p-16 text-center">
          <div className="absolute top-4 right-4 opacity-20">
            <Sparkles className="w-12 h-12 text-gray-400" />
          </div>
          <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
            <Search className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Cards Found</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            We couldn't find any cards matching your search. Try adjusting your filters.
          </p>
          <button
            onClick={clearAllFilters}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            <X className="w-4 h-4" />
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {cards.map((card) => {
            const rarityStyle = getRarityStyle(card.rarity)
            const isRare = rarityStyle.glow
            
            return (
              <div
                key={card.id}
                className="group cursor-pointer"
                style={{ perspective: '1000px' }}
              >
                {/* Flip Container */}
                <div
                  className="
                    card-flip
                    relative w-full aspect-[2.5/3.5]
                    shadow-md group-hover:shadow-2xl
                  "
                >
                  {/* Front Face - Card Image */}
                  <div
                    className="card-face absolute inset-0 rounded-2xl overflow-hidden"
                  >
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                      <img
                        src={card.image_url || card.image || '/images/placeholder-card.svg'}
                        alt={card.name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement
                          if (!img.src.endsWith('/images/placeholder-card.svg')) {
                            img.src = '/images/placeholder-card.svg'
                          }
                        }}
                      />
                      
                      {/* Holo shine effect for rare cards */}
                      {isRare && (
                        <div className="absolute inset-0 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
                          <div 
                            className="absolute inset-[-100%] bg-gradient-to-tr from-transparent via-white/40 to-transparent"
                            style={{ 
                              transform: 'rotate(25deg) translateX(-200%)',
                              animation: 'shine 0.5s ease-out'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Back Face - Stats */}
                  <div
                    className="card-face card-face-back absolute inset-0 rounded-2xl overflow-hidden"
                  >
                    {/* Card Back Background Image */}
                    <div 
                      className="w-full h-full p-2 relative"
                      style={{
                        backgroundImage: 'url(/images/cardback.jpg)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      {/* Slight overlay for readability */}
                      <div className="absolute inset-0 bg-black/30" />
                      
                      {/* Inner Card Frame */}
                      <div className="relative z-10 w-full h-full rounded-xl bg-gradient-to-br from-amber-200 via-yellow-100 to-amber-200 p-[3px] shadow-inner">
                        <div 
                          className="w-full h-full rounded-lg flex flex-col overflow-hidden relative"
                          style={{
                            backgroundImage: 'url(/images/cardback.jpg)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}
                        >
                          {/* Slight overlay for readability */}
                          <div className="absolute inset-0 bg-white/75 rounded-lg" />
                          
                          {/* Header with Pokemon Name */}
                          <div 
                            className="relative z-10 px-3 py-2"
                            style={{ background: 'linear-gradient(135deg, #3B5CA8 0%, #1D2C5E 100%)' }}
                          >
                            <h3 className="font-black text-white text-sm leading-tight truncate drop-shadow" title={card.name}>
                              {card.name}
                            </h3>
                          </div>
                          
                          {/* Stats Content */}
                          <div className="relative z-10 flex-1 p-2 flex flex-col gap-1">
                            {/* Price - Featured */}
                            {card.price_market && (
                              <div className="flex items-center justify-between rounded-lg px-2.5 py-1.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
                                <span className="text-[14px] font-bold text-green-700 uppercase">Price</span>
                                <span className="text-[16px] font-black text-green-700">
                                  ${parseFloat(card.price_market).toFixed(2)}
                                </span>
                              </div>
                            )}
                            
                            {/* Set */}
                            <div className="flex items-center justify-between rounded-lg px-2.5 py-1">
                              <span className="text-[12px] font-bold text-blue-800 uppercase">Set</span>
                              <span className="text-[12px] font-black text-blue-900 truncate ml-2">
                                {card.pokemon_set_detail?.set_code || '—'}
                              </span>
                            </div>
                            
                            {/* Number */}
                            <div className="flex items-center justify-between rounded-lg px-2.5 py-1">
                              <span className="text-[12px] font-bold text-blue-800 uppercase">Number</span>
                              <span className="text-[12px] font-black text-blue-900">
                                #{card.card_number || '—'}
                              </span>
                            </div>
                            
                            {/* Type */}
                            <div className="flex items-center justify-between rounded-lg px-2.5 py-1">
                              <span className="text-[12px] font-bold text-blue-800 uppercase">Type</span>
                              <span className="text-[12px] font-black text-blue-900 capitalize">
                                {card.card_type || '—'}
                              </span>
                            </div>
                            
                            {/* Rarity */}
                            <div className="flex items-center justify-between rounded-lg px-2.5 py-1">
                              <span className="text-[12px] font-bold text-blue-800 uppercase">Rarity</span>
                              <span className="text-[12px] font-black text-blue-900 flex items-center gap-1">
                                {isRare && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                                <span className="truncate">{card.rarity?.replace('_', ' ') || '—'}</span>
                              </span>
                            </div>
                          </div>
                          
                          {/* Add Button */}
                          <div className="relative z-10 p-2 pt-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                openAddToInventory(card)
                              }}
                              className="
                                w-full py-2
                                bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400
                                hover:from-amber-500 hover:via-yellow-500 hover:to-amber-500
                                text-gray-900 text-[11px] font-black uppercase tracking-wide
                                rounded-lg
                                flex items-center justify-center gap-1
                                transition-all duration-200
                                shadow-md hover:shadow-lg
                                active:scale-[0.98]
                              "
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add to Collection
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      </div>

      {/* Pokemon-themed Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-gradient-to-r from-gray-50 to-white rounded-2xl border-2 border-gray-100 p-4 shadow-sm animate-slide-down" style={{ animationDelay: '150ms' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="
              flex items-center gap-2 px-4 py-2.5
              bg-white hover:bg-gray-50 
              text-gray-700 text-sm font-bold
              rounded-xl border-2 border-gray-100
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all active:scale-[0.98]
              shadow-sm
            "
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>
          
          <div className="text-center flex items-center gap-2">
            <span className="text-sm font-black text-gray-900">
              {page}
            </span>
            <span className="text-sm text-gray-400">of</span>
            <span className="text-sm font-bold text-gray-600">{totalPages.toLocaleString()}</span>
          </div>
          
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="
              flex items-center gap-2 px-4 py-2.5
              bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700
              text-white text-sm font-bold
              rounded-xl
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all active:scale-[0.98]
              shadow-md
            "
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Add to Inventory Modal - Pokemon themed */}
      {modal.isOpen && modal.card && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
          <div 
            className="
              bg-white w-full sm:max-w-lg sm:rounded-3xl 
              rounded-t-3xl
              max-h-[90vh] overflow-y-auto
              animate-in slide-in-from-bottom duration-300
              shadow-2xl
            "
          >
            {/* Modal Header - Gradient */}
            <div 
              className="sticky top-0 px-5 py-4 flex items-center justify-between rounded-t-3xl"
              style={{
                background: 'linear-gradient(135deg, #3B5CA8 0%, #1D2C5E 100%)'
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Add to Collection</h2>
                  <p className="text-xs text-blue-200">Track this card in your inventory</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            <div className="p-5">
              {/* Card Preview */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-100 mb-5">
                <img
                  src={modal.card.image_url || modal.card.image || '/images/placeholder-card.svg'}
                  alt={modal.card.name}
                  className="w-20 h-28 object-contain rounded-lg shadow-md"
                />
                <div>
                  <p className="font-bold text-gray-900 text-lg">{modal.card.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {modal.card.pokemon_set_detail?.name}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-bold text-gray-400">#{modal.card.card_number}</span>
                    {modal.card.rarity && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${getRarityStyle(modal.card.rarity).bg} ${getRarityStyle(modal.card.rarity).text}`}>
                        {modal.card.rarity.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <form onSubmit={handleAddToInventory} className="space-y-5">
                {/* Quantity + Condition Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      className="
                        w-full h-12 px-4 bg-gray-50 border-2 border-gray-100 rounded-xl
                        text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        transition-all
                      "
                      value={inventoryForm.quantity}
                      onChange={(e) => setInventoryForm({ ...inventoryForm, quantity: parseInt(e.target.value) || 1 })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
                      Condition
                    </label>
                    <select
                      required
                      className="
                        w-full h-12 px-4 bg-gray-50 border-2 border-gray-100 rounded-xl
                        text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        transition-all
                      "
                      value={inventoryForm.condition}
                        onChange={(e) => setInventoryForm({ ...inventoryForm, condition: e.target.value })}
                      >
                        <option value="near_mint">Near Mint (NM)</option>
                        <option value="lightly_played">Lightly Played (LP)</option>
                        <option value="moderately_played">Moderately Played (MP)</option>
                        <option value="heavily_played">Heavily Played (HP)</option>
                        <option value="damaged">Damaged (DMG)</option>
                      </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
                    Price <span className="text-gray-400 font-normal normal-case">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="
                        w-full h-12 pl-8 pr-4 bg-gray-50 border-2 border-gray-100 rounded-xl
                        text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        transition-all
                      "
                      placeholder="0.00"
                      value={inventoryForm.current_price}
                      onChange={(e) => setInventoryForm({ ...inventoryForm, current_price: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
                    Location <span className="text-gray-400 font-normal normal-case">(optional)</span>
                  </label>
                  <input
                    type="text"
                    className="
                      w-full h-12 px-4 bg-gray-50 border-2 border-gray-100 rounded-xl
                      text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      transition-all
                    "
                    placeholder="e.g., Binder 1, Sleeve A, Page 5"
                    value={inventoryForm.location}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, location: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
                    Notes <span className="text-gray-400 font-normal normal-case">(optional)</span>
                  </label>
                  <textarea
                    className="
                      w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl
                      text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      transition-all resize-none
                    "
                    rows={2}
                    placeholder="Any additional notes about this card..."
                    value={inventoryForm.notes}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, notes: e.target.value })}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">
                      Deck
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowDeckModal(true)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      New Deck
                    </button>
                  </div>
                  {decks.length > 0 ? (
                    <select
                      required
                      className="w-full h-12 px-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      value={inventoryForm.deck_id || ''}
                      onChange={e => setInventoryForm({ ...inventoryForm, deck_id: Number(e.target.value) })}
                    >
                      {decks.map(deck => (
                        <option key={deck.id} value={deck.id}>{deck.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full h-12 px-4 bg-gray-50 border-2 border-gray-100 rounded-xl flex items-center justify-center text-sm text-gray-400">
                      No decks available. Create one first!
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2 pb-safe">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="
                      flex-1 h-13 py-3.5
                      bg-gray-100 hover:bg-gray-200
                      text-gray-700 font-bold
                      rounded-xl
                      transition-all active:scale-[0.98]
                    "
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="
                      flex-1 h-13 py-3.5
                      bg-gradient-to-r from-blue-500 to-blue-600 
                      hover:from-blue-600 hover:to-blue-700
                      text-white font-bold
                      rounded-xl
                      transition-all active:scale-[0.98]
                      shadow-lg shadow-blue-500/25
                      flex items-center justify-center gap-2
                    "
                  >
                    <Plus className="w-5 h-5" />
                    Add to Collection
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Deck Creation Modal */}
      {showDeckModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-xl font-black text-gray-900">Create New Deck</h2>
              <button
                onClick={() => {
                  setShowDeckModal(false)
                  setNewDeckName('')
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-5">
              <form onSubmit={handleCreateDeck} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
                    Deck Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full h-12 px-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="e.g., Main Collection, Trade Binder, etc."
                    value={newDeckName}
                    onChange={(e) => setNewDeckName(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeckModal(false)
                      setNewDeckName('')
                    }}
                    className="flex-1 h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25"
                  >
                    Create Deck
                  </button>
                </div>
              </form>
            </div>
          </div>
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
    </div>
  )
}

export default CardsPage

/**
 * TypeScript interfaces for Pokemon Card Inventory
 * 
 * These interfaces match the Django models defined in the backend.
 * Keep these in sync with any backend model changes.
 */

// ============================================
// Enums matching Django model choices
// ============================================

/**
 * Card rarity levels
 */
export enum CardRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  HOLO_RARE = 'holo_rare',
  ULTRA_RARE = 'ultra_rare',
  SECRET_RARE = 'secret_rare',
}

/**
 * Display names for card rarities
 */
export const CardRarityDisplay: Record<CardRarity, string> = {
  [CardRarity.COMMON]: 'Common',
  [CardRarity.UNCOMMON]: 'Uncommon',
  [CardRarity.RARE]: 'Rare',
  [CardRarity.HOLO_RARE]: 'Holo Rare',
  [CardRarity.ULTRA_RARE]: 'Ultra Rare',
  [CardRarity.SECRET_RARE]: 'Secret Rare',
}

/**
 * Card types
 */
export enum CardType {
  POKEMON = 'pokemon',
  TRAINER = 'trainer',
  ENERGY = 'energy',
}

/**
 * Display names for card types
 */
export const CardTypeDisplay: Record<CardType, string> = {
  [CardType.POKEMON]: 'Pokemon',
  [CardType.TRAINER]: 'Trainer',
  [CardType.ENERGY]: 'Energy',
}

/**
 * Inventory item conditions
 */
export enum InventoryCondition {
  MINT = 'mint',
  NEAR_MINT = 'near_mint',
  LIGHTLY_PLAYED = 'lightly_played',
  MODERATELY_PLAYED = 'moderately_played',
  HEAVILY_PLAYED = 'heavily_played',
  DAMAGED = 'damaged',
}

/**
 * Display names for conditions
 */
export const InventoryConditionDisplay: Record<InventoryCondition, string> = {
  [InventoryCondition.MINT]: 'Mint',
  [InventoryCondition.NEAR_MINT]: 'Near Mint',
  [InventoryCondition.LIGHTLY_PLAYED]: 'Lightly Played',
  [InventoryCondition.MODERATELY_PLAYED]: 'Moderately Played',
  [InventoryCondition.HEAVILY_PLAYED]: 'Heavily Played',
  [InventoryCondition.DAMAGED]: 'Damaged',
}

/**
 * Prestige levels for cards in decks
 */
export enum Prestige {
  STAR = 'star',
  GALAXY = 'galaxy',
  COSMOS = 'cosmos',
  RARION = 'rarion',
}

export const PrestigeDisplay: Record<Prestige, string> = {
  [Prestige.STAR]: 'Star',
  [Prestige.GALAXY]: 'Galaxy',
  [Prestige.COSMOS]: 'Cosmos',
  [Prestige.RARION]: 'Rarion',
}

/**
 * Stream platforms
 */
export enum StreamPlatform {
  TWITCH = 'twitch',
  YOUTUBE = 'youtube',
  OTHER = 'other',
}

/**
 * Display names for platforms
 */
export const StreamPlatformDisplay: Record<StreamPlatform, string> = {
  [StreamPlatform.TWITCH]: 'Twitch',
  [StreamPlatform.YOUTUBE]: 'YouTube',
  [StreamPlatform.OTHER]: 'Other',
}

// ============================================
// Model Interfaces
// ============================================

/**
 * Pokemon Set - A collection/expansion of Pokemon cards
 */
export interface PokemonSet {
  id: number
  name: string
  set_code: string
  release_date: string | null
  total_cards: number
  series: string
  card_count?: number
  created_at: string
  updated_at: string
}

/**
 * Lightweight Pokemon Set for nested responses
 */
export interface PokemonSetSummary {
  id: number
  name: string
  set_code: string
  series: string
}

/**
 * Input data for creating/updating a Pokemon Set
 */
export interface PokemonSetInput {
  name: string
  set_code: string
  release_date?: string | null
  total_cards?: number
  series?: string
}

/**
 * Pokemon Card
 */
export interface Card {
  id: number
  name: string
  card_number: string
  pokemon_set: number
  pokemon_set_detail?: PokemonSetSummary
  rarity: CardRarity
  rarity_display?: string
  card_type: CardType
  card_type_display?: string
  image: string | null
  image_url: string | null
  created_at: string
  updated_at: string
}

/**
 * Card with inventory information
 */
export interface CardWithInventory extends Card {
  inventory_items: InventoryItemSummary[]
  total_quantity: number
}

/**
 * Lightweight Card for nested responses
 */
export interface CardSummary {
  id: number
  name: string
  card_number: string
  set_name: string
  set_code: string
  rarity: CardRarity
  card_type: CardType
  image?: string | null
}

/**
 * Input data for creating/updating a Card
 */
export interface CardInput {
  name: string
  card_number: string
  pokemon_set: number
  rarity: CardRarity
  card_type: CardType
  image?: File | null
}

/**
 * Inventory Item - A specific card in a specific condition
 */
export interface InventoryItem {
  id: number
  card: number
  card_detail?: CardSummary
  condition: InventoryCondition
  condition_display?: string
  prestige: string
  prestige_display?: string
  quantity: number
  purchase_price: string | null
  current_price: string | null
  total_value?: string | null
  profit_margin?: number | null
  location: string
  notes: string
  sku: string
  auction_code: string
  sold_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Lightweight Inventory Item for nested responses
 */
export interface InventoryItemSummary {
  id: number
  sku: string
  card_name: string
  set_name: string
  condition: InventoryCondition
  quantity: number
  current_price: string | null
}

/**
 * Input data for creating/updating an Inventory Item
 */
export interface InventoryItemInput {
  card: number
  condition: InventoryCondition
  quantity: number
  purchase_price?: string | null
  current_price?: string | null
  location?: string
  notes?: string
}

/**
 * Stream Event - A live streaming session
 */
export interface StreamEvent {
  id: number
  title: string
  stream_date: string
  platform: StreamPlatform
  platform_display?: string
  notes: string
  total_items_shown?: number
  total_items_sold?: number
  created_at: string
}

/**
 * Stream Event with full inventory details
 */
export interface StreamEventDetail extends StreamEvent {
  inventory: StreamInventory[]
}

/**
 * Input data for creating/updating a Stream Event
 */
export interface StreamEventInput {
  title: string
  stream_date: string
  platform: StreamPlatform
  notes?: string
}

/**
 * Stream Inventory - Links inventory items to stream events
 */
export interface StreamInventory {
  id: number
  stream_event: number
  stream_event_detail?: {
    id: number
    title: string
    stream_date: string
    platform: StreamPlatform
  }
  inventory_item: number
  inventory_item_detail?: InventoryItemSummary
  quantity_shown: number
  quantity_sold: number
  featured: boolean
  created_at: string
  updated_at: string
}

/**
 * Input data for creating/updating Stream Inventory
 */
export interface StreamInventoryInput {
  stream_event: number
  inventory_item: number
  quantity_shown: number
  quantity_sold?: number
  featured?: boolean
}

// ============================================
// API Response Types
// ============================================

/**
 * Paginated response from DRF
 */
export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

/**
 * API Error response
 */
export interface ApiError {
  detail?: string
  message?: string
  [key: string]: unknown
}

/**
 * Inventory statistics
 */
export interface InventoryStats {
  total_items: number
  total_quantity: number
  total_value: number
  average_price: number
  by_condition: {
    condition: InventoryCondition
    count: number
    total_qty: number
  }[]
  low_stock: number
  out_of_stock: number
}

/**
 * Pokemon Set statistics
 */
export interface SetStats {
  total_sets: number
  total_cards_in_db: number
  sets_by_series: {
    series: string
    count: number
  }[]
  latest_set: PokemonSet | null
}

/**
 * Stream statistics
 */
export interface StreamStats {
  total_streams: number
  by_platform: {
    platform: StreamPlatform
    count: number
  }[]
  recent_streams: StreamEvent[]
}

// ============================================
// Filter Types
// ============================================

/**
 * Card filter parameters
 */
export interface CardFilters {
  name?: string
  pokemon_set?: number
  set_code?: string
  rarity?: CardRarity
  card_type?: CardType
  rarity_in?: CardRarity[]
  search?: string
  ordering?: string
  page?: number
}

/**
 * Inventory filter parameters
 */
export interface InventoryFilters {
  card?: number
  card_name?: string
  set_code?: string
  condition?: InventoryCondition
  condition_in?: InventoryCondition[]
  min_quantity?: number
  max_quantity?: number
  min_price?: number
  max_price?: number
  location?: string
  sku?: string
  in_stock?: boolean
  search?: string
  ordering?: string
  page?: number
}

/**
 * Stream filter parameters
 */
export interface StreamFilters {
  title?: string
  platform?: StreamPlatform
  stream_date_after?: string
  stream_date_before?: string
  search?: string
  ordering?: string
  page?: number
}

/**
 * Prestige stats returned per deck (unsold cards only)
 */
export interface DeckPrestigeStats {
  total: number;
  star: number;
  galaxy: number;
  cosmos: number;
  rarion: number;
}

/**
 * Deck type
 */
export interface Deck {
  id: number;
  name: string;
  background_image: 'PAKMAKDECK' | 'DANNYDECK';
  owner: number;
  created_at: string;
  updated_at: string;
  prestige_stats?: DeckPrestigeStats;
}

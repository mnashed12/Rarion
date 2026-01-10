/**
 * Cards API Service
 * 
 * Provides functions for interacting with the Cards API endpoints.
 */

import apiClient, { buildQueryString } from './api'
import type {
  Card,
  CardWithInventory,
  CardInput,
  CardFilters,
  InventoryItem,
  PaginatedResponse,
} from '../types'

const ENDPOINT = '/cards'

/**
 * Fetch all cards with optional filters
 */
export async function getCards(filters?: CardFilters): Promise<PaginatedResponse<Card>> {
  const query = filters ? buildQueryString(filters) : ''
  const response = await apiClient.get<PaginatedResponse<Card>>(`${ENDPOINT}/${query}`)
  return response.data
}

/**
 * Fetch a single card by ID (includes inventory information)
 */
export async function getCardById(id: number): Promise<CardWithInventory> {
  const response = await apiClient.get<CardWithInventory>(`${ENDPOINT}/${id}/`)
  return response.data
}

/**
 * Create a new card
 */
export async function createCard(data: CardInput): Promise<Card> {
  // If there's an image, use FormData
  if (data.image) {
    const formData = new FormData()
    formData.append('name', data.name)
    formData.append('card_number', data.card_number)
    formData.append('pokemon_set', String(data.pokemon_set))
    formData.append('rarity', data.rarity)
    formData.append('card_type', data.card_type)
    formData.append('image', data.image)
    
    const response = await apiClient.post<Card>(`${ENDPOINT}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  }
  
  // No image, use JSON
  const response = await apiClient.post<Card>(`${ENDPOINT}/`, {
    name: data.name,
    card_number: data.card_number,
    pokemon_set: data.pokemon_set,
    rarity: data.rarity,
    card_type: data.card_type,
  })
  return response.data
}

/**
 * Update an existing card
 */
export async function updateCard(id: number, data: Partial<CardInput>): Promise<Card> {
  // If there's an image, use FormData
  if (data.image) {
    const formData = new FormData()
    if (data.name) formData.append('name', data.name)
    if (data.card_number) formData.append('card_number', data.card_number)
    if (data.pokemon_set) formData.append('pokemon_set', String(data.pokemon_set))
    if (data.rarity) formData.append('rarity', data.rarity)
    if (data.card_type) formData.append('card_type', data.card_type)
    formData.append('image', data.image)
    
    const response = await apiClient.patch<Card>(`${ENDPOINT}/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  }
  
  // No image, use JSON
  const response = await apiClient.patch<Card>(`${ENDPOINT}/${id}/`, data)
  return response.data
}

/**
 * Delete a card
 */
export async function deleteCard(id: number): Promise<void> {
  await apiClient.delete(`${ENDPOINT}/${id}/`)
}

/**
 * Fetch inventory items for a specific card
 */
export async function getCardInventory(cardId: number): Promise<InventoryItem[]> {
  const response = await apiClient.get<InventoryItem[]>(`${ENDPOINT}/${cardId}/inventory/`)
  return response.data
}

/**
 * Upload an image for a card
 */
export async function uploadCardImage(cardId: number, image: File): Promise<Card> {
  const formData = new FormData()
  formData.append('image', image)
  
  const response = await apiClient.post<Card>(`${ENDPOINT}/${cardId}/upload-image/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

/**
 * Search cards by name
 */
export async function searchCards(query: string, limit?: number): Promise<Card[]> {
  const response = await apiClient.get<PaginatedResponse<Card>>(
    `${ENDPOINT}/?search=${encodeURIComponent(query)}${limit ? `&page_size=${limit}` : ''}`
  )
  return response.data.results
}

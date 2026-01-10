/**
 * Inventory API Service
 * 
 * Provides functions for interacting with the Inventory API endpoints.
 */

import apiClient, { buildQueryString } from './api'
import type {
  InventoryItem,
  InventoryItemInput,
  InventoryFilters,
  InventoryStats,
  PaginatedResponse,
} from '../types'

const ENDPOINT = '/inventory'

/**
 * Fetch all inventory items with optional filters
 */
export async function getInventoryItems(
  filters?: InventoryFilters
): Promise<PaginatedResponse<InventoryItem>> {
  const query = filters ? buildQueryString(filters) : ''
  const response = await apiClient.get<PaginatedResponse<InventoryItem>>(`${ENDPOINT}/${query}`)
  return response.data
}

/**
 * Fetch a single inventory item by ID
 */
export async function getInventoryItemById(id: number): Promise<InventoryItem> {
  const response = await apiClient.get<InventoryItem>(`${ENDPOINT}/${id}/`)
  return response.data
}

/**
 * Create a new inventory item
 */
export async function createInventoryItem(data: InventoryItemInput): Promise<InventoryItem> {
  const response = await apiClient.post<InventoryItem>(`${ENDPOINT}/`, data)
  return response.data
}

/**
 * Update an existing inventory item
 */
export async function updateInventoryItem(
  id: number,
  data: Partial<InventoryItemInput>
): Promise<InventoryItem> {
  const response = await apiClient.patch<InventoryItem>(`${ENDPOINT}/${id}/`, data)
  return response.data
}

/**
 * Delete an inventory item
 */
export async function deleteInventoryItem(id: number): Promise<void> {
  await apiClient.delete(`${ENDPOINT}/${id}/`)
}

/**
 * Adjust inventory quantity (add or subtract)
 */
export async function adjustInventoryQuantity(
  id: number,
  adjustment: number
): Promise<InventoryItem> {
  const response = await apiClient.post<InventoryItem>(
    `${ENDPOINT}/${id}/adjust-quantity/`,
    { adjustment }
  )
  return response.data
}

/**
 * Fetch inventory statistics
 */
export async function getInventoryStats(filters?: InventoryFilters): Promise<InventoryStats> {
  const query = filters ? buildQueryString(filters) : ''
  const response = await apiClient.get<InventoryStats>(`${ENDPOINT}/stats/${query}`)
  return response.data
}

/**
 * Fetch inventory items that are low in stock
 */
export async function getLowStockItems(threshold = 2): Promise<PaginatedResponse<InventoryItem>> {
  const response = await apiClient.get<PaginatedResponse<InventoryItem>>(
    `${ENDPOINT}/?max_quantity=${threshold}&min_quantity=1`
  )
  return response.data
}

/**
 * Fetch inventory items that are out of stock
 */
export async function getOutOfStockItems(): Promise<PaginatedResponse<InventoryItem>> {
  const response = await apiClient.get<PaginatedResponse<InventoryItem>>(
    `${ENDPOINT}/?in_stock=false`
  )
  return response.data
}

/**
 * Fetch inventory item by SKU
 */
export async function getInventoryItemBySku(sku: string): Promise<InventoryItem | null> {
  const response = await apiClient.get<PaginatedResponse<InventoryItem>>(
    `${ENDPOINT}/?sku=${encodeURIComponent(sku)}`
  )
  return response.data.results[0] || null
}

/**
 * Bulk update inventory prices
 */
export async function bulkUpdatePrices(
  updates: { id: number; current_price: string }[]
): Promise<InventoryItem[]> {
  const promises = updates.map(({ id, current_price }) =>
    updateInventoryItem(id, { current_price })
  )
  return Promise.all(promises)
}

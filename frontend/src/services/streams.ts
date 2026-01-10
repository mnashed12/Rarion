/**
 * Streams API Service
 * 
 * Provides functions for interacting with the Stream Events and
 * Stream Inventory API endpoints.
 */

import apiClient, { buildQueryString } from './api'
import type {
  StreamEvent,
  StreamEventDetail,
  StreamEventInput,
  StreamInventory,
  StreamInventoryInput,
  StreamFilters,
  StreamStats,
  PaginatedResponse,
} from '../types'

const STREAMS_ENDPOINT = '/streams'
const STREAM_INVENTORY_ENDPOINT = '/stream-inventory'

// ============================================
// Stream Events
// ============================================

/**
 * Fetch all stream events with optional filters
 */
export async function getStreamEvents(
  filters?: StreamFilters
): Promise<PaginatedResponse<StreamEvent>> {
  const query = filters ? buildQueryString(filters) : ''
  const response = await apiClient.get<PaginatedResponse<StreamEvent>>(
    `${STREAMS_ENDPOINT}/${query}`
  )
  return response.data
}

/**
 * Fetch a single stream event by ID (includes inventory details)
 */
export async function getStreamEventById(id: number): Promise<StreamEventDetail> {
  const response = await apiClient.get<StreamEventDetail>(`${STREAMS_ENDPOINT}/${id}/`)
  return response.data
}

/**
 * Create a new stream event
 */
export async function createStreamEvent(data: StreamEventInput): Promise<StreamEvent> {
  const response = await apiClient.post<StreamEvent>(`${STREAMS_ENDPOINT}/`, data)
  return response.data
}

/**
 * Update an existing stream event
 */
export async function updateStreamEvent(
  id: number,
  data: Partial<StreamEventInput>
): Promise<StreamEvent> {
  const response = await apiClient.patch<StreamEvent>(`${STREAMS_ENDPOINT}/${id}/`, data)
  return response.data
}

/**
 * Delete a stream event
 */
export async function deleteStreamEvent(id: number): Promise<void> {
  await apiClient.delete(`${STREAMS_ENDPOINT}/${id}/`)
}

/**
 * Fetch inventory for a specific stream
 */
export async function getStreamInventory(streamId: number): Promise<StreamInventory[]> {
  const response = await apiClient.get<StreamInventory[]>(
    `${STREAMS_ENDPOINT}/${streamId}/inventory/`
  )
  return response.data
}

/**
 * Fetch stream statistics
 */
export async function getStreamStats(): Promise<StreamStats> {
  const response = await apiClient.get<StreamStats>(`${STREAMS_ENDPOINT}/stats/`)
  return response.data
}

// ============================================
// Stream Inventory (linking inventory to streams)
// ============================================

/**
 * Fetch all stream inventory links with optional filters
 */
export async function getStreamInventoryLinks(filters?: {
  stream_event?: number
  inventory_item?: number
  featured?: boolean
  has_sales?: boolean
  page?: number
}): Promise<PaginatedResponse<StreamInventory>> {
  const query = filters ? buildQueryString(filters) : ''
  const response = await apiClient.get<PaginatedResponse<StreamInventory>>(
    `${STREAM_INVENTORY_ENDPOINT}/${query}`
  )
  return response.data
}

/**
 * Fetch a single stream inventory link by ID
 */
export async function getStreamInventoryLinkById(id: number): Promise<StreamInventory> {
  const response = await apiClient.get<StreamInventory>(`${STREAM_INVENTORY_ENDPOINT}/${id}/`)
  return response.data
}

/**
 * Create a new stream inventory link (add item to stream)
 */
export async function addItemToStream(data: StreamInventoryInput): Promise<StreamInventory> {
  const response = await apiClient.post<StreamInventory>(`${STREAM_INVENTORY_ENDPOINT}/`, data)
  return response.data
}

/**
 * Update a stream inventory link
 */
export async function updateStreamInventoryLink(
  id: number,
  data: Partial<StreamInventoryInput>
): Promise<StreamInventory> {
  const response = await apiClient.patch<StreamInventory>(
    `${STREAM_INVENTORY_ENDPOINT}/${id}/`,
    data
  )
  return response.data
}

/**
 * Delete a stream inventory link (remove item from stream)
 */
export async function removeItemFromStream(id: number): Promise<void> {
  await apiClient.delete(`${STREAM_INVENTORY_ENDPOINT}/${id}/`)
}

/**
 * Mark an item as sold during a stream
 */
export async function recordSale(
  streamInventoryId: number,
  quantitySold: number
): Promise<StreamInventory> {
  return updateStreamInventoryLink(streamInventoryId, { quantity_sold: quantitySold })
}

/**
 * Toggle featured status of a stream inventory item
 */
export async function toggleFeatured(streamInventoryId: number): Promise<StreamInventory> {
  const current = await getStreamInventoryLinkById(streamInventoryId)
  return updateStreamInventoryLink(streamInventoryId, { featured: !current.featured })
}

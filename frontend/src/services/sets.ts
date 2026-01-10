/**
 * Pokemon Set API Service
 * 
 * Provides functions for interacting with the Pokemon Sets API endpoints.
 */

import apiClient, { buildQueryString } from './api'
import type {
  PokemonSet,
  PokemonSetInput,
  Card,
  PaginatedResponse,
  SetStats,
} from '../types'

const ENDPOINT = '/sets'

/**
 * Fetch all Pokemon sets with optional filters
 */
export async function getSets(filters?: {
  name?: string
  series?: string
  set_code?: string
  release_date_after?: string
  release_date_before?: string
  search?: string
  ordering?: string
  page?: number
}): Promise<PaginatedResponse<PokemonSet>> {
  const query = filters ? buildQueryString(filters) : ''
  const response = await apiClient.get<PaginatedResponse<PokemonSet>>(`${ENDPOINT}/${query}`)
  return response.data
}

/**
 * Fetch a single Pokemon set by ID
 */
export async function getSetById(id: number): Promise<PokemonSet> {
  const response = await apiClient.get<PokemonSet>(`${ENDPOINT}/${id}/`)
  return response.data
}

/**
 * Create a new Pokemon set
 */
export async function createSet(data: PokemonSetInput): Promise<PokemonSet> {
  const response = await apiClient.post<PokemonSet>(`${ENDPOINT}/`, data)
  return response.data
}

/**
 * Update an existing Pokemon set
 */
export async function updateSet(id: number, data: Partial<PokemonSetInput>): Promise<PokemonSet> {
  const response = await apiClient.patch<PokemonSet>(`${ENDPOINT}/${id}/`, data)
  return response.data
}

/**
 * Delete a Pokemon set
 */
export async function deleteSet(id: number): Promise<void> {
  await apiClient.delete(`${ENDPOINT}/${id}/`)
}

/**
 * Fetch all cards in a specific set
 */
export async function getSetCards(
  setId: number,
  page?: number
): Promise<PaginatedResponse<Card>> {
  const query = page ? `?page=${page}` : ''
  const response = await apiClient.get<PaginatedResponse<Card>>(
    `${ENDPOINT}/${setId}/cards/${query}`
  )
  return response.data
}

/**
 * Fetch aggregate statistics for sets
 */
export async function getSetStats(): Promise<SetStats> {
  const response = await apiClient.get<SetStats>(`${ENDPOINT}/stats/`)
  return response.data
}

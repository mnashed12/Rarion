/**
 * Axios instance configured for the Pokemon Inventory API
 * 
 * Provides centralized configuration for:
 * - Base URL from environment variables
 * - Request/response interceptors
 * - Error handling
 * - CSRF token handling
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'

// Get API URL from environment variables
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

/**
 * Create and configure axios instance
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
  // Send cookies with requests (for session auth)
  withCredentials: true,
})

/**
 * Get CSRF token from cookies
 */
function getCsrfToken(): string | null {
  const name = 'csrftoken'
  const cookies = document.cookie.split(';')
  
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=')
    if (cookieName === name) {
      return cookieValue
    }
  }
  
  return null
}

/**
 * Request interceptor
 * - Adds CSRF token to non-GET requests
 * - Adds authorization header if token exists
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add CSRF token for state-changing requests
    if (config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
      const csrfToken = getCsrfToken()
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken
      }
    }
    
    // Log requests in development
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`)
    }
    
    return config
  },
  (error: AxiosError) => {
    console.error('[API] Request error:', error)
    return Promise.reject(error)
  }
)

/**
 * Response interceptor
 * - Handles common error responses
 * - Transforms error messages
 */
apiClient.interceptors.response.use(
  (response) => {
    // Log responses in development
    if (import.meta.env.DEV) {
      console.log(`[API] Response ${response.status}:`, response.config.url)
    }
    
    return response
  },
  (error: AxiosError) => {
    // Handle specific error codes
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 400:
          console.error('[API] Bad Request:', data)
          break
        case 401:
          console.error('[API] Unauthorized - Please log in')
          // Could redirect to login here
          break
        case 403:
          console.error('[API] Forbidden - Access denied')
          break
        case 404:
          console.error('[API] Not Found:', error.config?.url)
          break
        case 500:
          console.error('[API] Server Error')
          break
        default:
          console.error(`[API] Error ${status}:`, data)
      }
    } else if (error.request) {
      console.error('[API] No response received:', error.message)
    } else {
      console.error('[API] Request setup error:', error.message)
    }
    
    return Promise.reject(error)
  }
)

export default apiClient

/**
 * Helper to build query string from filter object
 */
export function buildQueryString<T extends object>(filters: T): string {
  const params = new URLSearchParams()
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        // Handle array values (e.g., rarity_in)
        value.forEach((v) => params.append(key, String(v)))
      } else {
        params.append(key, String(value))
      }
    }
  })
  
  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

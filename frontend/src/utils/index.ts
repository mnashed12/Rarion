/**
 * Utility Functions
 * 
 * Common utility functions used throughout the application.
 */

/**
 * Format a number as currency (USD)
 */
export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '--'
  
  const num = typeof value === 'string' ? parseFloat(value) : value
  
  if (isNaN(num)) return '--'
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num)
}

/**
 * Format a date string to a readable format
 */
export function formatDate(
  dateString: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
): string {
  if (!dateString) return '--'
  
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', options).format(date)
  } catch {
    return '--'
  }
}

/**
 * Format a date with time
 */
export function formatDateTime(dateString: string | null | undefined): string {
  return formatDate(dateString, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(
  oldValue: number,
  newValue: number
): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0
  return ((newValue - oldValue) / oldValue) * 100
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Capitalize the first letter of each word
 */
export function capitalizeWords(text: string): string {
  return text
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Convert snake_case to Title Case
 */
export function snakeToTitleCase(text: string): string {
  return text
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Get CSS class for rarity badge
 */
export function getRarityClass(rarity: string): string {
  const classes: Record<string, string> = {
    common: 'badge-common',
    uncommon: 'badge-uncommon',
    rare: 'badge-rare',
    holo_rare: 'badge-holo',
    ultra_rare: 'badge-ultra',
    secret_rare: 'badge-secret',
  }
  return classes[rarity] || 'badge-common'
}

/**
 * Get CSS class for condition indicator
 */
export function getConditionClass(condition: string): string {
  const classes: Record<string, string> = {
    mint: 'text-green-600 bg-green-100',
    near_mint: 'text-green-500 bg-green-50',
    lightly_played: 'text-yellow-600 bg-yellow-100',
    moderately_played: 'text-orange-500 bg-orange-50',
    heavily_played: 'text-orange-600 bg-orange-100',
    damaged: 'text-red-600 bg-red-100',
  }
  return classes[condition] || 'text-gray-600 bg-gray-100'
}

/**
 * Debounce function for rate limiting
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Check if an object is empty
 */
export function isEmpty(obj: Record<string, unknown>): boolean {
  return Object.keys(obj).length === 0
}

/**
 * Remove undefined and null values from an object
 */
export function cleanObject<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const cleaned: Partial<T> = {}
  
  for (const key in obj) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      cleaned[key] = obj[key]
    }
  }
  
  return cleaned
}

/**
 * Generate a random ID (for temporary keys)
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

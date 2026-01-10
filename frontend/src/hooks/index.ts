/**
 * Custom React Hooks
 * 
 * Re-exports all custom hooks.
 * Add hooks here as they are created.
 */

// Placeholder exports for future hooks
// export { useCards } from './useCards'
// export { useInventory } from './useInventory'
// export { useStreams } from './useStreams'
// export { usePagination } from './usePagination'
// export { useDebounce } from './useDebounce'
// export { useLocalStorage } from './useLocalStorage'

/**
 * Example: useDebounce hook
 * Delays updating a value until after a specified delay.
 */
import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Example: useLocalStorage hook
 * Syncs state with localStorage.
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = (value: T) => {
    try {
      setStoredValue(value)
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue]
}

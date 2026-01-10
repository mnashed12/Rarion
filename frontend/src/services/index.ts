/**
 * Services Index
 * 
 * Re-exports all API service functions for convenient imports.
 * 
 * Usage:
 * import { getCards, getInventoryItems } from '@/services'
 */

// API Client
export { default as apiClient, buildQueryString } from './api'

// Pokemon Sets
export {
  getSets,
  getSetById,
  createSet,
  updateSet,
  deleteSet,
  getSetCards,
  getSetStats,
} from './sets'

// Cards
export {
  getCards,
  getCardById,
  createCard,
  updateCard,
  deleteCard,
  getCardInventory,
  uploadCardImage,
  searchCards,
} from './cards'

// Inventory
export {
  getInventoryItems,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  adjustInventoryQuantity,
  getInventoryStats,
  getLowStockItems,
  getOutOfStockItems,
  getInventoryItemBySku,
  bulkUpdatePrices,
} from './inventory'

// Streams
export {
  getStreamEvents,
  getStreamEventById,
  createStreamEvent,
  updateStreamEvent,
  deleteStreamEvent,
  getStreamInventory,
  getStreamStats,
  getStreamInventoryLinks,
  getStreamInventoryLinkById,
  addItemToStream,
  updateStreamInventoryLink,
  removeItemFromStream,
  recordSale,
  toggleFeatured,
} from './streams'

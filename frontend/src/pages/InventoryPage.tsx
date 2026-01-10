/**
 * Inventory Page
 * 
 * Page for viewing and managing inventory items.
 * TODO: Implement inventory table, filters, and CRUD operations.
 */

import { Package, Plus, Search, Filter, Download } from 'lucide-react'

function InventoryPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">
            Track your Pokemon card inventory
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-outline flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Item
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-card p-4">
          <p className="text-sm text-gray-500">Total Items</p>
          <p className="text-2xl font-bold text-gray-900">--</p>
        </div>
        <div className="bg-white rounded-lg shadow-card p-4">
          <p className="text-sm text-gray-500">Total Quantity</p>
          <p className="text-2xl font-bold text-gray-900">--</p>
        </div>
        <div className="bg-white rounded-lg shadow-card p-4">
          <p className="text-sm text-gray-500">Total Value</p>
          <p className="text-2xl font-bold text-green-600">$--</p>
        </div>
        <div className="bg-white rounded-lg shadow-card p-4">
          <p className="text-sm text-gray-500">Low Stock</p>
          <p className="text-2xl font-bold text-yellow-600">--</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by SKU, card name, or location..."
              className="input pl-10"
            />
          </div>
          <select className="input w-auto">
            <option value="">All Conditions</option>
            <option value="mint">Mint</option>
            <option value="near_mint">Near Mint</option>
            <option value="lightly_played">Lightly Played</option>
            <option value="moderately_played">Moderately Played</option>
            <option value="heavily_played">Heavily Played</option>
            <option value="damaged">Damaged</option>
          </select>
          <button className="btn-outline flex items-center gap-2">
            <Filter className="w-5 h-5" />
            More Filters
          </button>
        </div>
      </div>

      {/* Inventory Table Placeholder */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <div className="p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Package className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Inventory Items
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Add cards to your inventory to start tracking quantities,
            prices, and conditions.
          </p>
          <button className="btn-primary">
            Add Inventory Item
          </button>
        </div>
      </div>

      {/* TODO: Implement these features:
          - Inventory table with sorting
          - Pagination
          - Filter by condition, price range, stock level
          - Quick quantity adjustment
          - Bulk actions
          - Add/Edit inventory form
          - Delete confirmation
          - Export to CSV
          - Profit/loss calculations
      */}
    </div>
  )
}

export default InventoryPage

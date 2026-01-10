/**
 * Cards Page
 * 
 * Page for viewing and managing Pokemon cards.
 * TODO: Implement card grid, filters, and CRUD operations.
 */

import { CreditCard, Plus, Search, Filter } from 'lucide-react'

function CardsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Cards</h1>
          <p className="page-subtitle">
            Manage your Pokemon card database
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Card
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search cards by name..."
              className="input pl-10"
            />
          </div>
          <button className="btn-outline flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </div>
      </div>

      {/* Cards Grid Placeholder */}
      <div className="bg-white rounded-lg shadow-card p-12 text-center">
        <div className="text-gray-400 mb-4">
          <CreditCard className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Cards Yet
        </h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Start building your card database by adding Pokemon cards.
          You can also import cards from a CSV file using the management command.
        </p>
        <button className="btn-primary">
          Add Your First Card
        </button>
      </div>

      {/* TODO: Implement these features:
          - Card grid with images
          - Pagination
          - Filter by set, rarity, type
          - Search functionality
          - Card detail modal
          - Add/Edit card form
          - Delete confirmation
          - Image upload
      */}
    </div>
  )
}

export default CardsPage

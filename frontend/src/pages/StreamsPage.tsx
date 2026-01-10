/**
 * Streams Page
 * 
 * Page for viewing and managing stream events.
 * TODO: Implement stream list, stream detail, and CRUD operations.
 */

import { Video, Plus, Calendar, Users } from 'lucide-react'

function StreamsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Streams</h1>
          <p className="page-subtitle">
            Manage your live stream events
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Stream
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-card p-4">
          <p className="text-sm text-gray-500">Total Streams</p>
          <p className="text-2xl font-bold text-gray-900">--</p>
        </div>
        <div className="bg-white rounded-lg shadow-card p-4">
          <p className="text-sm text-gray-500">This Month</p>
          <p className="text-2xl font-bold text-gray-900">--</p>
        </div>
        <div className="bg-white rounded-lg shadow-card p-4">
          <p className="text-sm text-gray-500">Items Shown</p>
          <p className="text-2xl font-bold text-blue-600">--</p>
        </div>
        <div className="bg-white rounded-lg shadow-card p-4">
          <p className="text-sm text-gray-500">Items Sold</p>
          <p className="text-2xl font-bold text-green-600">--</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <select className="input w-auto">
            <option value="">All Platforms</option>
            <option value="twitch">Twitch</option>
            <option value="youtube">YouTube</option>
            <option value="other">Other</option>
          </select>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <input
              type="date"
              className="input w-auto"
              placeholder="From date"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              className="input w-auto"
              placeholder="To date"
            />
          </div>
        </div>
      </div>

      {/* Stream List Placeholder */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <div className="p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Video className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Stream Events
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Create stream events to track which cards you show and sell
            during your live streams.
          </p>
          <button className="btn-primary">
            Create Your First Stream
          </button>
        </div>
      </div>

      {/* Upcoming Streams Placeholder */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Upcoming Streams
        </h2>
        <div className="bg-gray-100 rounded-lg p-6 text-center text-gray-500">
          <p>No upcoming streams scheduled</p>
        </div>
      </div>

      {/* TODO: Implement these features:
          - Stream list with cards
          - Stream detail view with inventory
          - Create/Edit stream form
          - Add inventory to stream
          - Mark items as sold
          - Feature items
          - Stream analytics
          - Calendar view
      */}
    </div>
  )
}

export default StreamsPage

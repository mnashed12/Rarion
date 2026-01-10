/**
 * Home Page / Dashboard
 * 
 * Main landing page with overview statistics and quick actions.
 */

import { Link } from 'react-router-dom'
import { 
  CreditCard, 
  Package, 
  Video, 
  TrendingUp,
  AlertTriangle,
  ArrowRight
} from 'lucide-react'

/**
 * Dashboard stat card component
 */
interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
  link?: string
}

function StatCard({ title, value, icon, color, link }: StatCardProps) {
  const content = (
    <div className={`bg-white rounded-lg shadow-card p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className="text-gray-400">{icon}</div>
      </div>
    </div>
  )

  if (link) {
    return <Link to={link} className="block hover:shadow-card-hover transition-shadow">{content}</Link>
  }
  
  return content
}

/**
 * Quick action button component
 */
interface QuickActionProps {
  title: string
  description: string
  icon: React.ReactNode
  link: string
}

function QuickAction({ title, description, icon, link }: QuickActionProps) {
  return (
    <Link
      to={link}
      className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-card hover:shadow-card-hover transition-shadow group"
    >
      <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
    </Link>
  )
}

function HomePage() {
  // TODO: Fetch actual stats from API using React Query
  // For now, display placeholder data
  
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Welcome to your Pokemon Card Inventory Tracker
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Cards"
          value="--"
          icon={<CreditCard className="w-8 h-8" />}
          color="border-blue-500"
          link="/cards"
        />
        <StatCard
          title="Inventory Items"
          value="--"
          icon={<Package className="w-8 h-8" />}
          color="border-green-500"
          link="/inventory"
        />
        <StatCard
          title="Total Value"
          value="$--"
          icon={<TrendingUp className="w-8 h-8" />}
          color="border-purple-500"
        />
        <StatCard
          title="Stream Events"
          value="--"
          icon={<Video className="w-8 h-8" />}
          color="border-orange-500"
          link="/streams"
        />
      </div>

      {/* Alerts Section */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-800">Getting Started</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Connect your backend and run migrations to start tracking your Pokemon cards.
              See the README for setup instructions.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuickAction
            title="Add New Card"
            description="Add a Pokemon card to your database"
            icon={<CreditCard className="w-6 h-6" />}
            link="/cards"
          />
          <QuickAction
            title="Add Inventory"
            description="Add cards to your inventory"
            icon={<Package className="w-6 h-6" />}
            link="/inventory"
          />
          <QuickAction
            title="New Stream"
            description="Create a new stream event"
            icon={<Video className="w-6 h-6" />}
            link="/streams"
          />
          <QuickAction
            title="View Low Stock"
            description="Check items running low"
            icon={<AlertTriangle className="w-6 h-6" />}
            link="/inventory?in_stock=true&max_quantity=2"
          />
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="bg-white rounded-lg shadow-card p-8 text-center">
          <div className="text-gray-400 mb-2">
            <Package className="w-12 h-12 mx-auto" />
          </div>
          <p className="text-gray-500">
            No recent activity. Start by adding some cards to your inventory!
          </p>
        </div>
      </div>
    </div>
  )
}

export default HomePage

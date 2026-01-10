/**
 * 404 Not Found Page
 * 
 * Displayed when a user navigates to a non-existent route.
 */

import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
      {/* 404 Text */}
      <h1 className="text-9xl font-bold text-gray-200">404</h1>
      
      {/* Message */}
      <h2 className="text-2xl font-semibold text-gray-900 mt-4">
        Page Not Found
      </h2>
      <p className="text-gray-500 mt-2 max-w-md">
        The page you're looking for doesn't exist or has been moved.
        Let's get you back on track!
      </p>
      
      {/* Actions */}
      <div className="flex gap-4 mt-8">
        <button
          onClick={() => window.history.back()}
          className="btn-outline flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Go Back
        </button>
        <Link to="/" className="btn-primary flex items-center gap-2">
          <Home className="w-5 h-5" />
          Home
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage

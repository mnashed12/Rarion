import { Routes, Route } from 'react-router-dom'

// Pages (to be implemented)
import HomePage from './pages/HomePage'
import CardsPage from './pages/CardsPage'
import InventoryPage from './pages/InventoryPage'
import StreamsPage from './pages/StreamsPage'
import NotFoundPage from './pages/NotFoundPage'

// Layout components
import Layout from './components/common/Layout'
import { AppProtectedRoute } from './components/common/AppProtectedRoute'
import { InventoryProtectedRoute } from './components/common/InventoryProtectedRoute'

/**
 * Main App component with routing configuration.
 * 
 * Route structure:
 * - / : Home page with dashboard
 * - /cards : Card listing and management
 * - /inventory : Inventory management (password protected)
 * - /streams : Stream event management
 * - * : 404 Not Found
 */
function App() {
  return (
    <AppProtectedRoute>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cards" element={<CardsPage />} />
          <Route 
            path="/inventory" 
            element={
              <InventoryProtectedRoute>
                <InventoryPage />
              </InventoryProtectedRoute>
            } 
          />
          <Route path="/streams" element={<StreamsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
    </AppProtectedRoute>
  )
}

export default App

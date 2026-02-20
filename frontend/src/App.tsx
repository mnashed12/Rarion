import { Routes, Route } from 'react-router-dom'

// Pages (to be implemented)
import HomePage from './pages/HomePage'
import CardsPage from './pages/CardsPage'
import DecksPage from './pages/DecksPage'
import InventoryPage from './pages/InventoryPage'
import StreamsPage from './pages/StreamsPage'
import NotFoundPage from './pages/NotFoundPage'

// Layout components
import Layout from './components/common/Layout'
import { InventoryProtectedRoute } from './components/common/InventoryProtectedRoute'
import AdminLoginPage from './pages/AdminLoginPage'

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
    <Routes>
      {/* Secret admin login — no layout wrapper, not linked anywhere */}
      <Route path="/mx" element={<AdminLoginPage />} />

      {/* Public site */}
      <Route path="/*" element={
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/cards" element={<CardsPage />} />
            <Route path="/decks" element={<DecksPage />} />
            <Route
              path="/inventory"
              element={
                <InventoryProtectedRoute>
                  <InventoryPage />
                </InventoryProtectedRoute>
              }
            />
            <Route path="/streams" element={
              <InventoryProtectedRoute>
                <StreamsPage />
              </InventoryProtectedRoute>
            } />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      } />
    </Routes>
  )
}

export default App

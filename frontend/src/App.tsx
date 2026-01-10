import { Routes, Route } from 'react-router-dom'

// Pages (to be implemented)
import HomePage from './pages/HomePage'
import CardsPage from './pages/CardsPage'
import InventoryPage from './pages/InventoryPage'
import StreamsPage from './pages/StreamsPage'
import NotFoundPage from './pages/NotFoundPage'

// Layout components
import Layout from './components/common/Layout'

/**
 * Main App component with routing configuration.
 * 
 * Route structure:
 * - / : Home page with dashboard
 * - /cards : Card listing and management
 * - /inventory : Inventory management
 * - /streams : Stream event management
 * - * : 404 Not Found
 */
function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/cards" element={<CardsPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/streams" element={<StreamsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  )
}

export default App

import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '@/components/AppLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import Setup from '@/pages/Setup'
import Checkout from '@/pages/Checkout'
import Orders from '@/pages/Orders'
import Products from '@/pages/Products'
import Categories from '@/pages/Categories'
import Customers from '@/pages/Customers'
import Dashboard from '@/pages/Dashboard'
import Settings from '@/pages/Settings'
import NotFound from '@/pages/NotFound'

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login"  element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected: store picker + setup */}
      <Route path="/" element={
        <ProtectedRoute><Home /></ProtectedRoute>
      } />
      <Route path="/setup" element={
        <ProtectedRoute><Setup /></ProtectedRoute>
      } />

      {/* Protected: POS app */}
      <Route path="/pos" element={
        <ProtectedRoute><AppLayout /></ProtectedRoute>
      }>
        <Route index         element={<Checkout />} />
        <Route path="orders"     element={<Orders />} />
        <Route path="products"   element={<Products />} />
        <Route path="categories" element={<Categories />} />
        <Route path="customers"  element={<Customers />} />
        <Route path="dashboard"  element={<Dashboard />} />
        <Route path="settings"   element={<Settings />} />
      </Route>

      <Route path="/index.html" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App

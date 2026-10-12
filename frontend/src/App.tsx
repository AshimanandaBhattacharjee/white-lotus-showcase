import { Link, Route, Routes } from 'react-router-dom'

import Layout from './components/Layout'
import { EmptyState } from './components/States'
import ListingsPage from './pages/ListingsPage'
import PropertyDetailPage from './pages/PropertyDetailPage'
import AdminInquiriesPage from './pages/admin/AdminInquiriesPage'
import AdminLayout from './pages/admin/AdminLayout'
import AdminPropertiesPage from './pages/admin/AdminPropertiesPage'
import PropertyFormPage from './pages/admin/PropertyFormPage'

function NotFound() {
  return (
    <EmptyState title="Page not found">
      <Link to="/" className="text-lotus underline">
        Back to residences
      </Link>
    </EmptyState>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<ListingsPage />} />
        <Route path="properties/:id" element={<PropertyDetailPage />} />
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminPropertiesPage />} />
          <Route path="inquiries" element={<AdminInquiriesPage />} />
          <Route path="properties/new" element={<PropertyFormPage />} />
          <Route path="properties/:id/edit" element={<PropertyFormPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

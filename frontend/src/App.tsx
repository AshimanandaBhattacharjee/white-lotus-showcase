import { Link, Route, Routes } from 'react-router-dom'

import Layout from './components/Layout'
import { EmptyState } from './components/States'
import ListingsPage from './pages/ListingsPage'
import PropertyDetailPage from './pages/PropertyDetailPage'

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
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

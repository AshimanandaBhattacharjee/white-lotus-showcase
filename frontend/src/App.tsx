import { Link, Route, Routes } from 'react-router-dom'

import Layout from './components/Layout'
import { EmptyState } from './components/States'

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
        <Route index element={<p>Listings coming next.</p>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

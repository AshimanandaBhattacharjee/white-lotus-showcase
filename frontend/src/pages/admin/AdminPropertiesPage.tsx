import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { api, ApiError } from '../../api'
import { EmptyState, ErrorState, Spinner } from '../../components/States'
import { formatPrice, formatSqft } from '../../format'
import type { Property } from '../../types'
import { useApi } from '../../useApi'
import { useAdmin } from './AdminLayout'

export default function AdminPropertiesPage() {
  const { signOut } = useAdmin()
  const listings = useApi(() => api.listProperties({ sort: 'newest' }), [])
  const [deletingId, setDeletingId] = useState<number | null>(null)
  // A save on the form page navigates here with a notice in history state.
  const location = useLocation()
  const navigate = useNavigate()
  const [notice, setNotice] = useState<string>(location.state?.notice ?? '')

  // Drop the notice from history so a page refresh doesn't show it again.
  useEffect(() => {
    if (location.state?.notice) navigate('.', { replace: true, state: null })
  }, [location.state, navigate])

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(''), 4000)
    return () => clearTimeout(t)
  }, [notice])

  async function onDelete(p: Property) {
    if (!window.confirm(`Delete "${p.name}"? Buyer inquiries for it will be kept.`)) return
    setDeletingId(p.id)
    try {
      await api.deleteProperty(p.id)
      listings.setData((list) => list?.filter((x) => x.id !== p.id) ?? null)
      setNotice(`Deleted ${p.name}.`)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return signOut()
      setNotice(`Could not delete ${p.name}: ${(err as Error).message}`)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-stone">
          {listings.data ? `${listings.data.length} listed` : ''}
        </p>
        <Link to="/admin/properties/new" className="btn-primary">
          Add residence
        </Link>
      </div>

      {notice && (
        <p role="status" className="mt-4 rounded-md bg-blush px-4 py-3 text-sm">
          {notice}
        </p>
      )}

      <div className="mt-4">
        {listings.loading ? (
          <Spinner label="Loading listings" />
        ) : listings.error ? (
          <ErrorState message={listings.error.message} onRetry={listings.reload} />
        ) : !listings.data?.length ? (
          <EmptyState title="No residences listed yet">
            <Link to="/admin/properties/new" className="text-lotus underline">
              Add the first residence
            </Link>
          </EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-md border border-reed bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-reed text-stone">
                <tr>
                  <th className="px-4 py-3 font-medium">Residence</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 text-right font-medium">Price</th>
                  <th className="px-4 py-3 text-right font-medium">Size</th>
                  <th className="px-4 py-3 text-right font-medium">Beds</th>
                  <th className="px-4 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {listings.data.map((p) => (
                  <tr key={p.id} className="border-b border-reed last:border-0">
                    <td className="px-4 py-3">
                      <Link to={`/properties/${p.id}`} className="font-medium hover:text-lotus">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-stone">{p.location}</td>
                    <td className="px-4 py-3 text-right">{formatPrice(p.price)}</td>
                    <td className="px-4 py-3 text-right text-stone">{formatSqft(p.size_sqft)}</td>
                    <td className="px-4 py-3 text-right">{p.bedrooms}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-4">
                        <Link to={`/admin/properties/${p.id}/edit`} className="text-lotus hover:underline">
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => onDelete(p)}
                          disabled={deletingId === p.id}
                          className="text-danger hover:underline disabled:opacity-50"
                        >
                          {deletingId === p.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

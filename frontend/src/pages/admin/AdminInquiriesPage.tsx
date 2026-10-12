import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { api } from '../../api'
import { EmptyState, ErrorState, Spinner } from '../../components/States'
import { formatDate, plural } from '../../format'
import { useApi } from '../../useApi'
import { useAdmin } from './AdminLayout'

const REMOVED = 'removed'

export default function AdminInquiriesPage() {
  const { signOut } = useAdmin()
  const inquiries = useApi(() => api.listInquiries(), [])
  const [propertyFilter, setPropertyFilter] = useState('')

  useEffect(() => {
    if (inquiries.error?.status === 401) signOut()
  }, [inquiries.error, signOut])

  // Properties that actually have inquiries, for the filter dropdown.
  const propertyOptions = useMemo(() => {
    const seen = new Map<string, string>()
    for (const i of inquiries.data ?? []) {
      if (i.property_id === null) seen.set(REMOVED, 'Removed listings')
      else seen.set(String(i.property_id), i.property_name ?? '')
    }
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [inquiries.data])

  const visible = (inquiries.data ?? []).filter((i) =>
    !propertyFilter ? true : propertyFilter === REMOVED ? i.property_id === null : String(i.property_id) === propertyFilter,
  )

  if (inquiries.loading) return <Spinner label="Loading inquiries" />
  if (inquiries.error) return <ErrorState message={inquiries.error.message} onRetry={inquiries.reload} />
  if (!inquiries.data?.length) {
    return (
      <EmptyState title="No inquiries yet">
        Inquiries appear here when a buyer sends the form on a residence page.
      </EmptyState>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="text-sm text-stone">
          {plural(visible.length, 'inquiry', 'inquiries')}, newest first
        </p>
        <div className="flex items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block font-medium">Residence</span>
            <select className="field-input" value={propertyFilter} onChange={(e) => setPropertyFilter(e.target.value)}>
              <option value="">All residences</option>
              {propertyOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="btn-secondary" onClick={inquiries.reload}>
            Refresh
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-md border border-reed bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-reed text-stone">
            <tr>
              <th className="px-4 py-3 font-medium">Received</th>
              <th className="px-4 py-3 font-medium">Residence</th>
              <th className="px-4 py-3 font-medium">Buyer</th>
              <th className="px-4 py-3 font-medium">Message</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((i) => (
              <tr key={i.id} className="border-b border-reed align-top last:border-0">
                <td className="whitespace-nowrap px-4 py-3 text-stone">{formatDate(i.created_at)}</td>
                <td className="px-4 py-3">
                  {i.property_id !== null ? (
                    <Link to={`/properties/${i.property_id}`} className="font-medium hover:text-lotus">
                      {i.property_name}
                    </Link>
                  ) : (
                    <span className="text-stone italic">Listing removed</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{i.name}</p>
                  <a href={`mailto:${i.email}`} className="block text-lotus hover:underline">
                    {i.email}
                  </a>
                  <a href={`tel:${i.phone.replace(/[^\d+]/g, '')}`} className="block text-stone hover:text-pond">
                    {i.phone}
                  </a>
                </td>
                <td className="max-w-md whitespace-pre-line px-4 py-3">{i.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

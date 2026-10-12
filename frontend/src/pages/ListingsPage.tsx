import { Link, useSearchParams } from 'react-router-dom'

import { api } from '../api'
import PropertyImage from '../components/PropertyImage'
import { EmptyState, ErrorState, Spinner } from '../components/States'
import { formatPrice, formatSqft, plural } from '../format'
import type { Property, SortOption } from '../types'
import { useApi } from '../useApi'

const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Newest first',
  price_asc: 'Price: low to high',
  price_desc: 'Price: high to low',
  size_desc: 'Largest first',
}

export default function ListingsPage() {
  // Filters live in the URL, so a filtered view can be shared or bookmarked.
  const [params, setParams] = useSearchParams()
  const location = params.get('location') ?? ''
  const minBedrooms = Number(params.get('min_bedrooms') ?? 0)
  const sort = (params.get('sort') as SortOption) || 'newest'
  const hasFilters = Boolean(location || minBedrooms || params.get('sort'))

  const listings = useApi(
    () => api.listProperties({ location, min_bedrooms: minBedrooms, sort }),
    [location, minBedrooms, sort],
  )
  const locations = useApi(() => api.listLocations(), [])

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  return (
    <div>
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl sm:text-4xl">Residences in Bengaluru</h1>
        <p className="mt-2 text-stone">Homes currently available to show buyers. Open one for the full details.</p>
      </div>

      <form
        className="mt-8 grid gap-3 border-y border-reed py-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
        onSubmit={(e) => e.preventDefault()}
        aria-label="Filter residences"
      >
        <label className="text-sm">
          <span className="mb-1 block font-medium">Location</span>
          <select className="field-input" value={location} onChange={(e) => setFilter('location', e.target.value)}>
            <option value="">All locations</option>
            {(locations.data ?? []).map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Bedrooms</span>
          <select
            className="field-input"
            value={minBedrooms || ''}
            onChange={(e) => setFilter('min_bedrooms', e.target.value)}
          >
            <option value="">Any</option>
            {[2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} or more
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Sort by</span>
          <select className="field-input" value={sort} onChange={(e) => setFilter('sort', e.target.value)}>
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn-secondary"
          disabled={!hasFilters}
          onClick={() => setParams({}, { replace: true })}
        >
          Clear filters
        </button>
      </form>

      <section className="mt-8" aria-live="polite">
        {listings.loading && !listings.data ? (
          <Spinner label="Loading residences" />
        ) : listings.error ? (
          <ErrorState message={listings.error.message} onRetry={listings.reload} />
        ) : listings.data && listings.data.length === 0 ? (
          hasFilters ? (
            <EmptyState title="No residences match these filters">
              <button type="button" className="text-lotus underline" onClick={() => setParams({}, { replace: true })}>
                Clear filters
              </button>
            </EmptyState>
          ) : (
            <EmptyState title="No residences listed yet">
              Add the first one from the{' '}
              <Link to="/admin/properties/new" className="text-lotus underline">
                sales desk
              </Link>
              .
            </EmptyState>
          )
        ) : (
          <>
            <p className="mb-5 text-sm text-stone">
              {plural(listings.data?.length ?? 0, 'residence')}
              {listings.loading && ', updating…'}
            </p>
            <ul className={`grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 ${listings.loading ? 'opacity-60' : ''}`}>
              {listings.data?.map((p) => (
                <li key={p.id}>
                  <ListingCard property={p} />
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  )
}

function ListingCard({ property: p }: { property: Property }) {
  return (
    <Link to={`/properties/${p.id}`} className="group block">
      <PropertyImage src={p.image_url} alt={p.name} className="aspect-[4/3] w-full rounded-md" />
      <div className="mt-4 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-xl group-hover:text-lotus">{p.name}</h2>
        <p className="shrink-0 font-display text-xl">{formatPrice(p.price)}</p>
      </div>
      <p className="mt-1 text-sm text-stone">
        {p.location}, {plural(p.bedrooms, 'bedroom')}, {formatSqft(p.size_sqft)}
      </p>
      <p className="mt-2 line-clamp-2 text-sm text-pond-soft">{p.description}</p>
    </Link>
  )
}

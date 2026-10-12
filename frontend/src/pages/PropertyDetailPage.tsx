import { Link, useParams } from 'react-router-dom'

import { api } from '../api'
import InquiryForm from '../components/InquiryForm'
import PropertyImage from '../components/PropertyImage'
import { EmptyState, ErrorState, Spinner } from '../components/States'
import { formatPrice, formatPriceFull, formatSqft } from '../format'
import { useApi } from '../useApi'

export default function PropertyDetailPage() {
  const id = Number(useParams().id)
  const { data: p, error, loading, reload } = useApi(() => api.getProperty(id), [id])

  if (loading) return <Spinner label="Loading residence" />
  if (error?.status === 404 || Number.isNaN(id)) {
    return (
      <EmptyState title="This residence is no longer listed">
        <Link to="/" className="text-lotus underline">
          See all residences
        </Link>
      </EmptyState>
    )
  }
  if (error || !p) return <ErrorState message={error?.message ?? 'Could not load this residence.'} onRetry={reload} />

  const facts = [
    ['Location', p.location],
    ['Price', formatPriceFull(p.price)],
    ['Built-up area', formatSqft(p.size_sqft)],
    ['Price per sq ft', `₹${Math.round(p.price / p.size_sqft).toLocaleString('en-IN')}`],
    ['Bedrooms', String(p.bedrooms)],
    ['Bathrooms', String(p.bathrooms)],
  ]

  return (
    <div>
      <Link to="/" className="text-sm text-stone hover:text-pond">
        All residences
      </Link>

      <div className="mt-4 grid gap-10 lg:grid-cols-[1fr_360px]">
        <article>
          <PropertyImage src={p.image_url} alt={p.name} className="aspect-[3/2] w-full rounded-md" />

          <div className="mt-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <h1 className="font-display text-3xl sm:text-4xl">{p.name}</h1>
            <p className="font-display text-3xl text-lotus">{formatPrice(p.price)}</p>
          </div>
          <p className="mt-1 text-stone">{p.location}, Bengaluru</p>

          <p className="mt-6 max-w-prose leading-relaxed">{p.description}</p>

          <dl className="mt-8 grid grid-cols-2 border-t border-reed sm:grid-cols-3">
            {facts.map(([label, value]) => (
              <div key={label} className="border-b border-reed py-4 pr-4">
                <dt className="text-sm text-stone">{label}</dt>
                <dd className="mt-1 font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </article>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-md border border-reed bg-white p-6">
            <h2 className="font-display text-2xl">Ask about this home</h2>
            <p className="mt-1 mb-5 text-sm text-stone">
              Leave your details and a White Lotus sales advisor will contact you.
            </p>
            <InquiryForm propertyId={p.id} propertyName={p.name} />
          </div>
        </aside>
      </div>
    </div>
  )
}

import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { api, ApiError } from '../../api'
import Field from '../../components/Field'
import PropertyImage from '../../components/PropertyImage'
import { ErrorState, Spinner } from '../../components/States'
import { formatPrice } from '../../format'
import type { FieldErrors, PropertyInput } from '../../types'
import { useAdmin } from './AdminLayout'

// Form state keeps numbers as strings so an empty box stays empty
// instead of turning into 0.
type FormValues = Record<keyof PropertyInput, string>

const EMPTY: FormValues = {
  name: '',
  location: '',
  price: '',
  size_sqft: '',
  bedrooms: '',
  bathrooms: '',
  description: '',
  image_url: '',
}

const isWholeNumber = (v: string) => /^\d+$/.test(v.trim())

/** Mirrors backend/app/schemas.py PropertyIn. The server re-checks everything. */
function validate(v: FormValues): FieldErrors {
  const e: FieldErrors = {}
  const required: (keyof FormValues)[] = ['name', 'location', 'price', 'size_sqft', 'bedrooms', 'bathrooms', 'description', 'image_url']
  for (const f of required) if (!v[f].trim()) e[f] = 'This field is required'

  if (v.price.trim() && (!isWholeNumber(v.price) || Number(v.price) <= 0))
    e.price = 'Price must be a positive whole number of rupees'
  if (v.size_sqft.trim() && (!isWholeNumber(v.size_sqft) || Number(v.size_sqft) <= 0))
    e.size_sqft = 'Size must be a positive whole number'
  for (const f of ['bedrooms', 'bathrooms'] as const) {
    if (v[f].trim() && (!isWholeNumber(v[f]) || Number(v[f]) > 50)) e[f] = 'Enter a whole number from 0 to 50'
  }
  if (v.description.trim() && v.description.trim().length < 10)
    e.description = 'Write at least 10 characters'
  if (v.image_url.trim() && !/^https?:\/\/\S+$/i.test(v.image_url.trim()))
    e.image_url = 'Enter a full URL starting with http:// or https://'
  return e
}

function toInput(v: FormValues): PropertyInput {
  return {
    name: v.name.trim(),
    location: v.location.trim(),
    price: Number(v.price),
    size_sqft: Number(v.size_sqft),
    bedrooms: Number(v.bedrooms),
    bathrooms: Number(v.bathrooms),
    description: v.description.trim(),
    image_url: v.image_url.trim(),
  }
}

export default function PropertyFormPage() {
  const { id } = useParams()
  const editingId = id ? Number(id) : null
  const navigate = useNavigate()
  const { signOut } = useAdmin()

  const [values, setValues] = useState<FormValues>(EMPTY)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>(editingId ? 'loading' : 'ready')
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (!editingId) return
    api
      .getProperty(editingId)
      .then((p) => {
        setValues({
          name: p.name,
          location: p.location,
          price: String(p.price),
          size_sqft: String(p.size_sqft),
          bedrooms: String(p.bedrooms),
          bathrooms: String(p.bathrooms),
          description: p.description,
          image_url: p.image_url,
        })
        setLoadState('ready')
      })
      .catch((err: Error) => {
        setLoadError(err instanceof ApiError && err.status === 404 ? 'This residence no longer exists.' : err.message)
        setLoadState('error')
      })
  }, [editingId])

  function update(field: keyof FormValues, value: string) {
    setValues((v) => ({ ...v, [field]: value }))
    if (errors[field]) setErrors(({ [field]: _removed, ...rest }) => rest)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    const clientErrors = validate(values)
    setErrors(clientErrors)
    if (Object.keys(clientErrors).length) {
      setFormError('Please fix the highlighted fields.')
      return
    }

    setSaving(true)
    try {
      const data = toInput(values)
      const saved = editingId ? await api.updateProperty(editingId, data) : await api.createProperty(data)
      navigate('/admin', { state: { notice: `${editingId ? 'Saved changes to' : 'Added'} ${saved.name}.` } })
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return signOut()
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors)
        setFormError(err.message)
      } else {
        setFormError('Something went wrong. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loadState === 'loading') return <Spinner label="Loading residence" />
  if (loadState === 'error') return <ErrorState message={loadError} />

  const input = (field: keyof FormValues) => ({
    id: `property-${field}`,
    value: values[field],
    onChange: (e: { target: { value: string } }) => update(field, e.target.value),
    'aria-invalid': Boolean(errors[field]),
    'aria-describedby': errors[field] ? `property-${field}-error` : undefined,
    className: 'field-input',
  })

  // Typing 72500000 is error-prone; show what the number means as you type.
  const priceHint =
    isWholeNumber(values.price) && Number(values.price) > 0
      ? `That is ${formatPrice(Number(values.price))}`
      : 'In whole rupees, e.g. 72500000 for ₹7.25 Cr'

  return (
    <div className="max-w-3xl">
      <Link to="/admin" className="text-sm text-stone hover:text-pond">
        Back to listings
      </Link>
      <h2 className="mt-3 font-display text-2xl">{editingId ? `Edit ${values.name || 'residence'}` : 'Add a residence'}</h2>

      <form onSubmit={onSubmit} noValidate className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field id="property-name" label="Name" error={errors.name}>
            <input {...input('name')} placeholder="The Lakeview Estate" />
          </Field>
        </div>
        <Field id="property-location" label="Location" error={errors.location} hint="Neighbourhood, e.g. Whitefield">
          <input {...input('location')} />
        </Field>
        <Field id="property-price" label="Price (₹)" error={errors.price} hint={priceHint}>
          <input {...input('price')} inputMode="numeric" />
        </Field>
        <Field id="property-size_sqft" label="Built-up area (sq ft)" error={errors.size_sqft}>
          <input {...input('size_sqft')} inputMode="numeric" />
        </Field>
        <div className="grid grid-cols-2 gap-5">
          <Field id="property-bedrooms" label="Bedrooms" error={errors.bedrooms}>
            <input {...input('bedrooms')} inputMode="numeric" />
          </Field>
          <Field id="property-bathrooms" label="Bathrooms" error={errors.bathrooms}>
            <input {...input('bathrooms')} inputMode="numeric" />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field
            id="property-description"
            label="Description"
            error={errors.description}
            hint="The first two lines appear on the listing card."
          >
            <textarea {...input('description')} rows={5} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field id="property-image_url" label="Photo URL" error={errors.image_url}>
            <input {...input('image_url')} type="url" placeholder="https://…" />
          </Field>
          {/^https?:\/\/\S+$/i.test(values.image_url.trim()) && (
            <PropertyImage
              key={values.image_url}
              src={values.image_url.trim()}
              alt="Photo preview"
              className="mt-3 aspect-[3/2] w-full max-w-sm rounded-md"
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add residence'}
          </button>
          <Link to="/admin" className="btn-secondary">
            Cancel
          </Link>
          {formError && (
            <p role="alert" className="text-sm text-danger">
              {formError}
            </p>
          )}
        </div>
      </form>
    </div>
  )
}

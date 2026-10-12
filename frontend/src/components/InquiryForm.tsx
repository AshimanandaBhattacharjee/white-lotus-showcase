import { useState, type FormEvent } from 'react'

import { api, ApiError } from '../api'
import type { FieldErrors, InquiryInput } from '../types'
import Field from './Field'

const EMPTY: InquiryInput = { name: '', email: '', phone: '', message: '' }

/** Mirrors the backend rules so most mistakes are caught before a round trip.
 *  The server still validates everything; this is only for faster feedback. */
function validate(v: InquiryInput): FieldErrors {
  const errors: FieldErrors = {}
  if (!v.name.trim()) errors.name = 'This field is required'
  if (!v.email.trim()) errors.email = 'This field is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) errors.email = 'Enter a valid email address'
  const digits = v.phone.replace(/\D/g, '')
  if (!v.phone.trim()) errors.phone = 'This field is required'
  else if (!/^\+?[\d\s\-()]+$/.test(v.phone.trim())) errors.phone = 'Phone may only contain digits, spaces, +, - and brackets'
  else if (digits.length < 7 || digits.length > 15) errors.phone = 'Phone must have between 7 and 15 digits'
  if (!v.message.trim()) errors.message = 'This field is required'
  return errors
}

export default function InquiryForm({ propertyId, propertyName }: { propertyId: number; propertyName: string }) {
  const [values, setValues] = useState<InquiryInput>({
    ...EMPTY,
    message: `I'd like to know more about ${propertyName}.`,
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  function update(field: keyof InquiryInput, value: string) {
    setValues((v) => ({ ...v, [field]: value }))
    // Clear a field's error as soon as the user edits it.
    if (errors[field]) setErrors(({ [field]: _removed, ...rest }) => rest)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    const clientErrors = validate(values)
    setErrors(clientErrors)
    if (Object.keys(clientErrors).length) return

    setSubmitting(true)
    try {
      await api.createInquiry(propertyId, values)
      setSentTo(values.email.trim())
      setValues({ ...EMPTY, message: '' })
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors)
        setFormError(err.message)
      } else {
        setFormError('Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (sentTo) {
    return (
      <div className="rounded-md bg-blush p-6" role="status">
        <p className="font-display text-xl">Inquiry sent</p>
        <p className="mt-2 text-pond-soft">
          The White Lotus sales team will get back to you at <strong>{sentTo}</strong>.
        </p>
        <button type="button" className="btn-secondary mt-4" onClick={() => setSentTo(null)}>
          Send another inquiry
        </button>
      </div>
    )
  }

  const input = (field: keyof InquiryInput) => ({
    id: `inquiry-${field}`,
    value: values[field],
    onChange: (e: { target: { value: string } }) => update(field, e.target.value),
    'aria-invalid': Boolean(errors[field]),
    'aria-describedby': errors[field] ? `inquiry-${field}-error` : undefined,
    className: 'field-input',
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <Field id="inquiry-name" label="Your name" error={errors.name}>
        <input {...input('name')} autoComplete="name" />
      </Field>
      <Field id="inquiry-email" label="Email" error={errors.email}>
        <input {...input('email')} type="email" autoComplete="email" />
      </Field>
      <Field id="inquiry-phone" label="Phone" error={errors.phone}>
        <input {...input('phone')} type="tel" autoComplete="tel" placeholder="+91 98765 43210" />
      </Field>
      <Field id="inquiry-message" label="Message" error={errors.message}>
        <textarea {...input('message')} rows={4} />
      </Field>

      {formError && Object.keys(errors).length === 0 && (
        <p role="alert" className="text-sm text-danger">
          {formError}
        </p>
      )}

      <button type="submit" className="btn-primary w-full" disabled={submitting}>
        {submitting ? 'Sending…' : 'Send inquiry'}
      </button>
    </form>
  )
}

import { useState, type FormEvent } from 'react'
import { NavLink, Outlet, useLocation, useOutletContext } from 'react-router-dom'

import { adminKey, api, ApiError } from '../../api'
import Field from '../../components/Field'

interface AdminContext {
  /** Call when the API answers 401: forgets the key and shows the sign-in form. */
  signOut: () => void
}

export function useAdmin() {
  return useOutletContext<AdminContext>()
}

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `border-b-2 px-1 pb-3 text-sm font-medium ${
    isActive ? 'border-lotus text-pond' : 'border-transparent text-stone hover:text-pond'
  }`

export default function AdminLayout() {
  const [hasKey, setHasKey] = useState(() => Boolean(adminKey.get()))
  // Add/edit pages belong to the Listings tab.
  const onListings = /^\/admin(\/properties\/.*)?$/.test(useLocation().pathname)

  function signOut() {
    adminKey.clear()
    setHasKey(false)
  }

  if (!hasKey) return <AdminKeyForm onSuccess={() => setHasKey(true)} />

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Sales desk</h1>
          <p className="mt-2 text-stone">Manage listings and follow up on buyer inquiries.</p>
        </div>
        <button type="button" className="text-sm text-stone underline hover:text-pond" onClick={signOut}>
          Sign out
        </button>
      </div>

      <nav className="mt-6 flex gap-6 border-b border-reed" aria-label="Sales desk">
        <NavLink to="/admin" className={() => tabClass({ isActive: onListings })}>
          Listings
        </NavLink>
        <NavLink to="/admin/inquiries" className={tabClass}>
          Inquiries
        </NavLink>
      </nav>

      <div className="mt-6">
        <Outlet context={{ signOut } satisfies AdminContext} />
      </div>
    </div>
  )
}

function AdminKeyForm({ onSuccess }: { onSuccess: () => void }) {
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!key.trim()) {
      setError('Enter the sales desk key')
      return
    }
    setChecking(true)
    setError('')
    adminKey.set(key.trim())
    try {
      await api.listInquiries() // cheapest admin-only call: confirms the key works
      onSuccess()
    } catch (err) {
      adminKey.clear()
      setError(err instanceof ApiError && err.status === 401 ? 'That key is not valid' : (err as Error).message)
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm py-8">
      <h1 className="font-display text-3xl">Sales desk</h1>
      <p className="mt-2 text-stone">Enter the team key to manage listings and see inquiries.</p>
      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
        <Field id="admin-key" label="Sales desk key" error={error}>
          <input
            id="admin-key"
            type="password"
            className="field-input"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'admin-key-error' : undefined}
            autoComplete="current-password"
          />
        </Field>
        <button type="submit" className="btn-primary w-full" disabled={checking}>
          {checking ? 'Checking…' : 'Open sales desk'}
        </button>
      </form>
    </div>
  )
}

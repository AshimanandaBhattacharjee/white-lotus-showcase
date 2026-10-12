// Loading, error and empty states, shared by every page.
import type { ReactNode } from 'react'

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 py-12 text-stone">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-reed border-t-pond" />
      <span>{label}…</span>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-md border border-danger/30 bg-white p-6">
      <p className="text-danger">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary mt-4">
          Try again
        </button>
      )}
    </div>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-reed bg-white px-6 py-12 text-center">
      <p className="font-display text-xl">{title}</p>
      {children && <div className="mt-3 text-stone">{children}</div>}
    </div>
  )
}

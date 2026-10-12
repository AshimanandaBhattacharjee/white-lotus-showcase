import { useCallback, useEffect, useState } from 'react'

import { ApiError } from './api'

/**
 * Runs an API call when `deps` change and tracks loading / error / data.
 * A stale-response guard ignores results from an older call that finishes
 * after a newer one (e.g. quickly switching filters).
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [loading, setLoading] = useState(true)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetcher()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof ApiError ? err : new ApiError(0, 'Something went wrong.'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // `fetcher` is a new function every render, so we key on `deps` instead.
  }, [...deps, reloadToken])

  const reload = useCallback(() => setReloadToken((n) => n + 1), [])
  return { data, error, loading, reload, setData }
}

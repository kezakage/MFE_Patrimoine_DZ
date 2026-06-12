import { useEffect, useRef } from 'react'

/**
 * Calls `fn` on an interval (default 15s) to keep a view fresh without a
 * manual reload. Behaviour:
 *  - Does NOT fire on mount — the page's own initial fetch already handles
 *    that (so the loading spinner logic stays untouched).
 *  - Pauses while the browser tab is hidden, and fires once immediately when
 *    the tab regains focus, so the data is up to date the moment the user
 *    comes back without burning requests in the background.
 *
 * `fn` should perform a *silent* refresh (no loading spinner) so the UI does
 * not flash on every tick.
 */
export function usePolling(fn, intervalMs = 15000) {
  const saved = useRef(fn)
  useEffect(() => { saved.current = fn })

  useEffect(() => {
    let timer = null
    const tick = () => { if (!document.hidden) saved.current() }
    const start = () => { if (!timer) timer = setInterval(tick, intervalMs) }
    const stop = () => { clearInterval(timer); timer = null }
    const onVisibility = () => {
      if (document.hidden) {
        stop()
      } else {
        saved.current()
        start()
      }
    }
    start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [intervalMs])
}

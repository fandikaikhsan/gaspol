"use client"

import { useCallback, useSyncExternalStore } from "react"

function subscribe(query: string, callback: () => void) {
  const m = window.matchMedia(query)
  m.addEventListener("change", callback)
  return () => m.removeEventListener("change", callback)
}

function getSnapshot(query: string) {
  return window.matchMedia(query).matches
}

/**
 * Subscribes to matchMedia; server snapshot is `false` (mobile-first).
 */
export function useMediaQuery(query: string): boolean {
  const subscribeOnce = useCallback(
    (cb: () => void) => subscribe(query, cb),
    [query],
  )
  return useSyncExternalStore(
    subscribeOnce,
    () => getSnapshot(query),
    () => false,
  )
}

"use client"

import { useLanguageSync } from "@/hooks/useLanguageSync"

/**
 * Client-side wrapper for the student layout.
 * Syncs the user's language preference from DB → Zustand on mount.
 */
export function StudentLayoutClient({ children }: { children: React.ReactNode }) {
  useLanguageSync()
  return <>{children}</>
}

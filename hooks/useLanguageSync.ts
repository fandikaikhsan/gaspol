"use client"

import { useEffect } from 'react'
import { useLanguageStore } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import type { Locale } from '@/lib/i18n'

/**
 * On mount, fetches the user's language preference from profiles.language
 * and syncs it into the Zustand store.
 * This ensures a returning user on a new device gets their saved language.
 */
export function useLanguageSync() {
  const setLocale = useLanguageStore((s) => s.setLocale)

  useEffect(() => {
    async function syncFromDB() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('language')
        .eq('id', user.id)
        .single()

      // Cast needed until database.types.ts is regenerated after migration
      const profile = data as { language?: string } | null
      if (profile?.language && (profile.language === 'id' || profile.language === 'en')) {
        setLocale(profile.language as Locale)
      }
    }

    syncFromDB()
  }, [setLocale])
}

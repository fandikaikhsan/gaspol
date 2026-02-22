/**
 * useUserPhase Hook
 * Phase 1: Authentication & State Machine
 *
 * Fetches and manages user state from Supabase
 */

'use client'

import { useEffect } from 'react'
import { useUserPhaseStore } from '@/lib/state-machine/user-phase'
import { createClient } from '@/lib/supabase/client'
import type { UserState } from '@/lib/state-machine/user-phase'

export function useUserPhase(userId: string | undefined) {
  const {
    userState,
    isLoading,
    error,
    setUserState,
    setLoading,
    setError,
    canAccessBaseline,
    canAccessPlan,
    canAccessRecycle,
    getCurrentPhaseRoute,
  } = useUserPhaseStore()

  useEffect(() => {
    if (!userId) {
      setUserState(null)
      return
    }

    const fetchUserState = async () => {
      setLoading(true)
      setError(null)

      try {
        const supabase = createClient()
        const { data, error: fetchError } = await supabase
          .from('user_state')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (fetchError) {
          setError(fetchError.message)
          return
        }

        if (data) {
          setUserState(data as UserState)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user state')
      } finally {
        setLoading(false)
      }
    }

    fetchUserState()

    // Set up real-time subscription
    const supabase = createClient()
    const channel = supabase
      .channel('user_state_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_state',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new) {
            setUserState(payload.new as UserState)
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [userId, setUserState, setLoading, setError])

  return {
    userState,
    isLoading,
    error,
    canAccessBaseline: canAccessBaseline(),
    canAccessPlan: canAccessPlan(),
    canAccessRecycle: canAccessRecycle(),
    currentPhaseRoute: getCurrentPhaseRoute(),
  }
}

/**
 * Update user state in database
 */
export async function updateUserState(
  userId: string,
  updates: Partial<UserState>
) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_state')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error

  return data as UserState
}

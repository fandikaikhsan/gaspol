/**
 * User Phase State Machine
 * Phase 1: Authentication & State Machine
 *
 * Manages user progression through the platform:
 * ONBOARDING → BASELINE_ASSESSMENT_IN_PROGRESS → BASELINE_COMPLETE →
 * PLAN_ACTIVE → RECYCLE_UNLOCKED → RECYCLE_ASSESSMENT_IN_PROGRESS
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserPhase =
  | 'ONBOARDING'
  | 'BASELINE_ASSESSMENT_IN_PROGRESS'
  | 'BASELINE_COMPLETE'
  | 'PLAN_ACTIVE'
  | 'RECYCLE_UNLOCKED'
  | 'RECYCLE_ASSESSMENT_IN_PROGRESS'

export interface UserState {
  id: string
  user_id: string
  current_phase: UserPhase
  onboarding_completed_at: string | null
  baseline_started_at: string | null
  baseline_completed_at: string | null
  current_baseline_module_id: string | null
  current_cycle_id: string | null
  cycle_start_date: string | null
  recycle_unlocked_at: string | null
  current_checkpoint_id: string | null
  created_at: string
  updated_at: string
}

interface UserPhaseStore {
  // State
  userState: UserState | null
  isLoading: boolean
  error: string | null

  // Actions
  setUserState: (state: UserState | null) => void
  updatePhase: (phase: UserPhase) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void

  // Helpers
  canAccessBaseline: () => boolean
  canAccessPlan: () => boolean
  canAccessRecycle: () => boolean
  getCurrentPhaseRoute: () => string
}

export const useUserPhaseStore = create<UserPhaseStore>()(
  persist(
    (set, get) => ({
      // Initial state
      userState: null,
      isLoading: false,
      error: null,

      // Actions
      setUserState: (state) => set({ userState: state, error: null }),

      updatePhase: (phase) =>
        set((state) => ({
          userState: state.userState
            ? { ...state.userState, current_phase: phase }
            : null,
        })),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      reset: () =>
        set({
          userState: null,
          isLoading: false,
          error: null,
        }),

      // Helpers
      canAccessBaseline: () => {
        const { userState } = get()
        if (!userState) return false

        return (
          userState.current_phase === 'BASELINE_ASSESSMENT_IN_PROGRESS' ||
          userState.current_phase === 'BASELINE_COMPLETE' ||
          userState.current_phase === 'PLAN_ACTIVE' ||
          userState.current_phase === 'RECYCLE_UNLOCKED' ||
          userState.current_phase === 'RECYCLE_ASSESSMENT_IN_PROGRESS'
        )
      },

      canAccessPlan: () => {
        const { userState } = get()
        if (!userState) return false

        return (
          userState.current_phase === 'PLAN_ACTIVE' ||
          userState.current_phase === 'RECYCLE_UNLOCKED' ||
          userState.current_phase === 'RECYCLE_ASSESSMENT_IN_PROGRESS'
        )
      },

      canAccessRecycle: () => {
        const { userState } = get()
        if (!userState) return false

        return (
          userState.current_phase === 'RECYCLE_UNLOCKED' ||
          userState.current_phase === 'RECYCLE_ASSESSMENT_IN_PROGRESS'
        )
      },

      getCurrentPhaseRoute: () => {
        const { userState } = get()
        if (!userState) return '/onboarding'

        switch (userState.current_phase) {
          case 'ONBOARDING':
            return '/onboarding'
          case 'BASELINE_ASSESSMENT_IN_PROGRESS':
            return '/baseline'
          case 'BASELINE_COMPLETE':
            return '/analytics' // Show analytics after baseline
          case 'PLAN_ACTIVE':
            return '/plan'
          case 'RECYCLE_UNLOCKED':
            return '/plan' // Plan page with re-cycle CTA
          case 'RECYCLE_ASSESSMENT_IN_PROGRESS':
            return '/recycle'
          default:
            return '/onboarding'
        }
      },
    }),
    {
      name: 'user-phase-storage',
      partialize: (state) => ({
        userState: state.userState,
      }),
    }
  )
)

/**
 * Phase transition rules
 */
export const PhaseTransitions = {
  ONBOARDING: ['BASELINE_ASSESSMENT_IN_PROGRESS'],
  BASELINE_ASSESSMENT_IN_PROGRESS: ['BASELINE_COMPLETE'],
  BASELINE_COMPLETE: ['PLAN_ACTIVE'],
  PLAN_ACTIVE: ['RECYCLE_UNLOCKED'],
  RECYCLE_UNLOCKED: ['RECYCLE_ASSESSMENT_IN_PROGRESS'],
  RECYCLE_ASSESSMENT_IN_PROGRESS: ['PLAN_ACTIVE'], // After checkpoint, new cycle
} as const

/**
 * Validate phase transition
 */
export function canTransitionTo(
  currentPhase: UserPhase,
  targetPhase: UserPhase
): boolean {
  const allowedTransitions = PhaseTransitions[currentPhase]
  return allowedTransitions.includes(targetPhase as any)
}

/**
 * Get phase display name
 */
export function getPhaseDisplayName(phase: UserPhase): string {
  const displayNames: Record<UserPhase, string> = {
    ONBOARDING: 'Getting Started',
    BASELINE_ASSESSMENT_IN_PROGRESS: 'Baseline Assessment',
    BASELINE_COMPLETE: 'Assessment Complete',
    PLAN_ACTIVE: 'Study Plan',
    RECYCLE_UNLOCKED: 'Re-cycle Available',
    RECYCLE_ASSESSMENT_IN_PROGRESS: 'Re-cycle Checkpoint',
  }
  return displayNames[phase]
}

/**
 * Get phase progress percentage (0-100)
 */
export function getPhaseProgress(phase: UserPhase): number {
  const progressMap: Record<UserPhase, number> = {
    ONBOARDING: 0,
    BASELINE_ASSESSMENT_IN_PROGRESS: 20,
    BASELINE_COMPLETE: 40,
    PLAN_ACTIVE: 60,
    RECYCLE_UNLOCKED: 80,
    RECYCLE_ASSESSMENT_IN_PROGRESS: 90,
  }
  return progressMap[phase]
}

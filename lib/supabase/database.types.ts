/**
 * Supabase Database Types
 * Generated from database schema
 *
 * TODO: Generate this file using:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'student' | 'admin'
          package_days: number | null
          time_budget_min: number | null
          target_university: string | null
          target_major: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'student' | 'admin'
          package_days?: number | null
          time_budget_min?: number | null
          target_university?: string | null
          target_major?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'student' | 'admin'
          package_days?: number | null
          time_budget_min?: number | null
          target_university?: string | null
          target_major?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_state: {
        Row: {
          id: string
          user_id: string
          current_phase: 'ONBOARDING' | 'BASELINE_ASSESSMENT_IN_PROGRESS' | 'BASELINE_COMPLETE' | 'PLAN_ACTIVE' | 'RECYCLE_UNLOCKED' | 'RECYCLE_ASSESSMENT_IN_PROGRESS'
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
        Insert: {
          id?: string
          user_id: string
          current_phase?: 'ONBOARDING' | 'BASELINE_ASSESSMENT_IN_PROGRESS' | 'BASELINE_COMPLETE' | 'PLAN_ACTIVE' | 'RECYCLE_UNLOCKED' | 'RECYCLE_ASSESSMENT_IN_PROGRESS'
          onboarding_completed_at?: string | null
          baseline_started_at?: string | null
          baseline_completed_at?: string | null
          current_baseline_module_id?: string | null
          current_cycle_id?: string | null
          cycle_start_date?: string | null
          recycle_unlocked_at?: string | null
          current_checkpoint_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          current_phase?: 'ONBOARDING' | 'BASELINE_ASSESSMENT_IN_PROGRESS' | 'BASELINE_COMPLETE' | 'PLAN_ACTIVE' | 'RECYCLE_UNLOCKED' | 'RECYCLE_ASSESSMENT_IN_PROGRESS'
          onboarding_completed_at?: string | null
          baseline_started_at?: string | null
          baseline_completed_at?: string | null
          current_baseline_module_id?: string | null
          current_cycle_id?: string | null
          cycle_start_date?: string | null
          recycle_unlocked_at?: string | null
          current_checkpoint_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // Add more table types as needed
      [key: string]: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

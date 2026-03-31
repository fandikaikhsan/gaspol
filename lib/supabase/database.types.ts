/**
 * Supabase Database Types
 * Generated from database schema
 *
 * Updated for Milestone A: Point-based coverage, material_cards, campus_scores
 *
 * TODO: Regenerate using:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type DifficultyLevel = "L1" | "L2" | "L3"
export type MaterialCardStatus = "draft" | "published"
export type UserPhase =
  | "ONBOARDING"
  | "BASELINE_ASSESSMENT_IN_PROGRESS"
  | "BASELINE_COMPLETE"
  | "PLAN_ACTIVE"
  | "RECYCLE_UNLOCKED"
  | "RECYCLE_ASSESSMENT_IN_PROGRESS"

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: "student" | "admin"
          package_days: number | null
          time_budget_min: number | null
          target_university: string | null
          target_major: string | null
          exam_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: "student" | "admin"
          package_days?: number | null
          time_budget_min?: number | null
          target_university?: string | null
          target_major?: string | null
          exam_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: "student" | "admin"
          package_days?: number | null
          time_budget_min?: number | null
          target_university?: string | null
          target_major?: string | null
          exam_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_state: {
        Row: {
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
        Insert: {
          id?: string
          user_id: string
          current_phase?: UserPhase
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
          current_phase?: UserPhase
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
        Relationships: []
      }
      questions: {
        Row: {
          id: string
          micro_skill_id: string | null
          difficulty: string | null
          cognitive_level: string | null
          difficulty_level: DifficultyLevel | null
          point_value: number | null
          question_format: string | null
          question_type: string | null
          stem: string | null
          question_text: string | null
          stem_images: Json
          options: Json
          correct_answer: string | null
          explanation: string | null
          explanation_images: Json
          construct_weights: Json
          version: number
          status: string
          points: number
          time_estimate_seconds: number
          media_url: string | null
          is_active: boolean
          created_by: string | null
          reviewed_by: string | null
          created_at: string
          updated_at: string
          published_at: string | null
        }
        Insert: {
          id?: string
          micro_skill_id?: string | null
          difficulty?: string | null
          cognitive_level?: string | null
          difficulty_level?: DifficultyLevel | null
          question_format?: string | null
          question_type?: string | null
          stem?: string | null
          question_text?: string | null
          stem_images?: Json
          options?: Json
          correct_answer?: string | null
          explanation?: string | null
          explanation_images?: Json
          construct_weights?: Json
          version?: number
          status?: string
          points?: number
          time_estimate_seconds?: number
          media_url?: string | null
          is_active?: boolean
          created_by?: string | null
          reviewed_by?: string | null
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
        Update: {
          id?: string
          micro_skill_id?: string | null
          difficulty?: string | null
          cognitive_level?: string | null
          difficulty_level?: DifficultyLevel | null
          question_format?: string | null
          question_type?: string | null
          stem?: string | null
          question_text?: string | null
          stem_images?: Json
          options?: Json
          correct_answer?: string | null
          explanation?: string | null
          explanation_images?: Json
          construct_weights?: Json
          version?: number
          status?: string
          points?: number
          time_estimate_seconds?: number
          media_url?: string | null
          is_active?: boolean
          created_by?: string | null
          reviewed_by?: string | null
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
        Relationships: []
      }
      attempts: {
        Row: {
          id: string
          user_id: string
          question_id: string
          context_type: string
          context_id: string | null
          module_id: string | null
          user_answer: string
          is_correct: boolean
          time_spent_sec: number
          points_awarded: number | null
          error_tags: Json
          construct_impacts: Json
          attempted_at: string
        }
        Insert: {
          id?: string
          user_id: string
          question_id: string
          context_type: string
          context_id?: string | null
          module_id?: string | null
          user_answer: string
          is_correct: boolean
          time_spent_sec: number
          points_awarded?: number | null
          error_tags?: Json
          construct_impacts?: Json
          attempted_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          question_id?: string
          context_type?: string
          context_id?: string | null
          module_id?: string | null
          user_answer?: string
          is_correct?: boolean
          time_spent_sec?: number
          points_awarded?: number | null
          error_tags?: Json
          construct_impacts?: Json
          attempted_at?: string
        }
        Relationships: []
      }
      modules: {
        Row: {
          id: string
          name: string
          description: string | null
          module_type: string
          target_node_id: string | null
          question_count: number
          time_limit_min: number | null
          passing_threshold: number | null
          status: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          module_type: string
          target_node_id?: string | null
          question_count: number
          time_limit_min?: number | null
          passing_threshold?: number | null
          status?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          module_type?: string
          target_node_id?: string | null
          question_count?: number
          time_limit_min?: number | null
          passing_threshold?: number | null
          status?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_skill_state: {
        Row: {
          id: string
          user_id: string
          micro_skill_id: string
          accuracy: number
          avg_speed_index: number
          stability: number
          attempt_count: number
          correct_count: number
          total_time_sec: number
          avg_time_sec: number
          total_points: number
          l1_correct: number
          l2_correct: number
          l3_correct: number
          is_covered: boolean
          mastery_level: string
          last_attempted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          micro_skill_id: string
          accuracy?: number
          avg_speed_index?: number
          stability?: number
          attempt_count?: number
          correct_count?: number
          total_time_sec?: number
          avg_time_sec?: number
          total_points?: number
          l1_correct?: number
          l2_correct?: number
          l3_correct?: number
          mastery_level?: string
          last_attempted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          micro_skill_id?: string
          accuracy?: number
          avg_speed_index?: number
          stability?: number
          attempt_count?: number
          correct_count?: number
          total_time_sec?: number
          avg_time_sec?: number
          total_points?: number
          l1_correct?: number
          l2_correct?: number
          l3_correct?: number
          mastery_level?: string
          last_attempted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      material_cards: {
        Row: {
          id: string
          skill_id: string
          title: string
          core_idea: string
          key_facts: Json
          common_mistakes: Json
          examples: Json
          status: MaterialCardStatus
          created_by: string | null
          reviewed_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          skill_id: string
          title: string
          core_idea: string
          key_facts?: Json
          common_mistakes?: Json
          examples?: Json
          status?: MaterialCardStatus
          created_by?: string | null
          reviewed_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          skill_id?: string
          title?: string
          core_idea?: string
          key_facts?: Json
          common_mistakes?: Json
          examples?: Json
          status?: MaterialCardStatus
          created_by?: string | null
          reviewed_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      campus_scores: {
        Row: {
          id: string
          university_id: number | null
          university_name: string
          major: string | null
          program_id: number | null
          program_type: string | null
          min_score: number
          year: number
          source_url: string | null
          verified: boolean
          interest: number | null
          capacity: number | null
          acceptance_rate: number | null
          interest_capacity_error: number | null
          interest_negative_error: number | null
          confidence_level: number | null
          confidence_level_label: string | null
          created_at: string
        }
        Insert: {
          id?: string
          university_id?: number | null
          university_name: string
          major?: string | null
          program_id?: number | null
          program_type?: string | null
          min_score: number
          year: number
          source_url?: string | null
          verified?: boolean
          interest?: number | null
          capacity?: number | null
          acceptance_rate?: number | null
          interest_capacity_error?: number | null
          interest_negative_error?: number | null
          confidence_level?: number | null
          confidence_level_label?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          university_id?: number | null
          university_name?: string
          major?: string | null
          program_id?: number | null
          program_type?: string | null
          min_score?: number
          year?: number
          source_url?: string | null
          verified?: boolean
          interest?: number | null
          capacity?: number | null
          acceptance_rate?: number | null
          interest_capacity_error?: number | null
          interest_negative_error?: number | null
          confidence_level?: number | null
          confidence_level_label?: string | null
          created_at?: string
        }
        Relationships: []
      }
      gaspol_tutor_chats: {
        Row: {
          id: string
          user_id: string
          topic_id: string
          role: "user" | "assistant"
          message: string
          tokens_used: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          topic_id: string
          role: "user" | "assistant"
          message: string
          tokens_used?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          topic_id?: string
          role?: "user" | "assistant"
          message?: string
          tokens_used?: number | null
          created_at?: string
        }
        Relationships: []
      }
      tanya_gaspol_quota: {
        Row: {
          user_id: string
          total_tokens: number
          used_tokens: number
          remaining_tokens: number
          updated_at: string
        }
        Insert: {
          user_id: string
          total_tokens?: number
          used_tokens?: number
          updated_at?: string
        }
        Update: {
          user_id?: string
          total_tokens?: number
          used_tokens?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      difficulty_level: DifficultyLevel
      material_card_status: MaterialCardStatus
      user_phase: UserPhase
    }
  }
}

"use client"

/**
 * Hook to get the active exam ID for the current user.
 * Used by drill, review, and other student pages to filter content by active exam only.
 */

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

export function useActiveExamId() {
  return useQuery({
    queryKey: ["active-exam-id"],
    queryFn: async (): Promise<string | null> => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase.rpc("get_user_exam_config", {
        p_user_id: user.id,
      })

      if (error || !Array.isArray(data) || data.length === 0) return null
      return (data[0] as { exam_id: string }).exam_id
    },
  })
}

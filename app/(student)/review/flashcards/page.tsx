"use client"

/**
 * Flashcards Page — SM-2 Spaced Repetition
 *
 * Gated behind baseline completion. Shows mastery stacks + review session.
 * @see V3-T-019 (baseline gating), V3-T-016 (mastery stacks), V3-T-017 (review session)
 */

import { useEffect, useState, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { MasteryStacks } from "@/components/review/MasteryStacks"
import { FlashcardStack } from "@/components/review/FlashcardStack"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Lock } from "lucide-react"
import { getActiveExamId } from "@/lib/active-exam"
import type { MasteryResponse } from "@/lib/assessment/flashcard-sm2"

interface FlashcardUserState {
  id: string
  user_id: string
  skill_id: string
  ease_factor: number
  interval_days: number
  reps: number
  due_at: string
  mastery_bucket: string
  total_reviews: number
  last_reviewed_at: string | null
}

interface MaterialCard {
  id: string
  skill_id: string
  title: string
  core_idea: string | null
  key_facts: string[] | null
}

function FlashcardsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const filterBucket = searchParams.get("bucket") as MasteryResponse | null
  const taskId = searchParams.get("taskId")

  const [user, setUser] = useState<any>(null)
  const [phase, setPhase] = useState<string | null>(null)
  const [baselineCompleteForActiveExam, setBaselineCompleteForActiveExam] =
    useState<boolean | null>(null)
  const [flashcardStates, setFlashcardStates] = useState<FlashcardUserState[]>(
    [],
  )
  const [materialCards, setMaterialCards] = useState<MaterialCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [reviewMode, setReviewMode] = useState(false)
  const [reviewCards, setReviewCards] = useState<
    Array<FlashcardUserState & { material?: MaterialCard }>
  >([])

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    if (!currentUser) {
      router.push("/login")
      return
    }

    setUser(currentUser)

    const activeExamId = await getActiveExamId(supabase, currentUser.id)

    // Baseline is exam-specific: must complete baseline for active exam
    let baselineCompleteForActiveExam = false
    if (activeExamId) {
      const { data: baselineModules } = await (supabase as any)
        .from("baseline_modules")
        .select("module_id")
        .eq("is_active", true)
        .eq("exam_id", activeExamId)

      const requiredIds = new Set(
        (baselineModules || []).map((m: { module_id: string }) => m.module_id),
      )
      if (requiredIds.size > 0) {
        const { data: completed } = await (supabase as any)
          .from("module_completions")
          .select("module_id")
          .eq("user_id", currentUser.id)
          .eq("context_type", "baseline")
          .in("module_id", Array.from(requiredIds))
        const completedIds = new Set(
          (completed || []).map((m: { module_id: string }) => m.module_id),
        )
        baselineCompleteForActiveExam = Array.from(requiredIds).every((id) =>
          completedIds.has(id),
        )
      }
    }
    setBaselineCompleteForActiveExam(baselineCompleteForActiveExam)

    // Check user phase for display
    const { data: userState } = await supabase
      .from("user_state")
      .select("current_phase")
      .eq("user_id", currentUser.id)
      .single()

    const currentPhase = userState?.current_phase ?? "ONBOARDING"
    setPhase(currentPhase)

    const phaseAllowsFlashcards = [
      "BASELINE_COMPLETE",
      "PLAN_ACTIVE",
      "RECYCLE_UNLOCKED",
      "RECYCLE_ASSESSMENT_IN_PROGRESS",
    ].includes(currentPhase)

    // Lock if phase doesn't allow or baseline for active exam not complete
    if (!phaseAllowsFlashcards || !baselineCompleteForActiveExam) {
      setIsLoading(false)
      return
    }

    // Fetch flashcard states for this user
    const { data: states } = await supabase
      .from("flashcard_user_state")
      .select("*")
      .eq("user_id", currentUser.id)

    const rawStates = states || []

    // Filter to only skills belonging to the active exam (exclude exam_id null)
    let filteredStates = rawStates

    if (activeExamId && rawStates.length > 0) {
      const skillIds = [...new Set(rawStates.map((s) => s.skill_id))]
      const { data: taxonomyNodes } = await (supabase as any)
        .from("taxonomy_nodes")
        .select("id, exam_id")
        .in("id", skillIds)

      const activeExamSkillIds = new Set(
        (taxonomyNodes || []).filter(
          (n: { id: string; exam_id: string | null }) =>
            n.exam_id === activeExamId,
        ).map((n: { id: string }) => n.id),
      )
      filteredStates = rawStates.filter((s) => activeExamSkillIds.has(s.skill_id))
    }

    setFlashcardStates(filteredStates)

    // Fetch material cards for skills that have flashcard states (active exam only)
    if (filteredStates.length > 0) {
      const skillIds = filteredStates.map((s) => s.skill_id)
      const { data: cards } = await supabase
        .from("material_cards")
        .select("id, skill_id, title, core_idea, key_facts")
        .in("skill_id", skillIds)
        .eq("status", "published")

      setMaterialCards(cards || [])
    }

    setIsLoading(false)
  }, [router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Enter review mode
  const startReview = useCallback(
    (bucket?: MasteryResponse) => {
      const now = new Date().toISOString()
      let cardsToReview = flashcardStates.filter((s) => s.due_at <= now)

      if (bucket) {
        cardsToReview = cardsToReview.filter((s) => s.mastery_bucket === bucket)
      }

      // Attach material card content
      const enriched = cardsToReview.map((s) => ({
        ...s,
        material: materialCards.find((m) => m.skill_id === s.skill_id),
      }))

      setReviewCards(enriched)
      setReviewMode(true)
    },
    [flashcardStates, materialCards],
  )

  // Auto-start review if bucket filter in URL
  useEffect(() => {
    if (
      !isLoading &&
      filterBucket &&
      flashcardStates.length > 0 &&
      !reviewMode
    ) {
      startReview(filterBucket)
    }
  }, [isLoading, filterBucket, flashcardStates, reviewMode, startReview])

  const handleReviewComplete = async () => {
    if (taskId && user) {
      const supabase = createClient()
      await supabase
        .from("plan_tasks")
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq("id", taskId)
        .eq("user_id", user.id)
    }

    toast({
      title: "Review selesai!",
      description: "Kartu akan muncul lagi sesuai jadwal.",
    })

    setReviewMode(false)
    // Refresh data to show updated states
    setIsLoading(true)
    await fetchData()
  }

  // ──────────── LOADING ────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Memuat flashcards...</p>
      </div>
    )
  }

  // ──────────── BASELINE GATING (V3-T-019) ────────────
  const phaseAllowsFlashcards =
    phase &&
    [
      "BASELINE_COMPLETE",
      "PLAN_ACTIVE",
      "RECYCLE_UNLOCKED",
      "RECYCLE_ASSESSMENT_IN_PROGRESS",
    ].includes(phase)
  const canAccessFlashcards =
    phaseAllowsFlashcards && baselineCompleteForActiveExam === true

  if (!canAccessFlashcards) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto text-center py-20 space-y-6">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-muted border-2 border-border shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] flex items-center justify-center">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Flashcards Terkunci</h2>
            <p className="text-muted-foreground">
              Flashcards akan terbuka setelah kamu menyelesaikan Baseline
              Assessment.
            </p>
          </div>
          <Button
            variant="brutal"
            size="lg"
            onClick={() => router.push("/plan")}
          >
            Mulai Baseline Assessment
          </Button>
        </div>
      </div>
    )
  }

  // ──────────── REVIEW MODE ────────────
  if (reviewMode && reviewCards.length > 0) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto py-8">
          <FlashcardStack
            cards={reviewCards}
            onComplete={handleReviewComplete}
          />
        </div>
      </div>
    )
  }

  // ──────────── MASTERY STACKS (default view) ────────────
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Flashcards</h1>
          <p className="text-muted-foreground">
            Review kartu untuk memperkuat ingatan
          </p>
        </div>

        <MasteryStacks
          flashcardStates={flashcardStates}
          onStartReview={startReview}
        />
      </div>
    </div>
  )
}

export default function FlashcardsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Memuat flashcards...</p>
        </div>
      }
    >
      <FlashcardsContent />
    </Suspense>
  )
}

"use client"

/**
 * Material Card Detail Page (T-043)
 * Shows Core Idea, Key Facts, Common Mistakes, Examples for a micro-skill
 */

import { useState, useEffect, Suspense } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Circle,
  Loader2,
  Target,
  MessageCircle,
} from "lucide-react"
import { getActiveExamId } from "@/lib/active-exam"
import TanyaGaspolChat from "@/components/review/TanyaGaspolChat"
import { MaterialCardViewer } from "@/components/review/MaterialCardViewer"

interface MaterialCard {
  id: string
  skill_id: string
  title: string
  core_idea: string
  key_facts: string[]
  common_mistakes: string[]
  examples: (string | { contoh?: string; penjelasan?: string })[]
  status: string
}

interface SkillInfo {
  id: string
  name: string
  code: string
}

interface Coverage {
  total_points: number
  is_covered: boolean
}

export default function MaterialCardDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <MaterialCardDetailContent />
    </Suspense>
  )
}

function MaterialCardDetailContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const skillId = params.skillId as string
  const fromPembahasan = searchParams.get("from") === "pembahasan"
  const pembahasanModuleId = searchParams.get("moduleId")
  const entryFrom = searchParams.get("from")

  const handleBack = () => {
    if (fromPembahasan && pembahasanModuleId) {
      router.push(
        `/drill/pembahasan/${pembahasanModuleId}?skillId=${skillId}`,
      )
      return
    }
    if (entryFrom === "review") {
      router.push("/review")
      return
    }
    if (entryFrom === "analytics") {
      router.push("/analytics")
      return
    }
    router.back()
  }

  const [isLoading, setIsLoading] = useState(true)
  const [card, setCard] = useState<MaterialCard | null>(null)
  const [skill, setSkill] = useState<SkillInfo | null>(null)
  const [coverage, setCoverage] = useState<Coverage | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [skillNotForActiveExam, setSkillNotForActiveExam] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          setIsLoading(false)
          return
        }

        const activeExamId = await getActiveExamId(supabase, user.id)

        // Fetch skill info (include exam_id for validation)
        const { data: skillData } = await (supabase as any)
          .from("taxonomy_nodes")
          .select("id, name, code, exam_id")
          .eq("id", skillId)
          .single()

        if (skillData) {
          setSkill({ id: skillData.id, name: skillData.name, code: skillData.code })
          // Block skills not for active exam: exam_id null or different exam
          if (activeExamId && (skillData.exam_id === null || skillData.exam_id !== activeExamId)) {
            setSkillNotForActiveExam(true)
            setIsLoading(false)
            return
          }
        }

        // Fetch published material card for this skill
        const { data: cardData } = await (supabase as any)
          .from("material_cards")
          .select("*")
          .eq("skill_id", skillId)
          .eq("status", "published")
          .order("updated_at", { ascending: false })
          .limit(1)
          .single()

        if (cardData) {
          setCard({
            ...cardData,
            key_facts: Array.isArray(cardData.key_facts)
              ? (cardData.key_facts as string[])
              : [],
            common_mistakes: Array.isArray(cardData.common_mistakes)
              ? (cardData.common_mistakes as string[])
              : [],
            examples: Array.isArray(cardData.examples)
              ? (cardData.examples as (string | { contoh?: string; penjelasan?: string })[])
              : [],
          })
        }

        // Fetch user coverage
        if (user) {
          const { data: coverageData } = await supabase
            .from("user_skill_state")
            .select("total_points, is_covered")
            .eq("user_id", user.id)
            .eq("micro_skill_id", skillId)
            .single()

          if (coverageData) setCoverage(coverageData as Coverage)
        }
      } catch (err) {
        console.error("Failed to fetch material card:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [skillId])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (skillNotForActiveExam) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto py-8">
          <Button variant="ghost" onClick={handleBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Card className="border-2 border-amber-200 bg-amber-50/50">
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-semibold mb-1">Not Available</h3>
              <p className="text-muted-foreground">
                This material is not available for the currently active exam.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!card) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto py-8">
          <Button variant="ghost" onClick={handleBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Card className="border-2 border-border">
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-1">No Material Card</h3>
              <p className="text-muted-foreground">
                No published material card available for this skill yet.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const points = coverage?.total_points ?? 0
  const isCovered = coverage?.is_covered ?? false

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto py-6">
        {/* Back Button */}
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="text-2xl font-bold">{card.title}</h1>
            <Badge
              variant="outline"
              className={
                isCovered
                  ? "bg-green-100 text-green-800 border-green-200 flex-shrink-0"
                  : "bg-muted text-muted-foreground flex-shrink-0"
              }
            >
              {isCovered ? (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              ) : (
                <Circle className="h-3 w-3 mr-1" />
              )}
              {points}/20 pts
            </Badge>
          </div>
          {skill && (
            <p className="text-sm text-muted-foreground">
              {skill.name} ({skill.code})
            </p>
          )}
        </div>

        {/* Action Buttons (F-004) */}
        <div className="flex gap-3 mb-6">
          {fromPembahasan && pembahasanModuleId ? (
            <Button
              variant="brutal"
              className="flex-1 gap-2"
              onClick={() =>
                router.push(
                  `/drill/pembahasan/${pembahasanModuleId}?skillId=${skillId}`,
                )
              }
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Pembahasan
            </Button>
          ) : (
            <Button
              variant="brutal"
              className="flex-1 gap-2"
              onClick={() =>
                router.push(`/review/${skillId}/drill?from=material`)
              }
            >
              <Target className="h-4 w-4" />
              Latihan Skill Ini
            </Button>
          )}
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => setChatOpen(true)}
          >
            <MessageCircle className="h-4 w-4" />
            Tanya Gaspol
          </Button>
        </div>

        {/* Material content (shared component) */}
        <MaterialCardViewer
          card={card}
          skillName={skill?.name}
          skillCode={skill?.code}
          showHeader={false}
        />
        {/* Tanya Gaspol Chat Modal */}
        {card && skill && (
          <TanyaGaspolChat
            open={chatOpen}
            onOpenChange={setChatOpen}
            skillId={skillId}
            skillName={skill.name}
            materialContext={{
              core_idea: card.core_idea,
              key_facts: card.key_facts,
              common_mistakes: card.common_mistakes,
            }}
          />
        )}
      </div>
    </div>
  )
}

"use client"

/**
 * Material Card Detail Page (T-043)
 * Shows Core Idea, Key Facts, Common Mistakes, Examples for a micro-skill
 */

import { useState, useEffect, Suspense } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
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
import { useMediaQuery } from "@/hooks/use-media-query"

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
        <div className="flex min-h-screen items-center justify-center">
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

  const isLg = useMediaQuery("(min-width: 1024px)")

  const handleBack = () => {
    if (fromPembahasan && pembahasanModuleId) {
      router.push(`/drill/pembahasan/${pembahasanModuleId}?skillId=${skillId}`)
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
  const [subtopicName, setSubtopicName] = useState<string | null>(null)
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

        const { data: skillData } = await (supabase as any)
          .from("taxonomy_nodes")
          .select("id, name, code, exam_id, parent_id")
          .eq("id", skillId)
          .single()

        if (skillData) {
          setSkill({
            id: skillData.id,
            name: skillData.name,
            code: skillData.code,
          })
          if (
            activeExamId &&
            (skillData.exam_id === null || skillData.exam_id !== activeExamId)
          ) {
            setSkillNotForActiveExam(true)
            setIsLoading(false)
            return
          }

          if (skillData.parent_id) {
            const { data: parent } = await (supabase as any)
              .from("taxonomy_nodes")
              .select("name")
              .eq("id", skillData.parent_id)
              .single()
            if (parent?.name) setSubtopicName(parent.name)
          }
        }

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
              ? (cardData.examples as (
                  | string
                  | { contoh?: string; penjelasan?: string }
                )[])
              : [],
          })
        }

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
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (skillNotForActiveExam) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="mx-auto max-w-2xl py-8">
          <Button variant="ghost" onClick={handleBack} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Card className="border-2 border-amber-200 bg-amber-50/50">
            <CardContent className="py-12 text-center">
              <h3 className="mb-1 text-lg font-semibold">Not Available</h3>
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
        <div className="mx-auto max-w-2xl py-8">
          <Button variant="ghost" onClick={handleBack} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Card className="border-2 border-border">
            <CardContent className="py-12 text-center">
              <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-1 text-lg font-semibold">No Material Card</h3>
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

  const drillOrBackButton =
    fromPembahasan && pembahasanModuleId ? (
      <Button
        variant="brutal"
        className="w-full gap-2 shadow-brutal"
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
        className="w-full gap-2 shadow-brutal"
        onClick={() => router.push(`/review/${skillId}/drill?from=material`)}
      >
        <Target className="h-4 w-4" />
        Latihan Skill Ini
      </Button>
    )

  const tanyaButton = (
    <Button
      variant="outline"
      className="w-full gap-2 border-2 border-border bg-background shadow-brutal-sm"
      onClick={() => setChatOpen(true)}
    >
      <MessageCircle className="h-4 w-4" />
      Tanya Gaspol
    </Button>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10 xl:gap-12">
          <div className="min-w-0 flex-1">
            <Button variant="ghost" onClick={handleBack} className="-ml-2 mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {subtopicName && (
              <p className="text-sm font-medium text-muted-foreground">
                {subtopicName}
              </p>
            )}

            <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
              <h1 className="font-serif text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
                {card.title}
              </h1>
              <Badge
                variant="outline"
                className={
                  isCovered
                    ? "shrink-0 border-green-200 bg-green-100 text-green-800"
                    : "shrink-0 bg-muted text-muted-foreground"
                }
              >
                {isCovered ? (
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                ) : (
                  <Circle className="mr-1 h-3 w-3" />
                )}
                {points}/20 pts
              </Badge>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:hidden">
              {drillOrBackButton}
              {tanyaButton}
            </div>

            <div className="mt-8 lg:mt-10">
              <MaterialCardViewer
                variant="editorial"
                card={card}
                skillName={skill?.name}
                skillCode={skill?.code}
                showHeader={false}
              />
            </div>
          </div>

          {isLg && skill && (
            <aside className="sticky top-6 w-full max-w-[380px] shrink-0 space-y-4 self-start">
              {drillOrBackButton}
              <TanyaGaspolChat
                layout="embedded"
                skillId={skillId}
                skillName={skill.name}
                materialContext={{
                  core_idea: card.core_idea,
                  key_facts: card.key_facts,
                  common_mistakes: card.common_mistakes,
                }}
              />
            </aside>
          )}
        </div>
      </div>

      {!isLg && skill && (
        <TanyaGaspolChat
          layout="dialog"
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
  )
}

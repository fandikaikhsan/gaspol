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
  Lightbulb,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Circle,
  Loader2,
  Target,
  MessageCircle,
} from "lucide-react"
import TanyaGaspolChat from "@/components/review/TanyaGaspolChat"

interface MaterialCard {
  id: string
  skill_id: string
  title: string
  core_idea: string
  key_facts: string[]
  common_mistakes: string[]
  examples: string[]
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

  const [isLoading, setIsLoading] = useState(true)
  const [card, setCard] = useState<MaterialCard | null>(null)
  const [skill, setSkill] = useState<SkillInfo | null>(null)
  const [coverage, setCoverage] = useState<Coverage | null>(null)
  const [chatOpen, setChatOpen] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch skill info
        const { data: skillData } = await (supabase as any)
          .from("taxonomy_nodes")
          .select("id, name, code")
          .eq("id", skillId)
          .single()

        if (skillData) setSkill(skillData as SkillInfo)

        // Fetch published material card for this skill
        const { data: cardData } = await supabase
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
              ? (cardData.examples as string[])
              : [],
          })
        }

        // Fetch user coverage
        const {
          data: { user },
        } = await supabase.auth.getUser()
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

  if (!card) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto py-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
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
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
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
                router.push(`/drill/pembahasan/${pembahasanModuleId}`)
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
                router.push(`/drill?tab=topic&node=${skillId}`)
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

        {/* Core Idea */}
        <Card className="border-2 border-border mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Core Idea
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base leading-relaxed">{card.core_idea}</p>
          </CardContent>
        </Card>

        {/* Key Facts */}
        {card.key_facts.length > 0 && (
          <Card className="border-2 border-border mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Key Facts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {card.key_facts.map((fact, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-800 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                      {i + 1}
                    </span>
                    <span className="text-sm leading-relaxed">{fact}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Common Mistakes */}
        {card.common_mistakes.length > 0 && (
          <Card className="border-2 border-border mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Common Mistakes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {card.common_mistakes.map((mistake, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-400 flex-shrink-0 mt-2" />
                    <span className="text-sm leading-relaxed">{mistake}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Examples */}
        {card.examples.length > 0 && (
          <Card className="border-2 border-border mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-green-500" />
                Examples
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {card.examples.map((example, i) => (
                  <div
                    key={i}
                    className="bg-muted/50 rounded-lg p-3 border border-border"
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {example}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
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

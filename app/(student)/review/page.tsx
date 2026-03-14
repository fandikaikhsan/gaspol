"use client"

/**
 * Student Review Page (T-041 + T-042)
 * Topic tree with L4 subtopics expandable to L5 micro-skills
 * Shows coverage status (X/20 points) and links to material cards
 */

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Layers,
  Zap,
  ChevronDown,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Loader2,
} from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { getActiveExamId } from "@/lib/active-exam"

interface TaxonomyNode {
  id: string
  name: string
  code: string
  level: number
  parent_id: string | null
}

interface SkillCoverage {
  micro_skill_id: string
  total_points: number
  is_covered: boolean
}

interface ExpandedSubtopic extends TaxonomyNode {
  skills: (TaxonomyNode & {
    coverage: SkillCoverage | null
    hasMaterialCard: boolean
  })[]
}

export default function ReviewPage() {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useTranslation("review")
  const { t: tc } = useTranslation("common")

  const [isLoading, setIsLoading] = useState(true)
  const [subtopics, setSubtopics] = useState<TaxonomyNode[]>([])
  const [expanded, setExpanded] = useState<
    Record<string, ExpandedSubtopic | null>
  >({})
  const [loadingExpand, setLoadingExpand] = useState<string | null>(null)

  // Fetch L4 subtopics: active exam only, and only topics that have at least one material card
  useEffect(() => {
    async function fetchSubtopics() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          setSubtopics([])
          setIsLoading(false)
          return
        }

        const activeExamId = await getActiveExamId(supabase, user.id)

        if (!activeExamId) {
          setSubtopics([])
          setIsLoading(false)
          return
        }

        let l4Query = (supabase as any)
          .from("taxonomy_nodes")
          .select("id, name, code, level, parent_id")
          .eq("level", 4)
          .eq("is_active", true)
          .or(`exam_id.eq.${activeExamId},exam_id.is.null`)

        const { data: l4Data, error: l4Error } = await l4Query.order("code")
        if (l4Error) throw l4Error
        const allL4s = (l4Data as TaxonomyNode[]) || []

        if (allL4s.length === 0) {
          setSubtopics([])
          setIsLoading(false)
          return
        }

        const l4Ids = allL4s.map((l) => l.id)

        const { data: l5WithParent } = await (supabase as any)
          .from("taxonomy_nodes")
          .select("id, parent_id")
          .eq("level", 5)
          .in("parent_id", l4Ids)

        const l5WithParentArr = (l5WithParent || []) as Array<{
          id: string
          parent_id: string
        }>
        const l5Ids = l5WithParentArr.map((r) => r.id)
        if (l5Ids.length === 0) {
          setSubtopics([])
          setIsLoading(false)
          return
        }

        const { data: materialData } = await (supabase as any)
          .from("material_cards")
          .select("skill_id")
          .in("skill_id", l5Ids)
          .eq("status", "published")

        const l5WithMaterial = new Set(
          (materialData || []).map((m: { skill_id: string }) => m.skill_id),
        )
        const l4IdsWithMaterial = new Set(
          l5WithParentArr
            .filter((r) => l5WithMaterial.has(r.id))
            .map((r) => r.parent_id),
        )

        const filtered = allL4s.filter((l4) => l4IdsWithMaterial.has(l4.id))
        setSubtopics(filtered)
      } catch (err) {
        console.error("Failed to fetch subtopics:", err)
        setSubtopics([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchSubtopics()
  }, [])

  // Toggle expand a subtopic → load L5 skills + coverage
  const toggleExpand = useCallback(
    async (subtopicId: string) => {
      if (expanded[subtopicId] !== undefined) {
        // Collapse
        setExpanded((prev) => {
          const next = { ...prev }
          delete next[subtopicId]
          return next
        })
        return
      }

      setLoadingExpand(subtopicId)
      try {
        // Get L5 skills under this L4
        const { data: skillsData, error: skillsError } = await (supabase as any)
          .from("taxonomy_nodes")
          .select("id, name, code, level, parent_id")
          .eq("parent_id", subtopicId)
          .eq("level", 5)
          .order("code")

        if (skillsError) throw skillsError
        const skills = (skillsData as TaxonomyNode[]) || []

        // Get user's coverage for these skills
        const {
          data: { user },
        } = await supabase.auth.getUser()
        let coverageMap: Record<string, SkillCoverage> = {}

        if (user && skills.length > 0) {
          const { data: coverageData } = await supabase
            .from("user_skill_state")
            .select("micro_skill_id, total_points, is_covered")
            .eq("user_id", user.id)
            .in(
              "micro_skill_id",
              skills.map((s) => s.id),
            )

          if (coverageData) {
            for (const c of coverageData) {
              coverageMap[c.micro_skill_id] = c as SkillCoverage
            }
          }
        }

        // Check which skills have published material cards
        const { data: materialData } = await (supabase as any)
          .from("material_cards")
          .select("skill_id")
          .in(
            "skill_id",
            skills.map((s) => s.id),
          )
          .eq("status", "published")

        const materialSkillIds = new Set(
          (materialData || []).map((m: any) => m.skill_id),
        )

        const subtopic = subtopics.find((s) => s.id === subtopicId)!
        const skillsWithMeta = skills.map((skill) => ({
          ...skill,
          coverage: coverageMap[skill.id] || null,
          hasMaterialCard: materialSkillIds.has(skill.id),
        }))
        setExpanded((prev) => ({
          ...prev,
          [subtopicId]: {
            ...subtopic,
            skills: skillsWithMeta.filter((s) => s.hasMaterialCard),
          },
        }))
      } catch (err) {
        console.error("Failed to expand subtopic:", err)
      } finally {
        setLoadingExpand(null)
      }
    },
    [expanded, subtopics, supabase],
  )

  // Compute subtopic summary stats
  const getSubtopicStats = (subtopicId: string) => {
    const data = expanded[subtopicId]
    if (!data) return null
    const total = data.skills.length
    const covered = data.skills.filter((s) => s.coverage?.is_covered).length
    return { total, covered }
  }

  // Study modes (kept from original)
  const studyModes = [
    {
      id: "flashcards",
      name: t("flashcards.title", { fallback: "Flashcards" }),
      description: t("flashcards.desc", {
        fallback: "Quick review with flashcards",
      }),
      icon: Layers,
      href: "/review/flashcards",
      color: "bg-pastel-lavender",
      available: true,
    },
    {
      id: "swipe",
      name: t("swipe.title", { fallback: "Swipe" }),
      description: t("swipe.desc", { fallback: "Swipe to review" }),
      icon: Zap,
      href: "/review/swipe",
      color: "bg-pastel-peach",
      available: false,
    },
  ]

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1">
            {t("title", { fallback: "Review" })}
          </h1>
          <p className="text-muted-foreground">
            {t("subtitle", {
              fallback: "Browse topics and review material cards",
            })}
          </p>
        </div>

        {/* Study Mode Tiles (compact) */}
        <div className="flex gap-3 mb-6">
          {studyModes.map((mode) => {
            const Icon = mode.icon
            return (
              <Card
                key={mode.id}
                className={`flex-1 border-2 border-border shadow-brutal cursor-pointer transition-all hover:-translate-y-0.5 ${
                  !mode.available ? "opacity-50" : ""
                }`}
                onClick={() => mode.available && router.push(mode.href)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div
                    className={`${mode.color} p-2 rounded-lg border border-border`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{mode.name}</div>
                    {!mode.available && (
                      <span className="text-xs text-muted-foreground">
                        {tc("status.comingSoon", { fallback: "Coming Soon" })}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Topic Tree */}
        <div className="mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Material Cards by Topic
          </h2>
          <p className="text-sm text-muted-foreground">
            Tap a subtopic to see micro-skills and their coverage
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : subtopics.length === 0 ? (
          <Card className="border-2 border-border">
            <CardContent className="py-8 text-center text-muted-foreground">
              No topics available yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {subtopics.map((st) => {
              const isExpanded = expanded[st.id] !== undefined
              const isLoadingSt = loadingExpand === st.id
              const stats = getSubtopicStats(st.id)

              return (
                <div key={st.id}>
                  {/* Subtopic Header */}
                  <Card
                    className="border-2 border-border cursor-pointer transition-all hover:bg-muted/50"
                    onClick={() => toggleExpand(st.id)}
                  >
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {isLoadingSt ? (
                          <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                        ) : isExpanded ? (
                          <ChevronDown className="h-4 w-4 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 flex-shrink-0" />
                        )}
                        <span className="font-medium truncate">{st.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {st.code}
                        </span>
                      </div>
                      {stats && (
                        <Badge
                          variant="outline"
                          className={
                            stats.covered === stats.total
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {stats.covered}/{stats.total} covered
                        </Badge>
                      )}
                    </CardContent>
                  </Card>

                  {/* Expanded Skills List */}
                  {isExpanded && expanded[st.id] && (
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-border pl-3">
                      {expanded[st.id]!.skills.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2 pl-2">
                          No micro-skills found
                        </p>
                      ) : (
                        expanded[st.id]!.skills.map((skill) => {
                          const points = skill.coverage?.total_points ?? 0
                          const isCovered = skill.coverage?.is_covered ?? false

                          return (
                            <Card
                              key={skill.id}
                              className={`border border-border cursor-pointer transition-all hover:bg-muted/50 ${
                                skill.hasMaterialCard ? "" : "opacity-60"
                              }`}
                              onClick={() => {
                                if (skill.hasMaterialCard) {
                                  router.push(`/review/${skill.id}`)
                                }
                              }}
                            >
                              <CardContent className="p-3 flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {isCovered ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  )}
                                  <span className="text-sm truncate">
                                    {skill.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {/* T-042: Coverage X/20 */}
                                  <span
                                    className={`text-xs font-mono ${
                                      isCovered
                                        ? "text-green-600"
                                        : "text-muted-foreground"
                                    }`}
                                  >
                                    {points}/20
                                  </span>
                                  {skill.hasMaterialCard && (
                                    <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

/**
 * Student Review Page (T-041 + T-042)
 * L4 subtopics as accordions → L5 skill cards with Latihan + Materi actions
 */

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
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
  Pencil,
} from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { getActiveExamId } from "@/lib/active-exam"
import { cn } from "@/lib/utils"

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
  const [activeExamId, setActiveExamId] = useState<string | null>(null)
  const [subtopics, setSubtopics] = useState<TaxonomyNode[]>([])
  const [expanded, setExpanded] = useState<
    Record<string, ExpandedSubtopic | null>
  >({})
  const [loadingExpand, setLoadingExpand] = useState<string | null>(null)
  const [subtopicProgress, setSubtopicProgress] = useState<
    Record<string, { total: number; covered: number }>
  >({})
  const [l2Options, setL2Options] = useState<{ id: string; name: string }[]>([])
  const [l3ById, setL3ById] = useState<Record<string, TaxonomyNode>>({})
  const [l4ToL2Id, setL4ToL2Id] = useState<Record<string, string>>({})
  const [l2Filter, setL2Filter] = useState<string>("all")

  // Fetch L4 subtopics: active exam only, and only topics that have at least one material card
  useEffect(() => {
    async function fetchSubtopics() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          setSubtopics([])
          setL2Options([])
          setL3ById({})
          setL4ToL2Id({})
          setIsLoading(false)
          return
        }

        const examId = await getActiveExamId(supabase, user.id)
        setActiveExamId(examId)

        if (!examId) {
          setSubtopics([])
          setL2Options([])
          setL3ById({})
          setL4ToL2Id({})
          setIsLoading(false)
          return
        }

        // Only taxonomy for active exam — exclude exam_id null (unrelated materials)
        const { data: l4Data, error: l4Error } = await (supabase as any)
          .from("taxonomy_nodes")
          .select("id, name, code, level, parent_id")
          .eq("level", 4)
          .eq("is_active", true)
          .eq("exam_id", examId)
          .order("code")
        if (l4Error) throw l4Error
        const allL4s = (l4Data as TaxonomyNode[]) || []

        if (allL4s.length === 0) {
          setSubtopics([])
          setL2Options([])
          setL3ById({})
          setL4ToL2Id({})
          setIsLoading(false)
          return
        }

        const l4Ids = allL4s.map((l) => l.id)

        const { data: l5WithParent } = await (supabase as any)
          .from("taxonomy_nodes")
          .select("id, parent_id")
          .eq("level", 5)
          .eq("exam_id", examId)
          .in("parent_id", l4Ids)

        const l5WithParentArr = (l5WithParent || []) as Array<{
          id: string
          parent_id: string
        }>
        const l5Ids = l5WithParentArr.map((r) => r.id)
        if (l5Ids.length === 0) {
          setSubtopics([])
          setL2Options([])
          setL3ById({})
          setL4ToL2Id({})
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

        const l3Ids = [
          ...new Set(
            filtered.map((l) => l.parent_id).filter((id): id is string => !!id),
          ),
        ]
        if (l3Ids.length === 0) {
          setSubtopics(filtered)
          setL2Options([])
          setL3ById({})
          setL4ToL2Id({})
          return
        }

        const { data: l3Rows, error: l3Err } = await (supabase as any)
          .from("taxonomy_nodes")
          .select("id, name, code, level, parent_id")
          .in("id", l3Ids)
          .eq("exam_id", examId)

        if (l3Err) throw l3Err
        const l3List = (l3Rows as TaxonomyNode[]) || []
        const nextL3ById: Record<string, TaxonomyNode> = {}
        for (const n of l3List) nextL3ById[n.id] = n

        const l2Ids = [
          ...new Set(
            l3List
              .map((n) => n.parent_id)
              .filter((id): id is string => !!id),
          ),
        ]

        let l2Sorted: { id: string; name: string }[] = []
        if (l2Ids.length > 0) {
          const { data: l2Rows, error: l2Err } = await (supabase as any)
            .from("taxonomy_nodes")
            .select("id, name, code")
            .in("id", l2Ids)
            .eq("exam_id", examId)
          if (l2Err) throw l2Err
          const l2List = (l2Rows as { id: string; name: string; code: string }[]) || []
          l2Sorted = [...l2List]
            .sort((a, b) =>
              (a.code || a.name).localeCompare(b.code || b.name, "id"),
            )
            .map((n) => ({ id: n.id, name: n.name }))
        }

        const nextL4ToL2: Record<string, string> = {}
        for (const l4 of filtered) {
          const l3 = l4.parent_id ? nextL3ById[l4.parent_id] : undefined
          if (l3?.parent_id) nextL4ToL2[l4.id] = l3.parent_id
        }

        setSubtopics(filtered)
        setL3ById(nextL3ById)
        setL2Options(l2Sorted)
        setL4ToL2Id(nextL4ToL2)
      } catch (err) {
        console.error("Failed to fetch subtopics:", err)
        setSubtopics([])
        setL2Options([])
        setL3ById({})
        setL4ToL2Id({})
      } finally {
        setIsLoading(false)
      }
    }
    fetchSubtopics()
  }, [])

  // Per-accordion progress (L5 with materi / covered) for header badge — no expand required
  useEffect(() => {
    if (!activeExamId || subtopics.length === 0) return
    let cancelled = false

    async function loadProgress() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const l4Ids = subtopics.map((s) => s.id)
      const { data: l5rows } = await (supabase as any)
        .from("taxonomy_nodes")
        .select("id, parent_id")
        .eq("level", 5)
        .eq("exam_id", activeExamId)
        .in("parent_id", l4Ids)

      const l5List = (l5rows || []) as Array<{ id: string; parent_id: string }>
      if (l5List.length === 0) {
        if (!cancelled) {
          setSubtopicProgress(
            Object.fromEntries(l4Ids.map((id) => [id, { total: 0, covered: 0 }])),
          )
        }
        return
      }

      const l5Ids = l5List.map((r) => r.id)
      const { data: mats } = await (supabase as any)
        .from("material_cards")
        .select("skill_id")
        .in("skill_id", l5Ids)
        .eq("status", "published")

      const withMat = new Set(
        (mats || []).map((m: { skill_id: string }) => m.skill_id),
      )

      const l5ByL4 = new Map<string, string[]>()
      for (const row of l5List) {
        if (!withMat.has(row.id)) continue
        if (!l5ByL4.has(row.parent_id)) l5ByL4.set(row.parent_id, [])
        l5ByL4.get(row.parent_id)!.push(row.id)
      }

      const flatIds = l5List.filter((r) => withMat.has(r.id)).map((r) => r.id)
      const { data: uss } = await supabase
        .from("user_skill_state")
        .select("micro_skill_id, is_covered")
        .eq("user_id", user.id)
        .in("micro_skill_id", flatIds)

      const coveredSet = new Set(
        (uss || [])
          .filter((r) => r.is_covered)
          .map((r) => r.micro_skill_id as string),
      )

      const next: Record<string, { total: number; covered: number }> = {}
      for (const l4 of subtopics) {
        const ids = l5ByL4.get(l4.id) || []
        next[l4.id] = {
          total: ids.length,
          covered: ids.filter((id) => coveredSet.has(id)).length,
        }
      }
      if (!cancelled) setSubtopicProgress(next)
    }

    loadProgress()
    return () => {
      cancelled = true
    }
  }, [subtopics, activeExamId, supabase])

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
        // Get L5 skills under this L4 — only for active exam (exclude exam_id null)
        let skillsQuery = (supabase as any)
          .from("taxonomy_nodes")
          .select("id, name, code, level, parent_id")
          .eq("parent_id", subtopicId)
          .eq("level", 5)
        if (activeExamId) {
          skillsQuery = skillsQuery.eq("exam_id", activeExamId)
        }
        const { data: skillsData, error: skillsError } = await skillsQuery.order("code")

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
    [expanded, subtopics, supabase, activeExamId],
  )

  useEffect(() => {
    if (
      l2Filter !== "all" &&
      !l2Options.some((o) => o.id === l2Filter)
    ) {
      setL2Filter("all")
    }
  }, [l2Options, l2Filter])

  const filteredSubtopics = useMemo(() => {
    if (l2Filter === "all") return subtopics
    return subtopics.filter((s) => l4ToL2Id[s.id] === l2Filter)
  }, [subtopics, l2Filter, l4ToL2Id])

  const l3Groups = useMemo(() => {
    const map = new Map<string, { l3: TaxonomyNode; l4s: TaxonomyNode[] }>()
    for (const l4 of filteredSubtopics) {
      const pid = l4.parent_id
      if (!pid) continue
      const l3 = l3ById[pid]
      if (!l3) continue
      if (!map.has(pid)) map.set(pid, { l3, l4s: [] })
      map.get(pid)!.l4s.push(l4)
    }
    const entries = [...map.entries()].sort((a, b) =>
      (a[1].l3.code || a[1].l3.name).localeCompare(
        b[1].l3.code || b[1].l3.name,
        "id",
      ),
    )
    for (const [, g] of entries) {
      g.l4s.sort((x, y) =>
        (x.code || x.name).localeCompare(y.code || y.name, "id"),
      )
    }
    return entries
  }, [filteredSubtopics, l3ById])

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
      available: false,
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
      <div className="max-w-2xl md:max-w-7xl mx-auto py-6">
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
                className={cn(
                  "flex-1 border-2 border-border shadow-brutal transition-all",
                  mode.available
                    ? "cursor-pointer hover:-translate-y-0.5"
                    : "cursor-default opacity-50",
                )}
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

        {/* Materi per subtopik — accordion + skill cards */}
        <div className="mb-0">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t("section.materiTree", { fallback: "Materi per subtopik" })}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("section.materiTreeHint", {
              fallback: "Buka topik untuk latihan atau baca materi per skill",
            })}
          </p>
        </div>

        {!isLoading && subtopics.length > 0 && (
          <div
            className="flex flex-wrap gap-2 mt-5 mb-8"
            role="tablist"
            aria-label={t("filters.l2Label", { fallback: "Filter mapel" })}
          >
            <button
              type="button"
              role="tab"
              aria-selected={l2Filter === "all"}
              className={cn(
                "rounded-full border-2 border-border px-4 py-2 text-sm font-semibold shadow-brutal-sm transition-all touch-target",
                l2Filter === "all"
                  ? "bg-orange-500 text-white hover:bg-orange-600"
                  : "bg-white text-foreground hover:bg-muted/40",
              )}
              onClick={() => setL2Filter("all")}
            >
              {t("filters.all", { fallback: "Semua" })}
            </button>
            {l2Options.map((l2) => (
              <button
                key={l2.id}
                type="button"
                role="tab"
                aria-selected={l2Filter === l2.id}
                className={cn(
                  "rounded-full border-2 border-border px-4 py-2 text-sm font-semibold shadow-brutal-sm transition-all touch-target max-w-full text-left",
                  l2Filter === l2.id
                    ? "bg-orange-500 text-white hover:bg-orange-600"
                    : "bg-white text-foreground hover:bg-muted/40",
                )}
                onClick={() => setL2Filter(l2.id)}
              >
                <span className="line-clamp-2">{l2.name}</span>
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : subtopics.length === 0 ? (
          <Card className="border-2 border-border shadow-brutal rounded-2xl">
            <CardContent className="py-8 text-center text-muted-foreground">
              {t("empty.noTopics", { fallback: "Belum ada topik materi." })}
            </CardContent>
          </Card>
        ) : filteredSubtopics.length === 0 ? (
          <Card className="border-2 border-border shadow-brutal rounded-2xl">
            <CardContent className="py-8 text-center text-muted-foreground">
              {t("empty.noTopicsForFilter", {
                fallback: "Tidak ada materi untuk filter ini.",
              })}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {l3Groups.map(([l3Id, group]) => (
              <section key={l3Id} aria-labelledby={`l3-heading-${l3Id}`}>
                <h3
                  id={`l3-heading-${l3Id}`}
                  className="text-xs font-bold uppercase tracking-wide text-muted-foreground px-1 mb-3"
                >
                  {group.l3.name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                  {group.l4s.map((st) => {
                    const isExpanded = expanded[st.id] !== undefined
                    const isLoadingSt = loadingExpand === st.id
                    const prog = subtopicProgress[st.id]
                    const total = prog?.total ?? 0
                    const covered = prog?.covered ?? 0
                    const pct =
                      total === 0 ? 0 : Math.round((covered / total) * 100)

                    return (
                      <div
                        key={st.id}
                        className="rounded-2xl border-2 border-border bg-card shadow-brutal overflow-hidden"
                      >
                        <button
                          type="button"
                          className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/25 transition-colors"
                          onClick={() => toggleExpand(st.id)}
                        >
                          <div
                            className={cn(
                              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm",
                              total === 0
                                ? "bg-muted-foreground/40"
                                : "bg-rose-900",
                            )}
                          >
                            {total === 0 ? "—" : `${pct}%`}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-foreground truncate">
                              {st.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {prog === undefined
                                ? t("accordion.loading", {
                                    fallback: "Memuat…",
                                  })
                                : total === 0
                                  ? t("accordion.emptySkills", {
                                      fallback:
                                        "Belum ada skill dengan materi",
                                    })
                                  : t("accordion.progressLine", {
                                      covered,
                                      total,
                                      fallback: `${covered} dari ${total} selesai`,
                                    })}
                            </p>
                          </div>
                          {isLoadingSt ? (
                            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" />
                          ) : isExpanded ? (
                            <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                          )}
                        </button>

                        {isExpanded && expanded[st.id] && (
                          <div className="px-3 pb-4 pt-0 space-y-3 bg-muted/15 border-t border-border/60">
                            {expanded[st.id]!.skills.length === 0 ? (
                              <p className="text-sm text-muted-foreground py-4 text-center">
                                {t("empty.noSkills", {
                                  fallback: "Tidak ada skill dengan materi.",
                                })}
                              </p>
                            ) : (
                              expanded[st.id]!.skills.map((skill) => {
                                const points =
                                  skill.coverage?.total_points ?? 0
                                const isCovered =
                                  skill.coverage?.is_covered ?? false

                                return (
                                  <div
                                    key={skill.id}
                                    className="rounded-xl border-2 border-border bg-background p-4 shadow-brutal-sm"
                                  >
                                    <div className="flex gap-3">
                                      <div
                                        className={cn(
                                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 bg-muted/30",
                                          isCovered
                                            ? "border-emerald-500/80 bg-emerald-50"
                                            : "border-muted-foreground/25",
                                        )}
                                      >
                                        {isCovered ? (
                                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                        ) : (
                                          <Circle className="h-5 w-5 text-muted-foreground/35" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0 pt-0.5">
                                        <p className="font-semibold text-foreground leading-snug">
                                          {skill.name}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-0.5">
                                          {isCovered
                                            ? t("skill.done", {
                                                fallback: "Selesai",
                                              })
                                            : t("skill.pointsLine", {
                                                points,
                                                fallback: `${points}/20 poin`,
                                              })}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                      <Button
                                        type="button"
                                        className="flex-1 rounded-full bg-orange-500 hover:bg-orange-600 text-white border-2 border-border shadow-brutal-sm h-10 touch-target"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          router.push(
                                            `/review/${skill.id}/drill?from=review`,
                                          )
                                        }}
                                      >
                                        <Pencil className="h-4 w-4 mr-2 shrink-0" />
                                        {t("skill.latihan", {
                                          fallback: "Latihan",
                                        })}
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1 rounded-full border-2 border-sky-600 text-sky-800 bg-white hover:bg-sky-50 h-10 touch-target"
                                        disabled={!skill.hasMaterialCard}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          router.push(
                                            `/review/${skill.id}?from=review`,
                                          )
                                        }}
                                      >
                                        <BookOpen className="h-4 w-4 mr-2 shrink-0" />
                                        {t("skill.materi", {
                                          fallback: "Materi",
                                        })}
                                      </Button>
                                    </div>
                                  </div>
                                )
                              })
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

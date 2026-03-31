"use client"

/**
 * Student Review Page (T-041 + T-042)
 * L2 section headers → L3 accordions → L5 skill cards (all L5 under an L3 combined)
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

interface ExpandedL3 extends TaxonomyNode {
  skills: (TaxonomyNode & {
    coverage: SkillCoverage | null
    hasMaterialCard: boolean
  })[]
}

/** Accordion ring: red (low) → amber (mid) → green (high). */
function accordionProgressToneClass(pct: number): string {
  if (pct <= 33) return "bg-rose-700 text-white"
  if (pct <= 66) return "bg-amber-500 text-neutral-950"
  return "bg-emerald-600 text-white"
}

export default function ReviewPage() {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useTranslation("review")
  const { t: tc } = useTranslation("common")

  const [isLoading, setIsLoading] = useState(true)
  const [activeExamId, setActiveExamId] = useState<string | null>(null)
  /** L3 nodes that have at least one L5 with published materi (via L4). */
  const [l3Topics, setL3Topics] = useState<TaxonomyNode[]>([])
  const [expanded, setExpanded] = useState<Record<string, ExpandedL3 | null>>({})
  const [loadingExpand, setLoadingExpand] = useState<string | null>(null)
  const [topicProgress, setTopicProgress] = useState<
    Record<string, { total: number; covered: number }>
  >({})
  const [l2Options, setL2Options] = useState<{ id: string; name: string }[]>([])
  const [l3ToL2Id, setL3ToL2Id] = useState<Record<string, string>>({})
  const [l2Filter, setL2Filter] = useState<string>("all")

  // Fetch L3 topics: any L3 that has ≥1 L5 with published material under its L4 children
  useEffect(() => {
    async function fetchL3Topics() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          setL3Topics([])
          setL2Options([])
          setL3ToL2Id({})
          setIsLoading(false)
          return
        }

        const examId = await getActiveExamId(supabase, user.id)
        setActiveExamId(examId)

        if (!examId) {
          setL3Topics([])
          setL2Options([])
          setL3ToL2Id({})
          setIsLoading(false)
          return
        }

        const { data: materialData } = await (supabase as any)
          .from("material_cards")
          .select("skill_id")
          .eq("status", "published")

        const l5SkillIds = [
          ...new Set(
            (materialData || []).map((m: { skill_id: string }) => m.skill_id),
          ),
        ]
        if (l5SkillIds.length === 0) {
          setL3Topics([])
          setL2Options([])
          setL3ToL2Id({})
          setIsLoading(false)
          return
        }

        const { data: l5Rows } = await (supabase as any)
          .from("taxonomy_nodes")
          .select("id, parent_id")
          .in("id", l5SkillIds)
          .eq("level", 5)
          .eq("exam_id", examId)

        const l5List = (l5Rows || []) as Array<{ id: string; parent_id: string }>
        if (l5List.length === 0) {
          setL3Topics([])
          setL2Options([])
          setL3ToL2Id({})
          setIsLoading(false)
          return
        }

        const l4Ids = [...new Set(l5List.map((r) => r.parent_id))]

        const { data: l4Rows } = await (supabase as any)
          .from("taxonomy_nodes")
          .select("id, parent_id")
          .in("id", l4Ids)
          .eq("level", 4)
          .eq("exam_id", examId)

        const l4List = (l4Rows || []) as Array<{
          id: string
          parent_id: string | null
        }>
        const l3Ids = [
          ...new Set(
            l4List.map((l) => l.parent_id).filter((id): id is string => !!id),
          ),
        ]
        if (l3Ids.length === 0) {
          setL3Topics([])
          setL2Options([])
          setL3ToL2Id({})
          setIsLoading(false)
          return
        }

        const { data: l3Data, error: l3Err } = await (supabase as any)
          .from("taxonomy_nodes")
          .select("id, name, code, level, parent_id")
          .in("id", l3Ids)
          .eq("level", 3)
          .eq("is_active", true)
          .eq("exam_id", examId)
          .order("code")

        if (l3Err) throw l3Err
        const allL3 = (l3Data as TaxonomyNode[]) || []

        const nextL3ToL2: Record<string, string> = {}
        for (const l3 of allL3) {
          if (l3.parent_id) nextL3ToL2[l3.id] = l3.parent_id
        }

        const l2Ids = [
          ...new Set(
            allL3.map((n) => n.parent_id).filter((id): id is string => !!id),
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
          const l2List =
            (l2Rows as { id: string; name: string; code: string }[]) || []
          l2Sorted = [...l2List]
            .sort((a, b) =>
              (a.code || a.name).localeCompare(b.code || b.name, "id"),
            )
            .map((n) => ({ id: n.id, name: n.name }))
        }

        setL3Topics(allL3)
        setL3ToL2Id(nextL3ToL2)
        setL2Options(l2Sorted)
      } catch (err) {
        console.error("Failed to fetch review topics:", err)
        setL3Topics([])
        setL2Options([])
        setL3ToL2Id({})
      } finally {
        setIsLoading(false)
      }
    }
    fetchL3Topics()
  }, [])

  // Per-L3 progress (all L5 with materi under that L3, any L4)
  useEffect(() => {
    if (!activeExamId || l3Topics.length === 0) return
    let cancelled = false

    async function loadProgress() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const l3Ids = l3Topics.map((s) => s.id)

      const { data: l4rows } = await (supabase as any)
        .from("taxonomy_nodes")
        .select("id, parent_id")
        .in("parent_id", l3Ids)
        .eq("level", 4)
        .eq("exam_id", activeExamId)

      const l4List = (l4rows || []) as Array<{ id: string; parent_id: string }>
      if (l4List.length === 0) {
        if (!cancelled) {
          setTopicProgress(
            Object.fromEntries(l3Ids.map((id) => [id, { total: 0, covered: 0 }])),
          )
        }
        return
      }

      const l4ToL3 = new Map(l4List.map((r) => [r.id, r.parent_id]))
      const l4Ids = l4List.map((r) => r.id)

      const { data: l5rows } = await (supabase as any)
        .from("taxonomy_nodes")
        .select("id, parent_id")
        .in("parent_id", l4Ids)
        .eq("level", 5)
        .eq("exam_id", activeExamId)

      const l5List = (l5rows || []) as Array<{ id: string; parent_id: string }>
      if (l5List.length === 0) {
        if (!cancelled) {
          setTopicProgress(
            Object.fromEntries(l3Ids.map((id) => [id, { total: 0, covered: 0 }])),
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

      const l5IdsForL3 = new Map<string, string[]>()
      for (const row of l5List) {
        if (!withMat.has(row.id)) continue
        const l3Id = l4ToL3.get(row.parent_id)
        if (!l3Id) continue
        if (!l5IdsForL3.has(l3Id)) l5IdsForL3.set(l3Id, [])
        l5IdsForL3.get(l3Id)!.push(row.id)
      }

      const flatIds = [...new Set([...l5IdsForL3.values()].flat())]
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
      for (const l3 of l3Topics) {
        const ids = l5IdsForL3.get(l3.id) || []
        next[l3.id] = {
          total: ids.length,
          covered: ids.filter((id) => coveredSet.has(id)).length,
        }
      }
      if (!cancelled) setTopicProgress(next)
    }

    loadProgress()
    return () => {
      cancelled = true
    }
  }, [l3Topics, activeExamId, supabase])

  const toggleExpand = useCallback(
    async (l3Id: string) => {
      if (expanded[l3Id] !== undefined) {
        setExpanded((prev) => {
          const next = { ...prev }
          delete next[l3Id]
          return next
        })
        return
      }

      setLoadingExpand(l3Id)
      try {
        const { data: l4Children } = await (supabase as any)
          .from("taxonomy_nodes")
          .select("id")
          .eq("parent_id", l3Id)
          .eq("level", 4)
          .eq("exam_id", activeExamId)

        const l4Ids = ((l4Children || []) as { id: string }[]).map((r) => r.id)
        if (l4Ids.length === 0) {
          const topic = l3Topics.find((x) => x.id === l3Id)
          if (topic) {
            setExpanded((prev) => ({
              ...prev,
              [l3Id]: { ...topic, skills: [] },
            }))
          }
          return
        }

        let skillsQuery = (supabase as any)
          .from("taxonomy_nodes")
          .select("id, name, code, level, parent_id")
          .in("parent_id", l4Ids)
          .eq("level", 5)
        if (activeExamId) {
          skillsQuery = skillsQuery.eq("exam_id", activeExamId)
        }
        const { data: skillsData, error: skillsError } =
          await skillsQuery.order("code")

        if (skillsError) throw skillsError
        const skills = (skillsData as TaxonomyNode[]) || []

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

        const topic = l3Topics.find((s) => s.id === l3Id)!
        const skillsWithMeta = skills.map((skill) => ({
          ...skill,
          coverage: coverageMap[skill.id] || null,
          hasMaterialCard: materialSkillIds.has(skill.id),
        }))
        setExpanded((prev) => ({
          ...prev,
          [l3Id]: {
            ...topic,
            skills: skillsWithMeta.filter((s) => s.hasMaterialCard),
          },
        }))
      } catch (err) {
        console.error("Failed to expand topic:", err)
      } finally {
        setLoadingExpand(null)
      }
    },
    [expanded, l3Topics, supabase, activeExamId],
  )

  useEffect(() => {
    if (l2Filter !== "all" && !l2Options.some((o) => o.id === l2Filter)) {
      setL2Filter("all")
    }
  }, [l2Options, l2Filter])

  const filteredL3 = useMemo(() => {
    if (l2Filter === "all") return l3Topics
    return l3Topics.filter((l3) => l3ToL2Id[l3.id] === l2Filter)
  }, [l3Topics, l2Filter, l3ToL2Id])

  const l2ById = useMemo(() => {
    const m: Record<string, { id: string; name: string }> = {}
    for (const o of l2Options) m[o.id] = o
    return m
  }, [l2Options])

  /** L2 section → L3 accordions (subtitle = L2, accordion = L3) */
  const l2Sections = useMemo(() => {
    const map = new Map<
      string,
      { l2: { id: string; name: string }; l3s: TaxonomyNode[] }
    >()
    for (const l3 of filteredL3) {
      const l2Id = l3ToL2Id[l3.id]
      if (!l2Id) continue
      const l2 = l2ById[l2Id]
      if (!l2) continue
      if (!map.has(l2Id)) map.set(l2Id, { l2, l3s: [] })
      map.get(l2Id)!.l3s.push(l3)
    }
    const entries = [...map.entries()].sort((a, b) =>
      (a[1].l2.name || "").localeCompare(b[1].l2.name || "", "id"),
    )
    for (const [, g] of entries) {
      g.l3s.sort((x, y) =>
        (x.code || x.name).localeCompare(y.code || y.name, "id"),
      )
    }
    return entries
  }, [filteredL3, l3ToL2Id, l2ById])

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
      <div className="mx-auto max-w-2xl py-6 md:max-w-7xl">
        <div className="mb-6">
          <h1 className="mb-1 text-3xl font-bold">
            {t("title", { fallback: "Review" })}
          </h1>
          <p className="text-muted-foreground">
            {t("subtitle", {
              fallback: "Browse topics and review material cards",
            })}
          </p>
        </div>

        <div className="mb-6 flex gap-3">
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
                <CardContent className="flex items-center gap-3 p-3">
                  <div
                    className={`${mode.color} rounded-lg border border-border p-2`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{mode.name}</div>
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

        {!isLoading && l3Topics.length > 0 && (
          <div
            className="mb-8 mt-5 flex flex-wrap gap-2"
            role="tablist"
            aria-label={t("filters.l2Label", { fallback: "Filter mapel" })}
          >
            <button
              type="button"
              role="tab"
              aria-selected={l2Filter === "all"}
              className={cn(
                "touch-target rounded-full border-2 border-border px-4 py-2 text-sm font-semibold shadow-brutal-sm transition-all",
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
                  "touch-target max-w-full rounded-full border-2 border-border px-4 py-2 text-left text-sm font-semibold shadow-brutal-sm transition-all",
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
        ) : l3Topics.length === 0 ? (
          <Card className="rounded-2xl border-2 border-border shadow-brutal">
            <CardContent className="py-8 text-center text-muted-foreground">
              {t("empty.noTopics", { fallback: "Belum ada topik materi." })}
            </CardContent>
          </Card>
        ) : filteredL3.length === 0 ? (
          <Card className="rounded-2xl border-2 border-border shadow-brutal">
            <CardContent className="py-8 text-center text-muted-foreground">
              {t("empty.noTopicsForFilter", {
                fallback: "Tidak ada materi untuk filter ini.",
              })}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-10">
            {l2Sections.map(([l2Id, section]) => (
              <section key={l2Id} aria-labelledby={`l2-heading-${l2Id}`}>
                <h2
                  id={`l2-heading-${l2Id}`}
                  className="mb-4 px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground"
                >
                  {section.l2.name}
                </h2>
                <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {section.l3s.map((st) => {
                    const isExpanded = expanded[st.id] !== undefined
                    const isLoadingSt = loadingExpand === st.id
                    const prog = topicProgress[st.id]
                    const total = prog?.total ?? 0
                    const covered = prog?.covered ?? 0
                    const pct =
                      total === 0 ? 0 : Math.round((covered / total) * 100)

                    return (
                      <div
                        key={st.id}
                        className="overflow-hidden rounded-2xl border-2 border-border bg-card shadow-brutal"
                      >
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/25"
                          onClick={() => toggleExpand(st.id)}
                        >
                          <div
                            className={cn(
                              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm",
                              total === 0
                                ? "bg-muted-foreground/40 text-white"
                                : accordionProgressToneClass(pct),
                            )}
                          >
                            {total === 0 ? "—" : `${pct}%`}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-bold text-foreground">
                              {st.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {prog === undefined
                                ? t("accordion.loading", {
                                    fallback: "Memuat…",
                                  })
                                : total === 0
                                  ? t("accordion.emptySkills", {
                                      fallback: "Belum ada skill dengan materi",
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
                          <div className="space-y-3 border-t border-border/60 bg-muted/15 px-3 pb-4 pt-0">
                            {expanded[st.id]!.skills.length === 0 ? (
                              <p className="py-4 text-center text-sm text-muted-foreground">
                                {t("empty.noSkills", {
                                  fallback: "Tidak ada skill dengan materi.",
                                })}
                              </p>
                            ) : (
                              expanded[st.id]!.skills.map((skill) => {
                                const points = skill.coverage?.total_points ?? 0
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
                                      <div className="min-w-0 flex-1 pt-0.5">
                                        <p className="font-semibold leading-snug text-foreground">
                                          {skill.name}
                                        </p>
                                        <p className="mt-0.5 text-sm text-muted-foreground">
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
                                    <div className="mt-4 flex gap-2">
                                      <Button
                                        type="button"
                                        className="touch-target h-10 flex-1 rounded-full border-2 border-border bg-orange-500 text-white shadow-brutal-sm hover:bg-orange-600"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          router.push(
                                            `/review/${skill.id}/drill?from=review`,
                                          )
                                        }}
                                      >
                                        <Pencil className="mr-2 h-4 w-4 shrink-0" />
                                        {t("skill.latihan", {
                                          fallback: "Latihan",
                                        })}
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        className="touch-target h-10 flex-1 rounded-full border-2 border-sky-600 bg-white text-sky-800 hover:bg-sky-50"
                                        disabled={!skill.hasMaterialCard}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          router.push(
                                            `/review/${skill.id}?from=review`,
                                          )
                                        }}
                                      >
                                        <BookOpen className="mr-2 h-4 w-4 shrink-0" />
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

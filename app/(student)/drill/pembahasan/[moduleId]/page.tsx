"use client"

/**
 * Pembahasan (Answer Review) Page — V3 (F-003)
 *
 * Shows all questions from a completed module with:
 * - User's answer highlighted (correct=green, wrong=red)
 * - Explanation text with math rendering
 * - Material card link if a published card exists for the skill
 */

import { useEffect, useState } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Question } from "@/lib/assessment/types"
import { QuestionDisplay } from "@/components/assessment/QuestionDisplay"
import { AnswerOptions } from "@/components/assessment/AnswerOptions"
import { TrueFalseOptions } from "@/components/assessment/TrueFalseOptions"
import { TableOptions } from "@/components/assessment/TableOptions"
import { FillInInput } from "@/components/assessment/FillInInput"
import { MathRenderer } from "@/components/assessment/MathRenderer"
import { DocumentRenderer } from "@/lib/content-renderer/DocumentRenderer"
import type { ContentBlock } from "@/lib/content-renderer/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react"

/* ── Types ─────────────────────────────────────────────── */

interface AttemptData {
  question_id: string
  user_answer: string
  is_correct: boolean
  time_spent_sec: number
}

interface MaterialCardRef {
  skill_id: string
  title: string
}

interface PembahasanData {
  moduleName: string
  questions: Question[]
  attempts: Map<string, AttemptData>
  materialCards: Map<string, MaterialCardRef> // keyed by skill_id
  score: number
  correctCount: number
}

/* ── Data fetcher ──────────────────────────────────────── */

async function fetchPembahasanData(moduleId: string): Promise<PembahasanData> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  // 1. Fetch module with module_questions (ordered)
  const { data: moduleData, error: moduleError } = await supabase
    .from("modules")
    .select(`
      name,
      module_questions(question_id, order_index)
    `)
    .eq("id", moduleId)
    .single()

  if (moduleError || !moduleData) throw new Error("Module not found")

  const mqs = (moduleData.module_questions || []) as { question_id: string; order_index: number }[]
  const questionIds = mqs
    .sort((a, b) => a.order_index - b.order_index)
    .map((mq) => mq.question_id)

  // 2. Parallel: questions, attempts, material cards
  const [questionsRes, attemptsRes] = await Promise.all([
    supabase
      .from("questions")
      .select(
        "id, micro_skill_id, difficulty, cognitive_level, question_format, stem, stem_images, options, correct_answer, explanation, explanation_images, construct_weights, content",
      )
      .in("id", questionIds),
    supabase
      .from("attempts")
      .select("question_id, user_answer, is_correct, time_spent_sec")
      .eq("user_id", user.id)
      .eq("module_id", moduleId)
      .order("attempted_at", { ascending: false }),
  ])

  // Sort questions in module order
  const questionsMap = new Map<string, Question>()
  for (const q of (questionsRes.data || []) as Question[]) {
    questionsMap.set(q.id, q)
  }
  const questions = questionIds
    .map((id) => questionsMap.get(id))
    .filter(Boolean) as Question[]

  // Build attempts map (latest per question)
  const attempts = new Map<string, AttemptData>()
  for (const a of (attemptsRes.data || []) as AttemptData[]) {
    if (!attempts.has(a.question_id)) {
      attempts.set(a.question_id, a)
    }
  }

  // Collect unique skill IDs that have questions
  const skillIds = [...new Set(questions.map((q) => q.micro_skill_id))]

  // Fetch published material cards for these skills
  const materialCards = new Map<string, MaterialCardRef>()
  if (skillIds.length > 0) {
    const { data: cards } = await supabase
      .from("material_cards")
      .select("skill_id, title")
      .in("skill_id", skillIds)
      .eq("status", "published")

    for (const c of (cards || []) as MaterialCardRef[]) {
      materialCards.set(c.skill_id, c)
    }
  }

  const correctCount = questions.filter(
    (q) => attempts.get(q.id)?.is_correct,
  ).length
  const score =
    questions.length > 0 ? (correctCount / questions.length) * 100 : 0

  return {
    moduleName: moduleData.name,
    questions,
    attempts,
    materialCards,
    score,
    correctCount,
  }
}

/* ── Helper: normalize question format ─────────────────── */

function normalizeFormat(format?: string) {
  return (format || "").toLowerCase().replace(/[_\s-]/g, "")
}

/** Parse user_answer from attempts table (stored as JSON {"selected": "B"} or plain string) */
function parseUserAnswer(raw: string | null | undefined): string {
  if (raw == null || raw === "") return ""
  try {
    const parsed = JSON.parse(raw) as { selected?: string }
    if (typeof parsed?.selected === "string") return parsed.selected
  } catch {
    /* not JSON, use as-is */
  }
  return String(raw)
}

/** Extract option content blocks from question.content.answer for DocumentRenderer */
function extractOptionContentBlocks(question: Question): Record<string, { blocks: unknown[] }> | undefined {
  const answer = question.content?.answer as { options?: Array<{ key: string; content?: { blocks?: unknown[] } }> } | undefined
  if (!answer?.options) return undefined
  const map: Record<string, { blocks: unknown[] }> = {}
  for (const opt of answer.options) {
    if (opt.content?.blocks?.length) {
      map[opt.key] = { blocks: opt.content.blocks }
    }
  }
  return Object.keys(map).length ? map : undefined
}

/* ── Component ─────────────────────────────────────────── */

export default function PembahasanPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const moduleId = params.moduleId as string
  const skillId = searchParams.get("skillId")

  const [data, setData] = useState<PembahasanData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPembahasanData(moduleId)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false))
  }, [moduleId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-drill/10 p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="h-8 w-48 rounded bg-muted animate-skeleton-pulse" />
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 rounded-xl border-2 border-border bg-muted/40 animate-skeleton-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-surface-drill/10 p-4 flex items-center justify-center">
        <Card className="border-2 max-w-md w-full">
          <CardContent className="py-8 text-center space-y-3">
            <XCircle className="h-10 w-10 mx-auto text-destructive" />
            <p className="font-semibold">Gagal memuat pembahasan</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={() => router.back()}>
              Kembali
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-drill/10 p-4 pb-24">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">
              Pembahasan: {data.moduleName}
            </h1>
            <p className="text-sm text-muted-foreground">
              Skor: {data.correctCount}/{data.questions.length} benar (
              {Math.round(data.score)}%)
            </p>
          </div>
        </div>

        {/* Questions */}
        {data.questions.map((question, index) => {
          const attempt = data.attempts.get(question.id)
          const isCorrect = attempt?.is_correct ?? false
          const userAnswer = parseUserAnswer(attempt?.user_answer)
          const format = normalizeFormat(question.question_format)
          const materialCard = data.materialCards.get(question.micro_skill_id)
          const content = question.content as { explanation?: { blocks?: unknown[] } } | undefined
          const explanationBlocks = content?.explanation?.blocks

          return (
            <Card
              key={question.id}
              className={`border-2 ${
                isCorrect ? "border-status-strong/40" : "border-destructive/40"
              } overflow-hidden`}
            >
              {/* Status banner */}
              <div
                className={`px-4 py-2 flex items-center gap-2 text-sm font-medium ${
                  isCorrect
                    ? "bg-status-strong/10 text-status-strong"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {isCorrect ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Soal {index + 1} / {data.questions.length}
                {isCorrect ? " — Benar" : " — Salah"}
                {attempt && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {attempt.time_spent_sec}s
                  </span>
                )}
              </div>

              <CardContent className="pt-4 space-y-4">
                {/* Question stem */}
                <QuestionDisplay
                  stem={question.stem}
                  stemImages={question.stem_images || []}
                  questionNumber={index + 1}
                  contentStimulus={
                    question.content?.stimulus as { blocks: unknown[] } | undefined
                  }
                />

                {/* Answer options in review mode */}
                <div className="pointer-events-none">
                  {(format === "mcq5" || format === "mcq4") && (
                    <>
                      <AnswerOptions
                        options={question.options as any}
                        selectedAnswer={userAnswer}
                        onAnswerChange={() => {}}
                        disabled
                        showCorrectAnswer={question.correct_answer}
                        optionKeys={
                          format === "mcq4" ? ["A", "B", "C", "D"] : undefined
                        }
                        optionContentBlocks={extractOptionContentBlocks(question)}
                      />
                      {!isCorrect && (
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                          <span className="text-muted-foreground">
                            Jawabanmu:{" "}
                            <span className="font-medium text-destructive">
                              {userAnswer || "(kosong)"}
                            </span>
                          </span>
                          <span className="text-muted-foreground">
                            Jawaban benar:{" "}
                            <span className="font-medium text-status-strong">
                              {question.correct_answer}
                            </span>
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  {format === "tf" && (
                    <>
                      <TrueFalseOptions
                        options={question.options as any}
                        selectedAnswer={userAnswer}
                        onAnswerChange={() => {}}
                        disabled
                        showCorrectAnswer={question.correct_answer}
                        optionContentBlocks={extractOptionContentBlocks(question)}
                      />
                      {!isCorrect && (
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                          <span className="text-muted-foreground">
                            Jawabanmu:{" "}
                            <span className="font-medium text-destructive">
                              {userAnswer || "(kosong)"}
                            </span>
                          </span>
                          <span className="text-muted-foreground">
                            Jawaban benar:{" "}
                            <span className="font-medium text-status-strong">
                              {question.correct_answer}
                            </span>
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  {(format === "mcktable" || format === "mctable") && (
                    <>
                      <TableOptions
                        options={question.options as any}
                        selectedAnswers={
                          userAnswer ? userAnswer.split(",").map((s) => s.trim()) : []
                        }
                        onAnswerChange={() => {}}
                        disabled
                        showCorrectAnswers={
                          question.correct_answer
                            ? question.correct_answer
                                .split(",")
                                .map((s) => s.trim())
                            : undefined
                        }
                      />
                      {!isCorrect && (
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                          <span className="text-muted-foreground">
                            Jawabanmu:{" "}
                            <span className="font-medium text-destructive">
                              {userAnswer || "(kosong)"}
                            </span>
                          </span>
                          <span className="text-muted-foreground">
                            Jawaban benar:{" "}
                            <span className="font-medium text-status-strong">
                              {question.correct_answer}
                            </span>
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  {format === "fillin" && (
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="text-muted-foreground">
                          Jawabanmu:{" "}
                        </span>
                        <span
                          className={
                            isCorrect
                              ? "text-status-strong"
                              : "text-destructive"
                          }
                        >
                          {userAnswer || "(kosong)"}
                        </span>
                      </div>
                      {!isCorrect && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">
                            Jawaban benar:{" "}
                          </span>
                          <span className="text-status-strong font-medium">
                            {question.correct_answer}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Explanation */}
                {(question.explanation || explanationBlocks?.length) && (
                  <div className="border-t-2 border-border pt-3">
                    <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      Pembahasan
                    </div>
                    <div className="text-sm leading-relaxed text-foreground/90">
                      {explanationBlocks?.length ? (
                        <DocumentRenderer blocks={explanationBlocks as ContentBlock[]} />
                      ) : (
                        <MathRenderer text={question.explanation} />
                      )}
                    </div>
                    {question.explanation_images &&
                      question.explanation_images.length > 0 && (
                        <div className="mt-2 flex gap-2 flex-wrap">
                          {question.explanation_images.map(
                            (img: string, idx: number) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={idx}
                                src={img}
                                alt={`Penjelasan gambar ${idx + 1}`}
                                className="rounded-lg border max-h-48 object-contain"
                              />
                            ),
                          )}
                        </div>
                      )}
                  </div>
                )}

                {/* Material card link */}
                {materialCard && (
                  <div className="border-t-2 border-border pt-3 w-full min-w-0">
                    <Button
                      variant="outline"
                      size="sm"
                      title={`Lihat Materi: ${materialCard.title}`}
                      className="w-full max-w-full min-w-0 justify-start gap-2 text-xs"
                      onClick={() =>
                        router.push(
                          `/review/${question.micro_skill_id}?from=pembahasan&moduleId=${moduleId}`,
                        )
                      }
                    >
                      <BookOpen className="h-3.5 w-3.5 shrink-0" />
                      <span className="min-w-0 flex-1 truncate text-left">
                        Lihat Materi: {materialCard.title}
                      </span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        {/* Bottom nav */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="brutal-outline"
            className="flex-1"
            onClick={() => {
              const q = new URLSearchParams({ retry: "1" })
              if (skillId) q.set("skillId", skillId)
              router.push(`/drill/drill/${moduleId}?${q.toString()}`)
            }}
          >
            Coba Lagi
          </Button>
          <Button
            className="flex-1"
            onClick={() =>
              router.push(
                skillId
                  ? `/review/${skillId}/drill?from=pembahasan&moduleId=${moduleId}`
                  : "/review",
              )
            }
          >
            {skillId ? "Kembali ke latihan skill" : "Kembali ke Review"}
          </Button>
        </div>
      </div>
    </div>
  )
}

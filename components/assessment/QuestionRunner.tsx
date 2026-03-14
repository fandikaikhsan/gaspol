"use client"

/**
 * QuestionRunner Component
 * Phase 2: Question Runner & Assessment Engine
 *
 * THE MOST CRITICAL & REUSED COMPONENT
 * Handles all question formats: MCQ5, MCQ4, TF, MCK-Table, Fill-in
 * Features: Timer, navigation, local state management
 */

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/lib/i18n"
import { Question, AssessmentSession } from "@/lib/assessment/types"
import { QuestionDisplay } from "./QuestionDisplay"
import { AnswerOptions } from "./AnswerOptions"
import { TrueFalseOptions } from "./TrueFalseOptions"
import { TableOptions } from "./TableOptions"
import { FillInInput } from "./FillInInput"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet"
import { useToast } from "@/hooks/use-toast"
import {
  Grid3X3,
  CheckCircle2,
  XCircle,
  BookOpen,
  RotateCcw,
  ArrowRight,
  Flag,
} from "lucide-react"

// Result data returned by the parent after submission
export interface ModuleResult {
  passed: boolean
  score: number // percentage 0-100
  correctCount: number
  totalQuestions: number
  passingThreshold: number // 0-1
  weakMaterialCards?: Array<{
    id: string
    skill_id: string
    title: string
    core_idea: string
    key_facts?: unknown
    common_mistakes?: unknown
    examples?: unknown
  }>
}

interface QuestionRunnerProps {
  questions: Question[]
  moduleId: string
  contextType: "baseline" | "drill" | "mock" | "recycle"
  contextId: string
  onComplete: (session: AssessmentSession) => void | Promise<void>
  onCompleteWithResult?: (session: AssessmentSession) => Promise<ModuleResult>
  onRetry?: () => void
  onContinue?: () => void
  onViewPembahasan?: () => void
  timeLimit?: number // in minutes, null = untimed
  showTimer?: boolean
  allowNavigation?: boolean
  autoSubmitOnTimeUp?: boolean
}

export function QuestionRunner({
  questions,
  moduleId,
  contextType,
  contextId,
  onComplete,
  onCompleteWithResult,
  onRetry,
  onContinue,
  onViewPembahasan,
  timeLimit,
  showTimer = true,
  allowNavigation = true,
  autoSubmitOnTimeUp = true,
}: QuestionRunnerProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation("common")

  // Result state for pass/fail screen (T-021)
  const [moduleResult, setModuleResult] = useState<ModuleResult | null>(null)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<
    Record<string, { answer: string; timeSpent: number; timestamp: Date }>
  >({})
  const [questionStartTime, setQuestionStartTime] = useState<Date>(new Date())
  const [sessionStartTime] = useState<Date>(new Date())
  const [timeElapsed, setTimeElapsed] = useState(0) // in seconds
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isQuestionPaletteOpen, setIsQuestionPaletteOpen] = useState(false)
  // T-034: Review-later flagged questions
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  // T-069: Points fly-up animation
  const [pointsFlyUp, setPointsFlyUp] = useState<{
    pts: number
    key: number
  } | null>(null)

  // T-035: Restore answers from localStorage on mount
  const storageKey = `qr-session-${moduleId}`
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.answers) {
          const restored: Record<
            string,
            { answer: string; timeSpent: number; timestamp: Date }
          > = {}
          for (const [k, v] of Object.entries(
            parsed.answers as Record<string, any>,
          )) {
            restored[k] = {
              answer: v.answer,
              timeSpent: v.timeSpent,
              timestamp: new Date(v.timestamp),
            }
          }
          setAnswers(restored)
        }
        if (typeof parsed.currentIndex === "number")
          setCurrentIndex(parsed.currentIndex)
        if (parsed.flagged) setFlagged(new Set(parsed.flagged))
      }
    } catch {
      /* ignore corrupt data */
    }
  }, [storageKey])

  // T-035: Persist answers to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          answers,
          currentIndex,
          flagged: Array.from(flagged),
        }),
      )
    } catch {
      /* storage full */
    }
  }, [answers, currentIndex, flagged, storageKey])

  const currentQuestion = questions[currentIndex]
  const totalQuestions = questions.length
  const progress = ((currentIndex + 1) / totalQuestions) * 100
  const isLastQuestion = currentIndex === totalQuestions - 1

  // T-033: Per-question timer — time spent on current question
  const [perQuestionElapsed, setPerQuestionElapsed] = useState(0)
  useEffect(() => {
    setPerQuestionElapsed(0)
    const timer = setInterval(
      () => setPerQuestionElapsed((prev) => prev + 1),
      1000,
    )
    return () => clearInterval(timer)
  }, [currentIndex])

  const normalizeFormat = (format?: string) =>
    (format || "").toLowerCase().replace(/[_\s-]/g, "")

  const isValidAnswer = useCallback(
    (answer: string | undefined, format?: string) => {
      if (typeof answer !== "string") return false

      const normalizedFormat = normalizeFormat(format)

      if (normalizedFormat === "mcktable" || normalizedFormat === "mctable") {
        return (
          answer
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean).length > 0
        )
      }

      return answer.trim().length > 0
    },
    [],
  )

  // Timer effect
  useEffect(() => {
    if (!showTimer) return

    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [showTimer])

  // Auto-submit on time up
  useEffect(() => {
    if (timeLimit && autoSubmitOnTimeUp && timeElapsed >= timeLimit * 60) {
      toast({
        title: t("assessment.timesUp"),
        description: t("assessment.timesUpDesc"),
      })
      handleFinish()
    }
  }, [timeElapsed, timeLimit, autoSubmitOnTimeUp])

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Get time remaining (if timed)
  const timeRemaining = timeLimit ? timeLimit * 60 - timeElapsed : null
  const isTimeWarning = timeRemaining !== null && timeRemaining < 300 // Last 5 minutes

  // Handle answer change
  const handleAnswerChange = (answer: string) => {
    const now = new Date()
    const timeSpent = Math.floor(
      (now.getTime() - questionStartTime.getTime()) / 1000,
    )

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        answer,
        timeSpent,
        timestamp: now,
      },
    }))
  }

  // Navigate to specific question
  const goToQuestion = useCallback(
    (index: number) => {
      if (!allowNavigation) return
      if (index < 0 || index >= totalQuestions) return

      setCurrentIndex(index)
      setQuestionStartTime(new Date())
    },
    [allowNavigation, totalQuestions],
  )

  // Next question — T-069: trigger points fly-up
  const handleNext = () => {
    if (!hasCurrentAnswer) return

    // T-069: Show points fly-up (contextual points based on difficulty)
    const diffMap: Record<string, number> = {
      easy: 1,
      medium: 2,
      hard: 5,
      L1: 1,
      L2: 2,
      L3: 5,
    }
    const pts = diffMap[currentQuestion.difficulty] || 1
    setPointsFlyUp({ pts, key: Date.now() })
    setTimeout(() => setPointsFlyUp(null), 700)

    if (isLastQuestion) {
      handleFinish()
    } else {
      setCurrentIndex((prev) => {
        const nextIndex = Math.min(prev + 1, totalQuestions - 1)
        setQuestionStartTime(new Date())
        return nextIndex
      })
    }
  }

  // Previous question
  const handlePrevious = () => {
    goToQuestion(currentIndex - 1)
  }

  // Finish assessment
  const handleFinish = async () => {
    // Check if all questions are answered
    const unansweredCount = questions.filter((q) => {
      const answerValue = answers[q.id]?.answer
      return !isValidAnswer(answerValue, q.question_format)
    }).length

    if (unansweredCount > 0) {
      const confirmed = window.confirm(
        t("question.unansweredWarning", { count: unansweredCount }),
      )
      if (!confirmed) return
    }

    setIsSubmitting(true)

    const session: AssessmentSession = {
      moduleId,
      questionIds: questions.map((q) => q.id),
      currentIndex,
      startedAt: sessionStartTime,
      answers,
    }

    try {
      if (onCompleteWithResult) {
        // Use result-returning callback for pass/fail UI
        const result = await onCompleteWithResult(session)
        // T-035: Clear persisted session on completion
        try {
          localStorage.removeItem(storageKey)
        } catch {}
        setModuleResult(result)
        setIsSubmitting(false)
      } else {
        // T-035: Clear persisted session on completion
        try {
          localStorage.removeItem(storageKey)
        } catch {}
        await onComplete(session)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("error.submissionFailed"),
        description: t("error.submissionFailedDesc"),
      })
      setIsSubmitting(false)
    }
  }

  // Get current answer
  const currentAnswer = answers[currentQuestion.id]?.answer || ""
  const hasCurrentAnswer = isValidAnswer(
    currentAnswer,
    currentQuestion.question_format,
  )

  // Build option content blocks from structured content when present
  const optionContentBlocks = (() => {
    const answer = currentQuestion.content?.answer as
      | { options?: Array<{ key: string; content?: { blocks?: unknown[] } }> }
      | undefined
    if (!answer?.options) return undefined
    const map: Record<string, { blocks: unknown[] }> = {}
    for (const opt of answer.options) {
      if (opt.content?.blocks?.length) {
        map[opt.key] = { blocks: opt.content.blocks }
      }
    }
    return Object.keys(map).length ? map : undefined
  })()

  // Render answer input based on question format
  const renderAnswerInput = () => {
    const normalizedFormat = normalizeFormat(currentQuestion.question_format)

    switch (normalizedFormat) {
      case "mcq5":
        return (
          <AnswerOptions
            options={currentQuestion.options as any}
            selectedAnswer={currentAnswer}
            onAnswerChange={handleAnswerChange}
            optionContentBlocks={optionContentBlocks}
          />
        )
      case "mcq4":
        return (
          <AnswerOptions
            options={currentQuestion.options as any}
            selectedAnswer={currentAnswer}
            onAnswerChange={handleAnswerChange}
            optionKeys={["A", "B", "C", "D"]}
            optionContentBlocks={optionContentBlocks}
          />
        )
      case "tf":
        return (
          <TrueFalseOptions
            options={currentQuestion.options as any}
            selectedAnswer={currentAnswer}
            onAnswerChange={handleAnswerChange}
            optionContentBlocks={optionContentBlocks}
          />
        )
      case "mcktable":
      case "mctable":
        return (
          <TableOptions
            options={currentQuestion.options as any}
            selectedAnswers={currentAnswer.split(",")}
            onAnswerChange={(answers) => handleAnswerChange(answers.join(","))}
          />
        )
      case "fillin":
        return (
          <FillInInput
            options={currentQuestion.options as any}
            value={currentAnswer}
            onChange={handleAnswerChange}
          />
        )
      default:
        return <div>{t("question.unsupported")}</div>
    }
  }

  const answered = questions.filter((q) =>
    isValidAnswer(answers[q.id]?.answer, q.question_format),
  ).length

  // T-021: PASS/FAIL RESULTS SCREEN
  if (moduleResult) {
    const scorePercent = Math.round(moduleResult.score)
    const thresholdPercent = Math.round(moduleResult.passingThreshold * 100)

    return (
      <div className="min-h-screen bg-background p-4 relative overflow-hidden">
        {/* T-068: Confetti animation on pass — 50 particles */}
        {moduleResult.passed && (
          <div
            className="fixed inset-0 pointer-events-none z-50"
            aria-hidden="true"
          >
            {Array.from({ length: 50 }).map((_, i) => {
              const colors = [
                "#FFD700",
                "#FF6B6B",
                "#4ECDC4",
                "#45B7D1",
                "#96CEB4",
                "#FFEAA7",
                "#DDA0DD",
                "#98D8C8",
              ]
              const color = colors[i % colors.length]
              const left = Math.random() * 100
              const delay = Math.random() * 2
              const size = 6 + Math.random() * 8
              return (
                <div
                  key={i}
                  className="absolute animate-confetti-fall"
                  style={{
                    left: `${left}%`,
                    top: -20,
                    width: size,
                    height: size,
                    backgroundColor: color,
                    borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                    animationDelay: `${delay}s`,
                    animationDuration: `${2 + Math.random() * 2}s`,
                  }}
                />
              )
            })}
          </div>
        )}

        <div className="max-w-2xl mx-auto pt-8">
          {/* Result Header */}
          <div className="text-center mb-8">
            {moduleResult.passed ? (
              <>
                <div className="mx-auto w-20 h-20 rounded-full bg-status-strong/20 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-12 h-12 text-status-strong" />
                </div>
                <h1 className="text-3xl font-bold mb-2">
                  🎉 {t("result.passed", { fallback: "Module Passed!" })}
                </h1>
                <p className="text-muted-foreground text-lg">
                  {t("result.passedDesc", {
                    fallback: "Great job! You met the passing threshold.",
                  })}
                </p>
              </>
            ) : (
              <>
                <div className="mx-auto w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mb-4">
                  <XCircle className="w-12 h-12 text-destructive" />
                </div>
                <h1 className="text-3xl font-bold mb-2">
                  {t("result.failed", { fallback: "Not Quite There" })}
                </h1>
                <p className="text-muted-foreground text-lg">
                  {t("result.failedDesc", {
                    fallback: "Review the material below and try again.",
                  })}
                </p>
              </>
            )}
          </div>

          {/* Score Card */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold">
                  {t("result.yourScore", { fallback: "Your Score" })}
                </span>
                <span
                  className={`text-3xl font-bold ${moduleResult.passed ? "text-status-strong" : "text-destructive"}`}
                >
                  {scorePercent}%
                </span>
              </div>
              <Progress value={scorePercent} className="h-3 mb-2" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>
                  {moduleResult.correctCount}/{moduleResult.totalQuestions}{" "}
                  {t("result.correct", { fallback: "correct" })}
                </span>
                <span>
                  {t("result.passingScore", { fallback: "Passing" })}:{" "}
                  {thresholdPercent}%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Weak Material Cards (on fail) */}
          {!moduleResult.passed &&
            moduleResult.weakMaterialCards &&
            moduleResult.weakMaterialCards.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">
                    {t("result.reviewMaterials", {
                      fallback: "Review These Topics",
                    })}
                  </h2>
                </div>
                <div className="space-y-3">
                  {moduleResult.weakMaterialCards.map((card) => (
                    <Card
                      key={card.id}
                      className="hover:shadow-brutal-sm transition-shadow"
                    >
                      <CardContent className="pt-4 pb-4">
                        <h3 className="font-semibold mb-1">{card.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {card.core_idea}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {onViewPembahasan && (
              <Button onClick={onViewPembahasan} className="w-full">
                <BookOpen className="w-4 h-4 mr-2" />
                Lihat Pembahasan
              </Button>
            )}
            <div className="flex gap-3">
              {onRetry && (
                <Button
                  variant="brutal-outline"
                  onClick={onRetry}
                  className="flex-1"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Coba Lagi
                </Button>
              )}
              <Button
                variant="outline"
                onClick={onContinue || (() => router.back())}
                className="flex-1"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Kembali ke Drill
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with timer and progress */}
        <div className="mb-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">
                {t("question.questionOf", {
                  current: currentIndex + 1,
                  total: totalQuestions,
                })}
              </h1>
              <p className="text-sm text-muted-foreground">
                {contextType === "baseline"
                  ? t("assessment.baseline")
                  : contextType === "drill"
                    ? t("assessment.practiceDrill")
                    : contextType === "mock"
                      ? t("assessment.mockTest")
                      : t("assessment.recycleCheckpoint")}
              </p>
            </div>

            {showTimer && (
              <div className="text-right">
                <div
                  className={`text-3xl font-bold ${isTimeWarning ? "text-destructive" : ""}`}
                >
                  {timeRemaining !== null
                    ? formatTime(timeRemaining)
                    : formatTime(timeElapsed)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {timeRemaining !== null
                    ? t("assessment.timeRemaining")
                    : t("assessment.timeElapsed")}
                </p>
              </div>
            )}
          </div>

          <Progress value={progress} className="h-2" />

          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline">
              {currentQuestion.difficulty.toUpperCase()}
            </Badge>
            <Badge variant="outline">{currentQuestion.cognitive_level}</Badge>
            <Badge variant="outline">{currentQuestion.question_format}</Badge>
            {/* T-033: Per-question elapsed time */}
            <Badge variant="outline" className="ml-auto">
              ⏱ {formatTime(perQuestionElapsed)}
            </Badge>
          </div>
        </div>

        {/* Question Card */}
        <Card className="mb-6 relative">
          {/* T-069: Points fly-up animation */}
          {pointsFlyUp && (
            <div
              key={pointsFlyUp.key}
              className="absolute -top-2 right-4 text-lg font-bold text-primary animate-points-fly pointer-events-none z-10"
            >
              +{pointsFlyUp.pts} pts
            </div>
          )}
          <CardHeader>
            <QuestionDisplay
              stem={currentQuestion.stem}
              stemImages={currentQuestion.stem_images}
              questionNumber={currentIndex + 1}
              contentStimulus={
                currentQuestion.content?.stimulus as { blocks: unknown[] } | undefined
              }
            />
          </CardHeader>

          <CardContent>{renderAnswerInput()}</CardContent>

          <CardFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button
                variant="brutal-outline"
                onClick={handlePrevious}
                disabled={
                  currentIndex === 0 || !allowNavigation || isSubmitting
                }
              >
                {t("button.previous")}
              </Button>
              {/* T-034: Review-later flag */}
              <Button
                variant={
                  flagged.has(currentQuestion.id) ? "brutal-secondary" : "ghost"
                }
                size="sm"
                onClick={() => {
                  setFlagged((prev) => {
                    const next = new Set(prev)
                    if (next.has(currentQuestion.id))
                      next.delete(currentQuestion.id)
                    else next.add(currentQuestion.id)
                    return next
                  })
                }}
                className="gap-1"
              >
                <Flag
                  className={`w-4 h-4 ${flagged.has(currentQuestion.id) ? "fill-current text-orange-500" : ""}`}
                />
                {t("question.reviewLater", { fallback: "Review Later" })}
              </Button>
            </div>

            <div className="flex gap-2">
              {/* Mobile-only: Jump to Question button opens bottom sheet */}
              {allowNavigation && (
                <Button
                  variant="brutal-secondary"
                  onClick={() => setIsQuestionPaletteOpen(true)}
                  disabled={isSubmitting}
                  className="md:hidden"
                >
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  {t("question.jump")}
                </Button>
              )}

              <Button
                onClick={handleNext}
                disabled={isSubmitting || !hasCurrentAnswer}
              >
                {isSubmitting
                  ? t("button.submitting")
                  : isLastQuestion
                    ? t("button.finish")
                    : t("button.next")}
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Question Grid Navigation - Desktop only */}
        {allowNavigation && (
          <Card className="hidden md:block">
            <CardHeader>
              <h3 className="font-semibold">{t("question.quickNavigation")}</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-10 gap-2">
                {questions.map((q, idx) => {
                  const isAnswered = isValidAnswer(
                    answers[q.id]?.answer,
                    q.question_format,
                  )
                  const isCurrent = idx === currentIndex
                  const isFlagged = flagged.has(q.id)

                  return (
                    <button
                      key={q.id}
                      onClick={() => goToQuestion(idx)}
                      disabled={isSubmitting}
                      className={`
                        aspect-square rounded-lg border-2 font-semibold text-sm
                        transition-all hover:scale-105 relative
                        ${isCurrent ? "bg-primary text-primary-foreground shadow-brutal-sm border-primary" : "border-border"}
                        ${!isCurrent && isAnswered ? "bg-secondary" : ""}
                        ${!isCurrent && !isAnswered ? "bg-background" : ""}
                        ${isFlagged ? "ring-2 ring-orange-400" : ""}
                      `}
                    >
                      {idx + 1}
                      {isFlagged && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-400 rounded-full" />
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="flex gap-4 mt-4 text-sm flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-primary border-2 border-border rounded" />
                  <span>{t("question.current")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-secondary border-2 border-border rounded" />
                  <span>{t("question.answered")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-background border-2 border-border rounded" />
                  <span>{t("question.unanswered")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-background border-2 border-border rounded ring-2 ring-orange-400" />
                  <span>{t("question.flagged", { fallback: "Flagged" })}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mobile Question Palette - Bottom Sheet */}
        <Sheet
          open={isQuestionPaletteOpen}
          onOpenChange={setIsQuestionPaletteOpen}
        >
          <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
            <SheetHeader className="text-left mb-4">
              <SheetTitle>{t("question.jumpToQuestion")}</SheetTitle>
              <SheetDescription>
                {t("question.answeredOf", { answered, total: totalQuestions })}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4">
              {/* Question Grid */}
              <div className="grid grid-cols-5 gap-3">
                {questions.map((q, idx) => {
                  const isAnswered = isValidAnswer(
                    answers[q.id]?.answer,
                    q.question_format,
                  )
                  const isCurrent = idx === currentIndex
                  const isFlagged = flagged.has(q.id)

                  return (
                    <SheetClose asChild key={q.id}>
                      <button
                        onClick={() => {
                          goToQuestion(idx)
                          setIsQuestionPaletteOpen(false)
                        }}
                        disabled={isSubmitting}
                        className={`
                          aspect-square rounded-xl border-2 border-border font-bold text-lg
                          transition-all active:scale-95 relative
                          ${isCurrent ? "bg-primary text-primary-foreground shadow-brutal" : ""}
                          ${!isCurrent && isAnswered ? "bg-secondary" : ""}
                          ${!isCurrent && !isAnswered ? "bg-background" : ""}
                          ${isFlagged ? "ring-2 ring-orange-400" : ""}
                        `}
                      >
                        {idx + 1}
                        {isFlagged && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-400 rounded-full" />
                        )}
                      </button>
                    </SheetClose>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="flex justify-center gap-6 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-primary border-2 border-border rounded-lg" />
                  <span className="text-sm">{t("question.current")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-secondary border-2 border-border rounded-lg" />
                  <span className="text-sm">{t("question.answered")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-background border-2 border-border rounded-lg" />
                  <span className="text-sm">{t("question.empty")}</span>
                </div>
              </div>

              {/* Quick stats */}
              <div className="flex justify-between items-center pt-4 px-2">
                <div className="text-sm text-muted-foreground">
                  {t("question.progress", { percent: Math.round(progress) })}
                </div>
                <div className="text-sm font-medium">
                  {t("question.remaining", {
                    count: totalQuestions - answered,
                  })}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}

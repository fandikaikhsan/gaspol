"use client"

/**
 * QuestionRunner Component
 * Phase 2: Question Runner & Assessment Engine
 *
 * THE MOST CRITICAL & REUSED COMPONENT
 * Handles all question formats: MCQ5, MCK-Table, Fill-in
 * Features: Timer, navigation, local state management
 */

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Question, AssessmentSession } from "@/lib/assessment/types"
import { QuestionDisplay } from "./QuestionDisplay"
import { AnswerOptions } from "./AnswerOptions"
import { TableOptions } from "./TableOptions"
import { FillInInput } from "./FillInInput"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface QuestionRunnerProps {
  questions: Question[]
  moduleId: string
  contextType: 'baseline' | 'drill' | 'mock' | 'recycle'
  contextId: string
  onComplete: (session: AssessmentSession) => void
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
  timeLimit,
  showTimer = true,
  allowNavigation = true,
  autoSubmitOnTimeUp = true,
}: QuestionRunnerProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, { answer: string; timeSpent: number; timestamp: Date }>>({})
  const [questionStartTime, setQuestionStartTime] = useState<Date>(new Date())
  const [sessionStartTime] = useState<Date>(new Date())
  const [timeElapsed, setTimeElapsed] = useState(0) // in seconds
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentQuestion = questions[currentIndex]
  const totalQuestions = questions.length
  const progress = ((currentIndex + 1) / totalQuestions) * 100
  const isLastQuestion = currentIndex === totalQuestions - 1

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
        title: "Time's Up!",
        description: "Submitting your answers automatically...",
      })
      handleFinish()
    }
  }, [timeElapsed, timeLimit, autoSubmitOnTimeUp])

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Get time remaining (if timed)
  const timeRemaining = timeLimit ? timeLimit * 60 - timeElapsed : null
  const isTimeWarning = timeRemaining !== null && timeRemaining < 300 // Last 5 minutes

  // Handle answer change
  const handleAnswerChange = (answer: string) => {
    const now = new Date()
    const timeSpent = Math.floor((now.getTime() - questionStartTime.getTime()) / 1000)

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
  const goToQuestion = (index: number) => {
    if (!allowNavigation) return
    if (index < 0 || index >= totalQuestions) return

    setCurrentIndex(index)
    setQuestionStartTime(new Date())
  }

  // Next question
  const handleNext = () => {
    if (isLastQuestion) {
      handleFinish()
    } else {
      goToQuestion(currentIndex + 1)
    }
  }

  // Previous question
  const handlePrevious = () => {
    goToQuestion(currentIndex - 1)
  }

  // Finish assessment
  const handleFinish = async () => {
    // Check if all questions are answered
    const unansweredCount = questions.filter(q => !answers[q.id]).length

    if (unansweredCount > 0) {
      const confirmed = window.confirm(
        `You have ${unansweredCount} unanswered question${unansweredCount > 1 ? 's' : ''}. Submit anyway?`
      )
      if (!confirmed) return
    }

    setIsSubmitting(true)

    const session: AssessmentSession = {
      moduleId,
      questionIds: questions.map(q => q.id),
      currentIndex,
      startedAt: sessionStartTime,
      answers,
    }

    try {
      await onComplete(session)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Failed to submit your answers. Please try again.",
      })
      setIsSubmitting(false)
    }
  }

  // Get current answer
  const currentAnswer = answers[currentQuestion.id]?.answer || ""

  // Render answer input based on question format
  const renderAnswerInput = () => {
    switch (currentQuestion.question_format) {
      case 'MCQ5':
        return (
          <AnswerOptions
            options={currentQuestion.options as any}
            selectedAnswer={currentAnswer}
            onAnswerChange={handleAnswerChange}
          />
        )
      case 'MCK-Table':
        return (
          <TableOptions
            options={currentQuestion.options as any}
            selectedAnswers={currentAnswer.split(',')}
            onAnswerChange={(answers) => handleAnswerChange(answers.join(','))}
          />
        )
      case 'Fill-in':
        return (
          <FillInInput
            options={currentQuestion.options as any}
            value={currentAnswer}
            onChange={handleAnswerChange}
          />
        )
      default:
        return <div>Unsupported question format</div>
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with timer and progress */}
        <div className="mb-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">
                Question {currentIndex + 1} of {totalQuestions}
              </h1>
              <p className="text-sm text-muted-foreground">
                {contextType === 'baseline' ? 'Baseline Assessment' :
                 contextType === 'drill' ? 'Practice Drill' :
                 contextType === 'mock' ? 'Mock Test' : 'Re-cycle Checkpoint'}
              </p>
            </div>

            {showTimer && (
              <div className="text-right">
                <div className={`text-3xl font-bold ${isTimeWarning ? 'text-destructive' : ''}`}>
                  {timeRemaining !== null ? formatTime(timeRemaining) : formatTime(timeElapsed)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {timeRemaining !== null ? 'Time Remaining' : 'Time Elapsed'}
                </p>
              </div>
            )}
          </div>

          <Progress value={progress} className="h-2" />

          <div className="flex gap-2">
            <Badge variant="outline">
              {currentQuestion.difficulty.toUpperCase()}
            </Badge>
            <Badge variant="outline">
              {currentQuestion.cognitive_level}
            </Badge>
            <Badge variant="outline">
              {currentQuestion.question_format}
            </Badge>
          </div>
        </div>

        {/* Question Card */}
        <Card className="mb-6">
          <CardHeader>
            <QuestionDisplay
              stem={currentQuestion.stem}
              stemImages={currentQuestion.stem_images}
              questionNumber={currentIndex + 1}
            />
          </CardHeader>

          <CardContent>
            {renderAnswerInput()}
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              variant="brutal-outline"
              onClick={handlePrevious}
              disabled={currentIndex === 0 || !allowNavigation || isSubmitting}
            >
              Previous
            </Button>

            <div className="flex gap-2">
              {allowNavigation && (
                <Button
                  variant="brutal-secondary"
                  onClick={() => {
                    // TODO: Show question palette
                    toast({
                      title: "Navigation",
                      description: "Question palette coming soon!",
                    })
                  }}
                  disabled={isSubmitting}
                >
                  Jump to Question
                </Button>
              )}

              <Button
                onClick={handleNext}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." :
                 isLastQuestion ? "Finish" : "Next"}
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Question Grid Navigation (if allowed) */}
        {allowNavigation && (
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Quick Navigation</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-10 gap-2">
                {questions.map((q, idx) => {
                  const isAnswered = !!answers[q.id]
                  const isCurrent = idx === currentIndex

                  return (
                    <button
                      key={q.id}
                      onClick={() => goToQuestion(idx)}
                      disabled={isSubmitting}
                      className={`
                        aspect-square rounded-lg border-2 border-border font-semibold text-sm
                        transition-all hover:scale-105
                        ${isCurrent ? 'bg-primary text-primary-foreground shadow-brutal-sm' : ''}
                        ${!isCurrent && isAnswered ? 'bg-secondary' : ''}
                        ${!isCurrent && !isAnswered ? 'bg-background' : ''}
                      `}
                    >
                      {idx + 1}
                    </button>
                  )
                })}
              </div>

              <div className="flex gap-4 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-primary border-2 border-border rounded" />
                  <span>Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-secondary border-2 border-border rounded" />
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-background border-2 border-border rounded" />
                  <span>Unanswered</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

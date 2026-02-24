"use client"

/**
 * Review Mode
 * Phase 5: Locked-In Learning Mode
 */

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { QuestionDisplay } from "@/components/assessment/QuestionDisplay"
import { AnswerOptions } from "@/components/assessment/AnswerOptions"
import { useToast } from "@/hooks/use-toast"

function ReviewModeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const taskId = searchParams.get('taskId')

  const [user, setUser] = useState<any>(null)
  const [attempts, setAttempts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (!currentUser) {
        router.push('/login')
        return
      }

      setUser(currentUser)

      // Fetch recent incorrect attempts with questions
      const { data } = await supabase
        .from('attempts')
        .select(`
          *,
          questions (*)
        `)
        .eq('user_id', currentUser.id)
        .eq('is_correct', false)
        .order('attempted_at', { ascending: false })
        .limit(20)

      setAttempts(data || [])
      setIsLoading(false)
    }

    fetchData()
  }, [router])

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <p>Loading mistakes...</p>
    </div>
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Review Mistakes 👁️</h1>
          <p className="text-muted-foreground">
            Learn from {attempts.length} past incorrect answers
          </p>
        </div>

        {attempts.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-2xl mb-4">🎉</p>
              <p className="text-lg font-semibold mb-2">No mistakes yet!</p>
              <p className="text-muted-foreground">
                Complete some assessments to see your mistakes here
              </p>
            </CardContent>
          </Card>
        )}

        {attempts.map((attempt, idx) => {
          const question = attempt.questions
          return (
            <Card key={attempt.id} className="border-destructive/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Question {idx + 1}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="destructive">Incorrect</Badge>
                    {attempt.error_tags?.map((tag: string) => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
                <CardDescription>
                  {new Date(attempt.attempted_at).toLocaleDateString()} •
                  {attempt.time_spent_sec}s
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <QuestionDisplay
                  stem={question.stem}
                  stemImages={question.stem_images}
                  questionNumber={idx + 1}
                />

                {question.question_format === 'MCQ5' && (
                  <AnswerOptions
                    options={question.options}
                    selectedAnswer={attempt.user_answer}
                    onAnswerChange={() => {}}
                    disabled={true}
                    showCorrectAnswer={question.correct_answer}
                  />
                )}

                {question.explanation && (
                  <div className="bg-muted p-4 rounded-lg border-2 border-border">
                    <h4 className="font-semibold mb-2">Explanation:</h4>
                    <p className="text-sm leading-relaxed">{question.explanation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        {/* Done reviewing button — marks plan task complete if taskId present */}
        {taskId && (
          <Button
            className="w-full"
            size="lg"
            onClick={async () => {
              if (user) {
                const supabase = createClient()
                await supabase
                  .from('plan_tasks')
                  .update({
                    is_completed: true,
                    completed_at: new Date().toISOString(),
                  })
                  .eq('id', taskId)
                  .eq('user_id', user.id)
              }
              toast({
                title: "Review complete!",
                description: "Task marked as done",
              })
              router.push('/plan')
            }}
          >
            Done Reviewing
          </Button>
        )}
      </div>
    </div>
  )
}

export default function ReviewModePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading mistakes...</p>
      </div>
    }>
      <ReviewModeContent />
    </Suspense>
  )
}

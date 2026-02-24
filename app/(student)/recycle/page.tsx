"use client"

/**
 * Re-cycle Hub
 * Phase 7: Re-cycle Assessment
 */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

export default function RecycleHubPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [userState, setUserState] = useState<any>(null)
  const [checkpoints, setCheckpoints] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (!currentUser) {
        router.push('/login')
        return
      }

      setUser(currentUser)

      const { data: state } = await supabase
        .from('user_state')
        .select('*')
        .eq('user_id', currentUser.id)
        .single()

      setUserState(state)

      const { data: checkpointData } = await supabase
        .from('recycle_checkpoints')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })

      setCheckpoints(checkpointData || [])
      setIsLoading(false)
    }

    fetchData()
  }, [router])

  const handleCreateCheckpoint = async () => {
    if (!user || !userState?.current_cycle_id) return

    setIsCreating(true)
    toast({
      title: "Creating checkpoint...",
      description: "Analyzing weak areas",
    })

    try {
      const supabase = createClient()
      const accessToken = (await supabase.auth.getSession()).data.session?.access_token

      const response = await fetch('/api/create-recycle-checkpoint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'Failed to create checkpoint')
      if (!data?.success) throw new Error(data?.error || 'Failed to create checkpoint')

      toast({
        title: "Checkpoint ready!",
        description: `${data.question_count} questions targeting ${data.weak_skills_targeted} weak areas`,
      })

      router.push(
        `/locked-in/drills/practice?module=${data.module_id}&checkpointId=${data.checkpoint_id}`
      )
    } catch (err: any) {
      console.error('Failed to create checkpoint:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to create checkpoint",
      })
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <p>Loading...</p>
    </div>
  }

  const isUnlocked = userState?.current_phase === 'RECYCLE_UNLOCKED' ||
                     userState?.current_phase === 'RECYCLE_ASSESSMENT_IN_PROGRESS'

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Re-cycle Checkpoint 🔄</h1>
          <p className="text-muted-foreground">
            Targeted assessment of weak areas with delta analytics
          </p>
        </div>

        {!isUnlocked && (
          <Card className="border-muted bg-muted/20">
            <CardContent className="text-center py-12">
              <p className="text-6xl mb-4">🔒</p>
              <h3 className="text-2xl font-bold mb-2">Locked</h3>
              <p className="text-muted-foreground mb-6">
                Complete required tasks in your study plan to unlock re-cycle
              </p>
              <Button onClick={() => router.push('/plan')}>
                Go to Study Plan
              </Button>
            </CardContent>
          </Card>
        )}

        {isUnlocked && (
          <>
            <Card className="border-primary bg-primary/5">
              <CardHeader>
                <CardTitle>Create New Checkpoint</CardTitle>
                <CardDescription>
                  Test your improvement in weak areas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleCreateCheckpoint}
                  disabled={isCreating}
                  className="w-full"
                  size="lg"
                >
                  {isCreating ? 'Creating...' : 'Start New Checkpoint'}
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Past Checkpoints</h2>
              {checkpoints.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">
                      No checkpoints yet. Create your first one above!
                    </p>
                  </CardContent>
                </Card>
              )}

              {checkpoints.map((checkpoint, idx) => (
                <Card key={checkpoint.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Checkpoint #{idx + 1}</CardTitle>
                      {checkpoint.is_completed ? (
                        <Badge variant="strong">Complete</Badge>
                      ) : (
                        <Badge>In Progress</Badge>
                      )}
                    </div>
                    <CardDescription>
                      {new Date(checkpoint.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {checkpoint.delta_readiness && (
                      <p className="text-sm">
                        Readiness change:{' '}
                        <span className={checkpoint.delta_readiness > 0 ? 'text-status-strong' : 'text-destructive'}>
                          {checkpoint.delta_readiness > 0 ? '+' : ''}{checkpoint.delta_readiness}
                        </span>
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

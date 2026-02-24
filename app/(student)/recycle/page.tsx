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
import { useTranslation } from "@/lib/i18n"

export default function RecycleHubPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation('recycle')
  const { t: tc } = useTranslation('common')
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
      title: t('toast.creating'),
      description: t('toast.creatingDesc'),
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
        title: t('toast.ready'),
        description: t('toast.readyDesc', { questions: data.question_count, skills: data.weak_skills_targeted }),
      })

      router.push(
        `/locked-in/drills/practice?module=${data.module_id}&checkpointId=${data.checkpoint_id}`
      )
    } catch (err: any) {
      console.error('Failed to create checkpoint:', err)
      toast({
        variant: "destructive",
        title: t('toast.error'),
        description: err.message || "Failed to create checkpoint",
      })
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <p>{tc('status.loading')}</p>
    </div>
  }

  const isUnlocked = userState?.current_phase === 'RECYCLE_UNLOCKED' ||
                     userState?.current_phase === 'RECYCLE_ASSESSMENT_IN_PROGRESS'

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>

        {!isUnlocked && (
          <Card className="border-muted bg-muted/20">
            <CardContent className="text-center py-12">
              <p className="text-6xl mb-4">{t('locked')}</p>
              <h3 className="text-2xl font-bold mb-2">{t('lockedTitle')}</h3>
              <p className="text-muted-foreground mb-6">
                {t('lockedDesc')}
              </p>
              <Button onClick={() => router.push('/plan')}>
                {t('goToPlan')}
              </Button>
            </CardContent>
          </Card>
        )}

        {isUnlocked && (
          <>
            <Card className="border-primary bg-primary/5">
              <CardHeader>
                <CardTitle>{t('createCheckpoint')}</CardTitle>
                <CardDescription>
                  {t('createCheckpointDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleCreateCheckpoint}
                  disabled={isCreating}
                  className="w-full"
                  size="lg"
                >
                  {isCreating ? t('creating') : t('startCheckpoint')}
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">{t('pastCheckpoints')}</h2>
              {checkpoints.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">
                      {t('noCheckpoints')}
                    </p>
                  </CardContent>
                </Card>
              )}

              {checkpoints.map((checkpoint, idx) => (
                <Card key={checkpoint.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{t('checkpointNumber', { number: idx + 1 })}</CardTitle>
                      {checkpoint.is_completed ? (
                        <Badge variant="strong">{tc('status.complete')}</Badge>
                      ) : (
                        <Badge>{tc('status.inProgress')}</Badge>
                      )}
                    </div>
                    <CardDescription>
                      {new Date(checkpoint.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {checkpoint.delta_readiness && (
                      <p className="text-sm">
                        {t('readinessChange', { delta: `${checkpoint.delta_readiness > 0 ? '+' : ''}${checkpoint.delta_readiness}` })}
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

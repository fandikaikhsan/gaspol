"use client"

/**
 * Baseline Assessment Hub
 * Phase 2: Question Runner & Assessment Engine
 *
 * Shows available baseline modules with progress tracking
 */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useUserPhase } from "@/hooks/useUserPhase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n"

interface BaselineModule {
  id: string
  module_id: string
  checkpoint_order: number
  title: string
  subtitle: string
  estimated_duration_min: number
  is_completed: boolean
  score?: number
}

export default function BaselineHubPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation('baseline')
  const { t: tc } = useTranslation('common')
  const [user, setUser] = useState<any>(null)
  const [modules, setModules] = useState<BaselineModule[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { userState } = useUserPhase(user?.id)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (!currentUser) {
        router.push('/login')
        return
      }

      setUser(currentUser)

      // Fetch baseline modules
      const { data: baselineModules, error } = await supabase
        .from('baseline_modules')
        .select('*')
        .eq('is_active', true)
        .order('checkpoint_order')

      if (error) {
        toast({
          variant: "destructive",
          title: tc('error.title'),
          description: "Failed to load baseline modules",
        })
        return
      }

      // Check completion status
      const modulesWithStatus = await Promise.all(
        (baselineModules || []).map(async (module) => {
          const { data: completion } = await supabase
            .from('module_completions')
            .select('score')
            .eq('user_id', currentUser.id)
            .eq('module_id', module.module_id)
            .eq('context_type', 'baseline')
            .single()

          return {
            ...module,
            is_completed: !!completion,
            score: completion?.score,
          }
        })
      )


      setModules(modulesWithStatus)
      setIsLoading(false)
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, toast])

  const completedCount = modules.filter(m => m.is_completed).length
  const totalCount = modules.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-lg text-muted-foreground">{tc('status.loading')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>

        {/* Progress Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
          <CardHeader>
            <CardTitle>{t('progress.title')}</CardTitle>
            <CardDescription>
              {t('progress.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold">{t('progress.modulesOf', { completed: completedCount, total: totalCount })}</span>
                <span className="text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>

            {completedCount === totalCount && (
              <div className="bg-background p-4 rounded-lg border-2 border-status-strong">
                <p className="font-semibold text-status-strong mb-2">
                  {t('progress.allComplete')}
                </p>
                <Button
                  onClick={() => router.push('/analytics')}
                  className="w-full"
                >
                  {t('progress.viewAnalytics')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Module List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">{t('modules.title')}</h2>

          {modules.map((module) => (
            <Card
              key={module.id}
              className={module.is_completed ? 'bg-status-strong/5' : ''}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">
                        {t('modules.moduleNumber', { number: module.checkpoint_order })}
                      </Badge>
                      {module.is_completed && (
                        <Badge variant="strong">
                          {t('modules.completed')}
                        </Badge>
                      )}
                    </div>
                    <CardTitle>{module.title}</CardTitle>
                    <CardDescription>{module.subtitle}</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    <span>{t('modules.estimatedTime', { minutes: module.estimated_duration_min })}</span>
                    {module.is_completed && module.score && (
                      <span className="ml-4 font-semibold text-foreground">
                        {t('modules.score', { score: module.score.toFixed(0) })}
                      </span>
                    )}
                  </div>

                  <Link href={`/baseline/${module.module_id}`}>
                    <Button variant={module.is_completed ? "brutal-secondary" : "brutal"}>
                      {module.is_completed ? tc('button.retake') : tc('button.start')}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {modules.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">
                {t('modules.empty')}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

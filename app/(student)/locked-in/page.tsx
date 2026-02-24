"use client"

/**
 * Locked-In Mode Hub
 * Phase 5: Locked-In Learning Mode
 *
 * Three main modes:
 * 1. Practice Drills - Mixed or focused practice
 * 2. Modules - Pre-generated or suggested modules
 * 3. Review - Learn from past mistakes
 */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Target, BookOpen, Eye, Sparkles, Shuffle, Focus } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

interface UserAnalytics {
  weakSkillCount: number
  suggestedModuleCount: number
  readinessScore: number
}

export default function LockedInHubPage() {
  const router = useRouter()
  const { t } = useTranslation('lockedIn')
  const { t: tc } = useTranslation('common')
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Fetch user's weak skills count
      const { data: weakSkills } = await supabase
        .from('user_skill_state')
        .select('id')
        .eq('user_id', user.id)
        .eq('mastery_level', 'weak')

      // Fetch available drill modules
      const { data: modules } = await supabase
        .from('modules')
        .select('id')
        .in('module_type', ['drill_focus', 'drill_mixed'])
        .eq('status', 'published')

      // Fetch latest readiness
      const { data: snapshot } = await supabase
        .from('analytics_snapshots')
        .select('readiness_score')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      setAnalytics({
        weakSkillCount: weakSkills?.length || 0,
        suggestedModuleCount: modules?.length || 0,
        readinessScore: snapshot?.readiness_score || 0,
      })
      setIsLoading(false)
    }

    fetchAnalytics()
  }, [router])

  const modes = [
    {
      id: 'drills',
      title: t('drills.title'),
      icon: Target,
      description: t('drills.subtitle'),
      color: 'bg-pastel-yellow',
      href: '/locked-in/drills',
      features: [
        { icon: Shuffle, label: t('drills.mixed'), description: t('drills.mixedDesc') },
        { icon: Focus, label: t('drills.focused'), description: t('drills.focusedDesc') },
      ],
      badge: analytics?.weakSkillCount ? t('drills.weakSkillsCount', { count: analytics.weakSkillCount }) : null,
      badgeVariant: 'destructive' as const,
    },
    {
      id: 'modules',
      title: t('modules.title'),
      icon: BookOpen,
      description: t('modules.subtitle'),
      color: 'bg-pastel-lavender',
      href: '/locked-in/modules',
      features: [
        { icon: Sparkles, label: t('modules.adminCurated'), description: t('modules.adminCuratedDesc') },
        { icon: Target, label: t('modules.forWeakAreas'), description: t('modules.forWeakAreasDesc') },
      ],
      badge: analytics?.suggestedModuleCount ? t('modules.available', { count: analytics.suggestedModuleCount }) : null,
      badgeVariant: 'secondary' as const,
    },
    {
      id: 'review',
      title: t('review.title'),
      icon: Eye,
      description: t('review.subtitle', { count: 0 }),
      color: 'bg-pastel-peach',
      href: '/locked-in/review',
      features: null,
      badge: null,
      badgeVariant: 'outline' as const,
    },
  ]

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
          {analytics && analytics.readinessScore > 0 && (
            <div className="flex justify-center">
              <Badge variant="outline" className="text-lg px-4 py-1">
                {t('readiness', { score: analytics.readinessScore.toFixed(0) })}
              </Badge>
            </div>
          )}
        </div>

        {/* Mode Cards */}
        <div className="space-y-6">
          {modes.map((mode) => {
            const Icon = mode.icon
            return (
              <Card
                key={mode.id}
                className="border-2 border-border shadow-brutal hover:shadow-brutal-lg transition-all cursor-pointer hover:-translate-y-1"
                onClick={() => router.push(mode.href)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 ${mode.color} rounded-xl border-2 border-border flex items-center justify-center`}>
                        <Icon className="h-8 w-8" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-xl">{mode.title}</CardTitle>
                          {mode.badge && (
                            <Badge variant={mode.badgeVariant}>
                              {mode.badge}
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="mt-1">
                          {mode.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Button variant="brutal" size="sm">
                      {tc('button.start')}
                    </Button>
                  </div>
                </CardHeader>
                {mode.features && (
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {mode.features.map((feature, idx) => {
                        const FeatureIcon = feature.icon
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border"
                          >
                            <FeatureIcon className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">{feature.label}</p>
                              <p className="text-xs text-muted-foreground">{feature.description}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>

        {/* Quick Stats */}
        {analytics && (analytics.weakSkillCount > 0 || analytics.suggestedModuleCount > 0) && (
          <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  {t('recommendation')}
                </p>
                <div className="flex justify-center gap-4">
                  {analytics.weakSkillCount > 0 && (
                    <Badge variant="destructive" className="text-sm">
                      {t('drills.weakSkillsCount', { count: analytics.weakSkillCount })}
                    </Badge>
                  )}
                  {analytics.suggestedModuleCount > 0 && (
                    <Badge variant="secondary" className="text-sm">
                      {t('modulesAvailable', { count: analytics.suggestedModuleCount })}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

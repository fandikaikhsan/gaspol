"use client"

/**
 * Study Modules Page
 * Phase 5: Locked-In Learning Mode
 *
 * Shows pre-generated modules from admin and
 * modules suggested based on user's analytics
 */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, BookOpen, Clock, Target, Sparkles, Play, CheckCircle } from "lucide-react"

interface Module {
  id: string
  name: string
  description: string
  module_type: string
  question_count: number
  time_limit_min: number | null
  target_node_id: string | null
  target_name?: string
  is_completed?: boolean
  completion_score?: number
}

interface SuggestedModule {
  module: Module
  reason: string
  priority: 'high' | 'medium' | 'low'
}

export default function ModulesPage() {
  const router = useRouter()
  const [allModules, setAllModules] = useState<Module[]>([])
  const [suggestedModules, setSuggestedModules] = useState<SuggestedModule[]>([])
  const [completedModuleIds, setCompletedModuleIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchModules = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Fetch all published drill modules
      const { data: modulesData } = await supabase
        .from('modules')
        .select(`
          id,
          name,
          description,
          module_type,
          question_count,
          time_limit_min,
          target_node_id
        `)
        .in('module_type', ['drill_focus', 'drill_mixed', 'topical'])
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      // Get target node names
      const modulesWithNames = await Promise.all(
        (modulesData || []).map(async (mod) => {
          let targetName = null
          if (mod.target_node_id) {
            const { data: node } = await supabase
              .from('taxonomy_nodes')
              .select('name')
              .eq('id', mod.target_node_id)
              .single()
            targetName = node?.name
          }
          return {
            ...mod,
            target_name: targetName,
          }
        })
      )

      setAllModules(modulesWithNames)

      // Fetch user's completed modules
      const { data: completions } = await supabase
        .from('module_completions')
        .select('module_id, score')
        .eq('user_id', user.id)
        .eq('context_type', 'drill')

      const completedIds = new Set<string>()
      const completionScores: Record<string, number> = {}

      completions?.forEach(c => {
        completedIds.add(c.module_id)
        completionScores[c.module_id] = c.score
      })

      setCompletedModuleIds(completedIds)

      // Update modules with completion status
      setAllModules(prev => prev.map(m => ({
        ...m,
        is_completed: completedIds.has(m.id),
        completion_score: completionScores[m.id],
      })))

      // Fetch user's weak skills for suggestions
      const { data: weakSkills } = await supabase
        .from('user_skill_state')
        .select('micro_skill_id, accuracy')
        .eq('user_id', user.id)
        .eq('mastery_level', 'weak')
        .order('accuracy', { ascending: true })
        .limit(5)

      // Create suggested modules based on weak skills
      const suggestions: SuggestedModule[] = []

      for (const skill of weakSkills || []) {
        // Find modules targeting this skill
        const matchingModule = modulesWithNames.find(m =>
          m.target_node_id === skill.micro_skill_id && !completedIds.has(m.id)
        )

        if (matchingModule) {
          suggestions.push({
            module: matchingModule,
            reason: `Targets your weak area: ${matchingModule.target_name}`,
            priority: skill.accuracy < 30 ? 'high' : skill.accuracy < 50 ? 'medium' : 'low',
          })
        }
      }

      // Add some general modules as suggestions if we don't have many targeted ones
      if (suggestions.length < 3) {
        const generalModules = modulesWithNames
          .filter(m => !completedIds.has(m.id) && !suggestions.some(s => s.module.id === m.id))
          .slice(0, 3 - suggestions.length)

        generalModules.forEach(m => {
          suggestions.push({
            module: m,
            reason: 'Recommended for practice',
            priority: 'low',
          })
        })
      }

      setSuggestedModules(suggestions)
      setIsLoading(false)
    }

    fetchModules()
  }, [router])

  const startModule = (moduleId: string) => {
    router.push(`/locked-in/drills/practice?module=${moduleId}`)
  }

  const priorityColors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200',
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading modules...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/locked-in')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Study Modules</h1>
            <p className="text-muted-foreground">
              Pre-made learning modules curated by experts
            </p>
          </div>
        </div>

        <Tabs defaultValue="suggested">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="suggested">
              <Sparkles className="h-4 w-4 mr-2" />
              For You
            </TabsTrigger>
            <TabsTrigger value="all">
              <BookOpen className="h-4 w-4 mr-2" />
              All Modules
            </TabsTrigger>
            <TabsTrigger value="completed">
              <CheckCircle className="h-4 w-4 mr-2" />
              Completed
            </TabsTrigger>
          </TabsList>

          {/* Suggested Modules */}
          <TabsContent value="suggested" className="space-y-4 mt-6">
            {suggestedModules.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No Suggestions Yet</p>
                  <p className="text-muted-foreground">
                    Complete more practice to get personalized module recommendations
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {suggestedModules.map(({ module, reason, priority }) => (
                  <Card
                    key={module.id}
                    className="border-2 border-border shadow-brutal hover:shadow-brutal-lg transition-all cursor-pointer hover:-translate-y-1"
                    onClick={() => startModule(module.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-pastel-lavender rounded-xl border-2 border-border flex items-center justify-center">
                            <BookOpen className="h-7 w-7" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <CardTitle>{module.name}</CardTitle>
                              <Badge className={priorityColors[priority]}>
                                {priority === 'high' ? 'Priority' : priority === 'medium' ? 'Suggested' : 'Try This'}
                              </Badge>
                            </div>
                            <CardDescription>{reason}</CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            {module.question_count} questions
                          </span>
                          {module.time_limit_min && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {module.time_limit_min} min
                            </span>
                          )}
                        </div>
                        <Button variant="brutal" size="sm">
                          <Play className="h-4 w-4 mr-2" />
                          Start
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* All Modules */}
          <TabsContent value="all" className="space-y-4 mt-6">
            {allModules.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No Modules Available</p>
                  <p className="text-muted-foreground">
                    Check back later for new study modules
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {allModules
                  .filter(m => !m.is_completed)
                  .map((module) => (
                    <Card
                      key={module.id}
                      className="border-2 border-border hover:shadow-brutal transition-all cursor-pointer"
                      onClick={() => startModule(module.id)}
                    >
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-pastel-lavender rounded-xl border-2 border-border flex items-center justify-center">
                              <BookOpen className="h-6 w-6" />
                            </div>
                            <div>
                              <p className="font-medium">{module.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {module.description || (module.target_name ? `Focus: ${module.target_name}` : 'Mixed topics')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right text-sm text-muted-foreground">
                              <p>{module.question_count} Q</p>
                              {module.time_limit_min && (
                                <p>{module.time_limit_min} min</p>
                              )}
                            </div>
                            <Button variant="brutal" size="sm">
                              <Play className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>

          {/* Completed Modules */}
          <TabsContent value="completed" className="space-y-4 mt-6">
            {allModules.filter(m => m.is_completed).length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No Completed Modules</p>
                  <p className="text-muted-foreground">
                    Complete some modules to see them here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {allModules
                  .filter(m => m.is_completed)
                  .map((module) => (
                    <Card
                      key={module.id}
                      className="border-2 border-border border-green-200 bg-green-50/50 hover:shadow-brutal transition-all cursor-pointer"
                      onClick={() => startModule(module.id)}
                    >
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-xl border-2 border-green-200 flex items-center justify-center">
                              <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium">{module.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Score: {module.completion_score?.toFixed(0)}%
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="bg-green-100 text-green-800">
                              Completed
                            </Badge>
                            <Button variant="brutal-outline" size="sm">
                              Retry
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

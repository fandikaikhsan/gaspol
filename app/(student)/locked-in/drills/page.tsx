"use client"

/**
 * Practice Drills Selection Page
 * Phase 5: Locked-In Learning Mode
 *
 * Two modes:
 * 1. Mixed - Random questions from different subtopics
 * 2. Focused - Questions from a specific subtopic
 *
 * Also shows:
 * - Pre-generated modules from admin
 * - Suggested modules based on analytics
 */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shuffle, Focus, Search, Target, ArrowLeft, Play, BookOpen, Sparkles } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

interface TaxonomyNode {
  id: string
  name: string
  code: string
  level: number
  parent_id: string | null
  question_count?: number
}

interface DrillModule {
  id: string
  name: string
  description: string
  module_type: string
  question_count: number
  target_node_id: string | null
  target_name?: string
  is_suggested?: boolean
}

interface WeakSkill {
  node_id: string
  name: string
  code: string
  mastery: number
  attempt_count: number
}

export default function DrillsPage() {
  const router = useRouter()
  const { t } = useTranslation('lockedIn')
  const { t: tc } = useTranslation('common')
  const [activeTab, setActiveTab] = useState("quick-start")
  const [searchTerm, setSearchTerm] = useState("")
  const [topics, setTopics] = useState<TaxonomyNode[]>([])
  const [modules, setModules] = useState<DrillModule[]>([])
  const [weakSkills, setWeakSkills] = useState<WeakSkill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(10)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Fetch taxonomy nodes (subtopics - level 4)
      const { data: taxonomyData } = await supabase
        .from('taxonomy_nodes')
        .select('id, name, code, level, parent_id')
        .in('level', [3, 4]) // Topics and subtopics
        .eq('is_active', true)
        .order('position')

      // Count questions per taxonomy node
      const nodesWithCounts = await Promise.all(
        (taxonomyData || []).map(async (node) => {
          const { count } = await supabase
            .from('questions')
            .select('id', { count: 'exact', head: true })
            .eq('micro_skill_id', node.id)
            .eq('status', 'published')

          return {
            ...node,
            question_count: count || 0,
          }
        })
      )

      setTopics(nodesWithCounts.filter(n => n.question_count > 0))

      // Fetch published drill modules
      const { data: modulesData } = await supabase
        .from('modules')
        .select(`
          id,
          name,
          description,
          module_type,
          question_count,
          target_node_id
        `)
        .in('module_type', ['drill_focus', 'drill_mixed'])
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      // Get target node names for modules
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

      setModules(modulesWithNames)

      // Fetch user's weak skills
      const { data: skillsData } = await supabase
        .from('user_skill_state')
        .select(`
          micro_skill_id,
          accuracy,
          mastery_level,
          attempt_count
        `)
        .eq('user_id', user.id)
        .eq('mastery_level', 'weak')
        .order('accuracy', { ascending: true })
        .limit(10)

      // Get skill names
      const skillsWithNames = await Promise.all(
        (skillsData || []).map(async (skill) => {
          const { data: node } = await supabase
            .from('taxonomy_nodes')
            .select('name, code')
            .eq('id', skill.micro_skill_id)
            .single()

          return {
            node_id: skill.micro_skill_id,
            name: node?.name || 'Unknown',
            code: node?.code || '',
            mastery: skill.accuracy || 0,
            attempt_count: skill.attempt_count || 0,
          }
        })
      )

      setWeakSkills(skillsWithNames)
      setIsLoading(false)
    }

    fetchData()
  }, [router])

  const startMixedDrill = () => {
    router.push(`/locked-in/drills/practice?mode=mixed&count=${selectedQuestionCount}`)
  }

  const startFocusedDrill = (nodeId: string) => {
    router.push(`/locked-in/drills/practice?mode=focused&node=${nodeId}&count=${selectedQuestionCount}`)
  }

  const startModuleDrill = (moduleId: string) => {
    router.push(`/locked-in/drills/practice?module=${moduleId}`)
  }

  const startWeakSkillDrill = (nodeIds: string[]) => {
    const nodesParam = nodeIds.join(',')
    router.push(`/locked-in/drills/practice?mode=weak&nodes=${nodesParam}&count=${selectedQuestionCount}`)
  }

  const filteredTopics = topics.filter(topic =>
    topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    topic.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/locked-in')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{t('drills.title')}</h1>
            <p className="text-muted-foreground">
              {t('drills.chooseMode')}
            </p>
          </div>
        </div>

        {/* Question Count Selector */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{t('drills.questionsPerSession')}</span>
              <div className="flex gap-2">
                {[5, 10, 15, 20].map((count) => (
                  <Button
                    key={count}
                    variant={selectedQuestionCount === count ? "brutal" : "brutal-outline"}
                    size="sm"
                    onClick={() => setSelectedQuestionCount(count)}
                  >
                    {count}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="quick-start" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="quick-start">{t('drills.quickStart')}</TabsTrigger>
            <TabsTrigger value="by-topic">{t('drills.byTopic')}</TabsTrigger>
            <TabsTrigger value="modules">{t('drills.modulesTab')}</TabsTrigger>
            <TabsTrigger value="weak-skills">
              {t('drills.weakSkillsTab')}
              {weakSkills.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {weakSkills.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Quick Start Tab */}
          <TabsContent value="quick-start" className="space-y-4 mt-6">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Mixed Drill */}
              <Card
                className="border-2 border-border shadow-brutal hover:shadow-brutal-lg transition-all cursor-pointer hover:-translate-y-1"
                onClick={startMixedDrill}
              >
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-pastel-yellow rounded-xl border-2 border-border flex items-center justify-center">
                      <Shuffle className="h-7 w-7" />
                    </div>
                    <div>
                      <CardTitle>{t('drills.mixedDrill')}</CardTitle>
                      <CardDescription>
                        {t('drills.mixedDrillDesc')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {t('drills.questionsCount', { count: selectedQuestionCount })}
                    </span>
                    <Button variant="brutal" size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      {tc('button.start')}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Focused on Weak Skills */}
              {weakSkills.length > 0 && (
                <Card
                  className="border-2 border-border shadow-brutal hover:shadow-brutal-lg transition-all cursor-pointer hover:-translate-y-1 border-destructive/50"
                  onClick={() => startWeakSkillDrill(weakSkills.map(s => s.node_id))}
                >
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-red-100 rounded-xl border-2 border-border flex items-center justify-center">
                        <Target className="h-7 w-7 text-red-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle>{t('drills.targetWeakAreas')}</CardTitle>
                          <Badge variant="destructive">{t('drills.recommended')}</Badge>
                        </div>
                        <CardDescription>
                          {t('drills.targetWeakDesc', { count: weakSkills.length })}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {t('drills.questionsCount', { count: selectedQuestionCount })}
                      </span>
                      <Button variant="brutal" size="sm" className="bg-red-500 hover:bg-red-600">
                        <Play className="h-4 w-4 mr-2" />
                        {tc('button.start')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* By Topic Tab */}
          <TabsContent value="by-topic" className="space-y-4 mt-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('drills.searchTopics')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Topics List */}
            <div className="space-y-2">
              {filteredTopics.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">
                      {searchTerm ? t('drills.noTopicsFound') : t('drills.noTopics')}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredTopics.map((topic) => (
                  <Card
                    key={topic.id}
                    className="border-2 border-border hover:shadow-brutal transition-all cursor-pointer"
                    onClick={() => startFocusedDrill(topic.id)}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-pastel-lavender rounded-lg border-2 border-border flex items-center justify-center">
                            <Focus className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{topic.name}</p>
                            <p className="text-sm text-muted-foreground">{topic.code}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">
                            {topic.question_count} Q
                          </Badge>
                          <Button variant="brutal" size="sm">
                            <Play className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Modules Tab */}
          <TabsContent value="modules" className="space-y-4 mt-6">
            {modules.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">{t('drills.noModules')}</p>
                  <p className="text-muted-foreground">
                    {t('drills.noModulesDesc')}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {modules.map((module) => (
                  <Card
                    key={module.id}
                    className="border-2 border-border shadow-brutal hover:shadow-brutal-lg transition-all cursor-pointer hover:-translate-y-1"
                    onClick={() => startModuleDrill(module.id)}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-pastel-lavender rounded-xl border-2 border-border flex items-center justify-center">
                            <BookOpen className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{module.name}</p>
                              {module.is_suggested && (
                                <Badge variant="secondary">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  {t('drills.suggested')}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {module.description || (module.target_name ? `Focus: ${module.target_name}` : t('drills.mixedDrillDesc'))}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">
                            {module.question_count} Q
                          </Badge>
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

          {/* Weak Skills Tab */}
          <TabsContent value="weak-skills" className="space-y-4 mt-6">
            {weakSkills.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">{t('drills.noWeakSkills')}</p>
                  <p className="text-muted-foreground">
                    {t('drills.noWeakSkillsDesc')}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-red-800">{t('drills.practiceAllWeak')}</p>
                        <p className="text-sm text-red-600">
                          {t('drills.practiceAllWeakDesc', { count: weakSkills.length })}
                        </p>
                      </div>
                      <Button
                        variant="brutal"
                        className="bg-red-500 hover:bg-red-600"
                        onClick={() => startWeakSkillDrill(weakSkills.map(s => s.node_id))}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {t('drills.startAll')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  {weakSkills.map((skill) => (
                    <Card
                      key={skill.node_id}
                      className="border-2 border-border hover:shadow-brutal transition-all cursor-pointer"
                      onClick={() => startFocusedDrill(skill.node_id)}
                    >
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-lg border-2 border-border flex items-center justify-center">
                              <Target className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                              <p className="font-medium">{skill.name}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{skill.code}</span>
                                <span>|</span>
                                <span className="text-red-600">
                                  {t('drills.mastery', { percent: skill.mastery.toFixed(0) })}
                                </span>
                                <span>|</span>
                                <span>{t('drills.attempts', { count: skill.attempt_count })}</span>
                              </div>
                            </div>
                          </div>
                          <Button variant="brutal" size="sm">
                            <Play className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

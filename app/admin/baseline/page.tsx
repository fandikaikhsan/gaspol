"use client"

/**
 * Admin Baseline Configuration
 * Phase 8: Admin Console
 */

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Clock, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react"
import { Switch } from "@/components/ui/switch"

interface BaselineModule {
  module_id: string
  checkpoint_order: number
  title: string
  subtitle: string
  estimated_duration_min: number
  is_active: boolean
  module?: {
    name: string
    question_count: number
    status: string
  }
}

export default function AdminBaselinePage() {
  const { toast } = useToast()
  const [baselineModules, setBaselineModules] = useState<BaselineModule[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadBaselineModules()
  }, [])

  const loadBaselineModules = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("baseline_modules")
        .select(`
          *,
          module:modules(name, question_count, status)
        `)
        .order("checkpoint_order")

      if (error) throw error

      setBaselineModules(data || [])
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load baseline modules. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleActive = async (moduleId: string, currentStatus: boolean) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("baseline_modules")
        .update({ is_active: !currentStatus })
        .eq("module_id", moduleId)

      if (error) throw error

      toast({
        title: "Status Updated",
        description: `Module ${!currentStatus ? "activated" : "deactivated"}`,
      })

      loadBaselineModules()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update status. Please try again.",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading baseline configuration...</p>
      </div>
    )
  }

  const totalDuration = baselineModules.reduce(
    (sum, m) => sum + m.estimated_duration_min,
    0
  )
  const activeCount = baselineModules.filter((m) => m.is_active).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Baseline Configuration</h1>
          <p className="text-muted-foreground">
            Configure the baseline assessment flow for new students
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Checkpoint
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-pastel-pink">
          <CardHeader className="pb-2">
            <CardDescription>Total Checkpoints</CardDescription>
            <CardTitle className="text-4xl">{baselineModules.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-pastel-mint">
          <CardHeader className="pb-2">
            <CardDescription>Active Checkpoints</CardDescription>
            <CardTitle className="text-4xl">{activeCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-pastel-sky">
          <CardHeader className="pb-2">
            <CardDescription>Total Duration</CardDescription>
            <CardTitle className="text-4xl">{totalDuration}</CardTitle>
            <p className="text-xs text-muted-foreground">minutes</p>
          </CardHeader>
        </Card>
      </div>

      {/* Baseline Modules */}
      {baselineModules.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">No baseline checkpoints configured</p>
            <p className="text-sm text-muted-foreground">
              Run the seed data to create sample baseline configuration
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Baseline Checkpoints</CardTitle>
            <CardDescription>
              Students complete these in order before plan generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {baselineModules.map((baseline, index) => (
                <div
                  key={baseline.module_id}
                  className={`p-4 rounded-lg border-2 border-charcoal ${
                    baseline.is_active ? "bg-white" : "bg-gray-100 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className="bg-charcoal text-white">
                          #{baseline.checkpoint_order}
                        </Badge>
                        <h3 className="font-bold text-lg">{baseline.title}</h3>
                        {baseline.is_active ? (
                          <Badge variant="default" className="bg-green-500">
                            <Eye className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {baseline.subtitle}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{baseline.estimated_duration_min} minutes</span>
                        </div>
                        {baseline.module && (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">
                                Module: {baseline.module.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">
                                {baseline.module.question_count} questions
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={baseline.is_active}
                        onCheckedChange={() =>
                          toggleActive(baseline.module_id, baseline.is_active)
                        }
                      />
                      <div className="flex flex-col gap-1">
                        <Button variant="outline" size="sm" disabled={index === 0}>
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={index === baselineModules.length - 1}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-yellow-900">⚠️ Important</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• Checkpoints are completed in sequential order</p>
          <p>• Only active checkpoints are shown to students</p>
          <p>• Students must complete ALL active checkpoints before plan generation</p>
          <p>• Each checkpoint should be 5-10 questions (quick assessment)</p>
          <p>• Total baseline time: ~30-60 minutes recommended</p>
        </CardContent>
      </Card>
    </div>
  )
}

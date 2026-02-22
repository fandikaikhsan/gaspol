"use client"

/**
 * Admin Modules Management
 * Phase 8: Admin Console
 */

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Clock, FileText } from "lucide-react"

interface Module {
  id: string
  name: string
  description: string
  module_type: string
  question_count: number
  time_limit_min: number | null
  question_ids: string[]
  status: string
  created_at: string
}

export default function AdminModulesPage() {
  const { toast } = useToast()
  const [modules, setModules] = useState<Module[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")

  useEffect(() => {
    loadModules()
  }, [])

  const loadModules = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("modules")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      setModules(data || [])
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load modules. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getModuleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      baseline: "Baseline",
      drill_focus: "Drill (Focused)",
      drill_mixed: "Drill (Mixed)",
      mock: "Mock Test",
      review: "Review",
    }
    return labels[type] || type
  }

  const getModuleTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      baseline: "bg-pastel-pink",
      drill_focus: "bg-pastel-lavender",
      drill_mixed: "bg-pastel-mint",
      mock: "bg-pastel-peach",
      review: "bg-pastel-sky",
    }
    return colors[type] || "bg-gray-200"
  }

  const filteredModules = modules.filter((module) => {
    if (filter === "all") return true
    return module.module_type === filter
  })

  const moduleTypes = ["all", "baseline", "drill_focus", "drill_mixed", "mock", "review"]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading modules...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Module Management</h1>
          <p className="text-muted-foreground">
            Manage question collections and assessments
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Module
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {moduleTypes.map((type) => (
              <Button
                key={type}
                variant={filter === type ? "default" : "outline"}
                onClick={() => setFilter(type)}
                size="sm"
              >
                {type === "all" ? "All Modules" : getModuleTypeLabel(type)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modules List */}
      {filteredModules.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">No modules found</p>
            <p className="text-sm text-muted-foreground">
              {filter === "all"
                ? "Run the seed data to create sample modules"
                : `No ${getModuleTypeLabel(filter)} modules found`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredModules.map((module) => (
            <Card
              key={module.id}
              className={`${getModuleTypeColor(module.module_type)} hover:shadow-brutal transition-shadow cursor-pointer`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Badge variant="outline">
                    {getModuleTypeLabel(module.module_type)}
                  </Badge>
                  <Badge variant={module.status === "published" ? "default" : "secondary"}>
                    {module.status}
                  </Badge>
                </div>
                <CardTitle className="mt-2">{module.name}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{module.question_count} questions</span>
                  </div>
                  {module.time_limit_min && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{module.time_limit_min} minutes</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {moduleTypes
          .filter((type) => type !== "all")
          .map((type) => {
            const count = modules.filter((m) => m.module_type === type).length
            return (
              <Card key={type} className={getModuleTypeColor(type)}>
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs">
                    {getModuleTypeLabel(type)}
                  </CardDescription>
                  <CardTitle className="text-3xl">{count}</CardTitle>
                </CardHeader>
              </Card>
            )
          })}
      </div>
    </div>
  )
}

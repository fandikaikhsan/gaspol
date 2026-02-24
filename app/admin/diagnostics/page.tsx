"use client"

/**
 * Database Diagnostics Page
 * Check baseline modules, modules, and questions status
 */

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Loader2, AlertCircle, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react"

interface DiagnosticResult {
  baseline_modules: any[]
  modules: any[]
  orphaned_baseline_modules: any[]
  question_count: number
}

export default function DiagnosticsPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [results, setResults] = useState<DiagnosticResult | null>(null)

  useEffect(() => {
    runDiagnostics()
  }, [])

  const [isFixing, setIsFixing] = useState(false)

  const runDiagnostics = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      // 1. Get baseline modules with their referenced modules
      const { data: baselineModules, error: bmError } = await supabase
        .from('baseline_modules')
        .select(`
          id,
          module_id,
          checkpoint_order,
          title,
          is_active,
          module:modules(id, name, is_published)
        `)
        .order('checkpoint_order')

      if (bmError) throw bmError

      // 2. Get all modules
      const { data: modules, error: modulesError } = await supabase
        .from('modules')
        .select('id, name, module_type, is_published, created_at')
        .order('created_at', { ascending: false })

      if (modulesError) throw modulesError

      // 3. Count questions
      const { count: questionCount, error: qError } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      if (qError) throw qError

      // 4. Find orphaned baseline modules
      const orphaned = (baselineModules || []).filter((bm: any) => !bm.module)

      setResults({
        baseline_modules: baselineModules || [],
        modules: modules || [],
        orphaned_baseline_modules: orphaned,
        question_count: questionCount || 0,
      })
    } catch (error) {
      console.error('Diagnostics error:', error)
      toast({
        variant: "destructive",
        title: "Failed to Run Diagnostics",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!results) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">Failed to load diagnostics</p>
            <Button onClick={runDiagnostics} className="mt-4">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const hasIssues = results.orphaned_baseline_modules.length > 0
  const hasModules = results.modules.length > 0
  const hasPublishedModules = results.modules.filter((m: any) => m.is_published).length > 0
  const hasQuestions = results.question_count > 0

  const fixIssues = async () => {
    setIsFixing(true)
    try {
      const response = await fetch('/admin/diagnostics/fix', {
        method: 'POST',
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Issues Fixed!",
          description: result.message,
        })
        // Reload diagnostics
        await runDiagnostics()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Fix error:', error)
      toast({
        variant: "destructive",
        title: "Failed to Fix",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsFixing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Diagnostics</h1>
          <p className="text-muted-foreground">
            Baseline module configuration status
          </p>
        </div>
        <Button variant="outline" onClick={runDiagnostics}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Baseline Modules</CardDescription>
            <CardTitle className="text-4xl">{results.baseline_modules.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Modules</CardDescription>
            <CardTitle className="text-4xl">{results.modules.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Published Modules</CardDescription>
            <CardTitle className="text-4xl">
              {results.modules.filter((m: any) => m.is_published).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Questions</CardDescription>
            <CardTitle className="text-4xl">{results.question_count}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Issues Alert */}
      {hasIssues && (
        <Card className="border-red-500 bg-red-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-red-900">
                  <AlertCircle className="h-5 w-5" />
                  Configuration Issues Detected
                </CardTitle>
                <CardDescription className="text-red-700">
                  {results.orphaned_baseline_modules.length} baseline module(s) reference non-existent modules
                </CardDescription>
              </div>
              <Button
                onClick={fixIssues}
                disabled={isFixing}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isFixing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fixing...
                  </>
                ) : (
                  'Auto-Fix Issues'
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.orphaned_baseline_modules.map((bm: any) => (
                <div key={bm.id} className="p-3 bg-white border-2 border-red-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{bm.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Checkpoint {bm.checkpoint_order}
                      </p>
                      <p className="text-sm font-mono text-red-600 mt-1">
                        Module ID: {bm.module_id}
                      </p>
                    </div>
                    <Badge variant="destructive">Broken Link</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Fixes */}
      {hasIssues && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-900">
              <AlertTriangle className="h-5 w-5" />
              How to Fix
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <p className="font-semibold">Option 1: Create Missing Modules</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Go to <code className="bg-white px-2 py-1 rounded">/admin/modules</code></li>
                <li>Create new modules with questions</li>
                <li>Publish the modules</li>
                <li>Go to <code className="bg-white px-2 py-1 rounded">/admin/baseline</code></li>
                <li>Delete broken baseline checkpoints</li>
                <li>Add new checkpoints linking to your published modules</li>
              </ol>
            </div>
            <div className="pt-2 border-t border-yellow-200">
              <p className="font-semibold">Option 2: Delete Broken Baseline Checkpoints</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Go to <code className="bg-white px-2 py-1 rounded">/admin/baseline</code></li>
                <li>Delete the broken checkpoints listed above</li>
                <li>Create new ones once you have published modules</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Baseline Modules Status */}
      <Card>
        <CardHeader>
          <CardTitle>Baseline Modules Configuration</CardTitle>
          <CardDescription>
            Baseline checkpoints and their linked modules
          </CardDescription>
        </CardHeader>
        <CardContent>
          {results.baseline_modules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No baseline modules configured
            </div>
          ) : (
            <div className="space-y-2">
              {results.baseline_modules.map((bm: any) => {
                const hasModule = !!bm.module
                const isPublished = bm.module?.is_published

                return (
                  <div
                    key={bm.id}
                    className={`p-4 border-2 rounded-lg ${
                      !hasModule
                        ? 'border-red-300 bg-red-50'
                        : !isPublished
                        ? 'border-yellow-300 bg-yellow-50'
                        : 'border-green-300 bg-green-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">
                            Checkpoint {bm.checkpoint_order}
                          </Badge>
                          {bm.is_active ? (
                            <Badge className="bg-green-500 text-white">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Hidden</Badge>
                          )}
                        </div>
                        <h3 className="font-semibold">{bm.title}</h3>
                        <p className="text-sm font-mono text-muted-foreground mt-1">
                          Links to Module ID: {bm.module_id}
                        </p>
                        {hasModule && (
                          <>
                            <p className="text-sm mt-1">
                              → <span className="font-medium">{bm.module.name}</span>
                            </p>
                            <p className="text-xs font-mono text-green-600 mt-1">
                              ✓ Module exists with ID: {bm.module.id}
                            </p>
                          </>
                        )}
                        {!hasModule && (
                          <p className="text-xs text-red-600 mt-1">
                            ✗ No module found with this ID
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!hasModule ? (
                          <>
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <Badge variant="destructive">Module Not Found</Badge>
                          </>
                        ) : !isPublished ? (
                          <>
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            <Badge className="bg-yellow-500 text-white">Not Published</Badge>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <Badge className="bg-green-500 text-white">OK</Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Modules */}
      <Card>
        <CardHeader>
          <CardTitle>Available Modules</CardTitle>
          <CardDescription>
            All modules in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {results.modules.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No modules created yet
              </p>
              <Button onClick={() => window.location.href = '/admin/modules'}>
                Go to Module Management
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {results.modules.map((module: any) => (
                <div
                  key={module.id}
                  className="p-4 border-2 border-charcoal rounded-lg bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{module.module_type}</Badge>
                        <Badge variant={module.is_published ? "default" : "secondary"}>
                          {module.is_published ? "Published" : "Draft"}
                        </Badge>
                      </div>
                      <h3 className="font-semibold">{module.name}</h3>
                      <p className="text-sm font-mono text-muted-foreground">
                        {module.id}
                      </p>
                    </div>
                    {module.is_published ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span>Questions in database</span>
            {hasQuestions ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-semibold">{results.question_count}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-600">None</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span>Modules created</span>
            {hasModules ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-semibold">{results.modules.length}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-600">None</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span>Published modules</span>
            {hasPublishedModules ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-semibold">
                  {results.modules.filter((m: any) => m.is_published).length}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-600">None</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span>Baseline configuration</span>
            {!hasIssues ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-semibold">OK</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-600">Issues Found</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

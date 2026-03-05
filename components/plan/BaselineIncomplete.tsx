"use client"

/**
 * BaselineIncomplete Component (T-060)
 * Shows baseline assessment progress when not yet complete
 */

import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useTranslation } from "@/lib/i18n"
import { CheckCircle2, Circle, Lock, ArrowRight } from "lucide-react"
import type { BaselineModule } from "@/lib/hooks/usePlanData"

interface BaselineIncompleteProps {
  baselineModules: BaselineModule[]
}

export function BaselineIncomplete({
  baselineModules,
}: BaselineIncompleteProps) {
  const router = useRouter()
  const { t } = useTranslation("plan")

  const baselineProgress =
    baselineModules.length > 0
      ? (baselineModules.filter((m) => m.is_completed).length /
          baselineModules.length) *
        100
      : 0

  return (
    <div className="min-h-screen bg-surface-baseline/20 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("baselineIncomplete.subtitle")}
          </p>
        </div>

        {/* Step 1: Baseline Assessment */}
        <Card className="border-2 border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold touch-target">
                  1
                </div>
                <div>
                  <CardTitle>
                    {t("baselineIncomplete.completeBaseline")}
                  </CardTitle>
                  <CardDescription>
                    {t("baselineIncomplete.baselineDesc")}
                  </CardDescription>
                </div>
              </div>
              {baselineProgress > 0 && (
                <Badge variant="secondary">
                  {t("baselineIncomplete.progressPercent", {
                    percent: Math.round(baselineProgress),
                  })}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>{t("baselineIncomplete.progress")}</span>
                <span className="font-medium">
                  {t("baselineIncomplete.modulesCount", {
                    completed: baselineModules.filter((m) => m.is_completed)
                      .length,
                    total: baselineModules.length,
                  })}
                </span>
              </div>
              <Progress value={baselineProgress} className="h-3" />
            </div>

            <div className="space-y-2">
              {baselineModules.map((module) => (
                <div
                  key={module.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg min-h-[44px]"
                >
                  <div className="flex items-center gap-3">
                    {module.is_completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span
                      className={
                        module.is_completed ? "text-muted-foreground" : ""
                      }
                    >
                      {module.title}
                    </span>
                  </div>
                  {module.is_completed && module.score && (
                    <Badge variant="outline">{module.score.toFixed(0)}%</Badge>
                  )}
                </div>
              ))}
            </div>

            <Button
              className="w-full min-h-[44px]"
              onClick={() => router.push("/baseline")}
            >
              {baselineProgress > 0
                ? t("baselineIncomplete.continueAssessment")
                : t("baselineIncomplete.startAssessment")}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Locked Steps */}
        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-muted-foreground font-bold touch-target">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-muted-foreground">
                  {t("baselineIncomplete.completeTasks")}
                </CardTitle>
                <CardDescription>
                  {t("baselineIncomplete.completeTasksDesc")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-muted-foreground font-bold touch-target">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-muted-foreground">
                  {t("baselineIncomplete.recycleAssessment")}
                </CardTitle>
                <CardDescription>
                  {t("baselineIncomplete.recycleAssessmentDesc")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}

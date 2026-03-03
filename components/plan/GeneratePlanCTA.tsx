"use client"

/**
 * GeneratePlanCTA Component (T-060)
 * Shown when baseline is complete but no plan generated yet
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
import { useTranslation } from "@/lib/i18n"
import { useGeneratePlan } from "@/lib/hooks/usePlanData"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle2, Lock, Sparkles, Loader2 } from "lucide-react"
import type { BaselineModule } from "@/lib/hooks/usePlanData"

interface GeneratePlanCTAProps {
  baselineModules: BaselineModule[]
}

export function GeneratePlanCTA({ baselineModules }: GeneratePlanCTAProps) {
  const { t } = useTranslation("plan")
  const { toast } = useToast()
  const generatePlan = useGeneratePlan()

  const handleGenerate = () => {
    generatePlan.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: t("toast.planGenerated"),
          description: t("toast.planGeneratedDesc"),
        })
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: t("toast.error"),
          description: error.message || "Failed to generate plan",
        })
      },
    })
  }

  return (
    <div className="min-h-screen bg-surface-plan/20 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("baselineComplete.subtitle")}
          </p>
        </div>

        {/* Completed Baseline */}
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <CardTitle className="text-green-800">
                  {t("baselineComplete.assessmentComplete")}
                </CardTitle>
                <CardDescription className="text-green-700">
                  {t("baselineComplete.avgScore", {
                    score: (
                      baselineModules.reduce(
                        (acc, m) => acc + (m.score || 0),
                        0,
                      ) / baselineModules.length
                    ).toFixed(0),
                  })}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Generate Plan CTA */}
        <Card className="border-2 border-primary">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground touch-target">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>{t("baselineComplete.generatePlan")}</CardTitle>
                <CardDescription>
                  {t("baselineComplete.generatePlanDesc")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full min-h-[44px]"
              onClick={handleGenerate}
              disabled={generatePlan.isPending}
            >
              {generatePlan.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("baselineComplete.generating")}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t("baselineComplete.generateButton")}
                </>
              )}
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
                  {t("baselineComplete.recycleAssessment")}
                </CardTitle>
                <CardDescription>
                  {t("baselineComplete.recycleLockedDesc")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}

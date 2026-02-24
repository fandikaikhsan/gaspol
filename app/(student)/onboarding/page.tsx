"use client"

/**
 * Onboarding Flow
 * Phase 1: Authentication & State Machine
 *
 * Collects: package_days, time_budget_min, target_university, target_major
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { updateUserState } from "@/hooks/useUserPhase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n"

export default function OnboardingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation('onboarding')
  const { t: tc } = useTranslation('common')

  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  // Form data
  const [packageDays, setPackageDays] = useState<number>(14)
  const [timeBudget, setTimeBudget] = useState<number>(60)
  const [targetUniversity, setTargetUniversity] = useState("")
  const [targetMajor, setTargetMajor] = useState("")

  const PACKAGE_OPTIONS = [
    { value: 7, label: t('package.7days'), subtitle: t('package.7daysDesc'), color: "bg-construct-teliti" },
    { value: 14, label: t('package.14days'), subtitle: t('package.14daysDesc'), color: "bg-construct-speed" },
    { value: 21, label: t('package.21days'), subtitle: t('package.21daysDesc'), color: "bg-construct-reasoning" },
    { value: 30, label: t('package.30days'), subtitle: t('package.30daysDesc'), color: "bg-construct-computation" },
  ]

  const TIME_BUDGET_OPTIONS = [
    { value: 30, label: t('time.30min'), subtitle: t('time.30minDesc') },
    { value: 60, label: t('time.60min'), subtitle: t('time.60minDesc') },
    { value: 90, label: t('time.90min'), subtitle: t('time.90minDesc') },
    { value: 120, label: t('time.120min'), subtitle: t('time.120minDesc') },
  ]

  const handleComplete = async () => {
    if (!targetUniversity.trim()) {
      toast({
        variant: "destructive",
        title: t('toast.missingInfo'),
        description: t('toast.missingInfoDesc'),
      })
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("User not authenticated")
      }

      // Update profile — must succeed before transitioning phase
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          package_days: packageDays,
          time_budget_min: timeBudget,
          target_university: targetUniversity,
          target_major: targetMajor || null,
        })
        .eq("id", user.id)

      if (profileError) {
        throw new Error("Failed to save profile: " + profileError.message)
      }

      // Verify the data was actually written
      const { data: verifyProfile } = await supabase
        .from("profiles")
        .select("package_days, time_budget_min")
        .eq("id", user.id)
        .single()

      if (!verifyProfile?.package_days || !verifyProfile?.time_budget_min) {
        throw new Error("Profile save verification failed. Please try again.")
      }

      // Update user state - transition to baseline assessment
      await updateUserState(user.id, {
        current_phase: "BASELINE_ASSESSMENT_IN_PROGRESS",
        onboarding_completed_at: new Date().toISOString(),
        baseline_started_at: new Date().toISOString(),
      })

      toast({
        title: t('toast.setupComplete'),
        description: t('toast.setupCompleteDesc'),
      })

      // Redirect to baseline
      router.push("/baseline")
      router.refresh()
    } catch (error) {
      console.error("Onboarding error:", error)
      toast({
        variant: "destructive",
        title: t('toast.error'),
        description: t('toast.errorDesc'),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full mx-1 transition-colors ${
                  s <= step ? "bg-primary" : "bg-neutral-200"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground text-center">
            {t('step', { step })}
          </p>
        </div>

        {/* Step 1: Package Selection */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('package.title')}</CardTitle>
              <CardDescription>
                {t('package.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={packageDays.toString()}
                onValueChange={(value) => setPackageDays(Number(value))}
              >
                {PACKAGE_OPTIONS.map((option) => (
                  <div key={option.value}>
                    <RadioGroupItem
                      value={option.value.toString()}
                      id={`package-${option.value}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`package-${option.value}`}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 border-border cursor-pointer transition-all peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-primary ${option.color}`}
                    >
                      <div>
                        <p className="font-bold text-lg">{option.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {option.subtitle}
                        </p>
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 border-border bg-background peer-data-[state=checked]:bg-primary" />
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <Button
                onClick={() => setStep(2)}
                className="w-full mt-6"
                size="lg"
              >
                {tc('button.continue')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Time Budget */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('time.title')}</CardTitle>
              <CardDescription>
                {t('time.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={timeBudget.toString()}
                onValueChange={(value) => setTimeBudget(Number(value))}
              >
                {TIME_BUDGET_OPTIONS.map((option) => (
                  <div key={option.value}>
                    <RadioGroupItem
                      value={option.value.toString()}
                      id={`time-${option.value}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`time-${option.value}`}
                      className="flex items-center justify-between p-4 rounded-lg border-2 border-border cursor-pointer transition-all peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-primary bg-background"
                    >
                      <div>
                        <p className="font-bold text-lg">{option.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {option.subtitle}
                        </p>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="brutal-outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                  size="lg"
                >
                  {tc('button.back')}
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1" size="lg">
                  {tc('button.continue')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Target University */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('target.title')}</CardTitle>
              <CardDescription>
                {t('target.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="university">
                  {t('target.universityLabel')}
                </Label>
                <Input
                  id="university"
                  placeholder={t('target.universityPlaceholder')}
                  value={targetUniversity}
                  onChange={(e) => setTargetUniversity(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="major">
                  {t('target.majorLabel')}
                </Label>
                <Input
                  id="major"
                  placeholder={t('target.majorPlaceholder')}
                  value={targetMajor}
                  onChange={(e) => setTargetMajor(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {/* Summary */}
              <div className="bg-muted p-4 rounded-lg mt-6 space-y-2">
                <p className="font-semibold text-sm">{t('summary.title')}</p>
                <ul className="text-sm space-y-1">
                  <li>{t('summary.duration', { days: packageDays })}</li>
                  <li>{t('summary.dailyStudy', { minutes: timeBudget })}</li>
                  <li>{t('summary.targetUni', { university: targetUniversity || "Not specified" })}</li>
                </ul>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="brutal-outline"
                  onClick={() => setStep(2)}
                  className="flex-1"
                  size="lg"
                  disabled={isLoading}
                >
                  {tc('button.back')}
                </Button>
                <Button
                  onClick={handleComplete}
                  className="flex-1"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? t('submitting') : t('submit')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

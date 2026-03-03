"use client"

/**
 * Onboarding Flow
 * Phase 1: Authentication & State Machine
 *
 * Collects: exam_date (T-025), time_budget_min (T-026), target_university, target_major
 */

import { useState, useMemo } from "react"
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
import { Check, Calendar, Clock, AlertCircle } from "lucide-react"

export default function OnboardingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation('onboarding')
  const { t: tc } = useTranslation('common')

  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  // Form data
  const [examDate, setExamDate] = useState<string>("") // ISO date string YYYY-MM-DD
  const [timeBudget, setTimeBudget] = useState<number>(60)
  const [customTimeBudget, setCustomTimeBudget] = useState<string>("")
  const [useCustomTime, setUseCustomTime] = useState(false)
  const [targetUniversity, setTargetUniversity] = useState("")
  const [targetMajor, setTargetMajor] = useState("")

  // T-025: Calculate days remaining from exam date
  const daysRemaining = useMemo(() => {
    if (!examDate) return null
    const exam = new Date(examDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    exam.setHours(0, 0, 0, 0)
    return Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }, [examDate])

  // Min date = tomorrow, max date = 1 year from now
  const minDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }, [])

  const maxDate = useMemo(() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() + 1)
    return d.toISOString().split('T')[0]
  }, [])

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

    if (!examDate || !daysRemaining || daysRemaining < 1) {
      toast({
        variant: "destructive",
        title: t('toast.missingInfo', { fallback: 'Missing Information' }),
        description: t('toast.examDateRequired', { fallback: 'Please select a valid exam date.' }),
      })
      return
    }

    const effectiveTimeBudget = useCustomTime ? Number(customTimeBudget) : timeBudget
    if (!effectiveTimeBudget || effectiveTimeBudget < 10 || effectiveTimeBudget > 480) {
      toast({
        variant: "destructive",
        title: t('toast.missingInfo', { fallback: 'Missing Information' }),
        description: t('toast.timeBudgetInvalid', { fallback: 'Please enter a valid study time (10–480 minutes).' }),
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

      // T-025: Save exam_date + auto-computed package_days
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          exam_date: examDate,
          package_days: Math.min(daysRemaining, 365),
          time_budget_min: effectiveTimeBudget,
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

        {/* Step 1: Exam Date (T-025) */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {t('examDate.title', { fallback: 'When is your exam?' })}
              </CardTitle>
              <CardDescription>
                {t('examDate.subtitle', { fallback: 'Select your UTBK exam date. We\'ll create a study plan that counts down to the big day.' })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="exam-date" className="text-base font-semibold">
                  {t('examDate.label', { fallback: 'Exam Date' })}
                </Label>
                <Input
                  id="exam-date"
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  min={minDate}
                  max={maxDate}
                  className="text-lg h-12"
                />
              </div>

              {/* Days remaining countdown */}
              {daysRemaining !== null && (
                <div className={`p-4 rounded-lg border-2 ${
                  daysRemaining < 7 ? 'border-destructive bg-destructive/10' :
                  daysRemaining < 14 ? 'border-orange-400 bg-orange-50' :
                  'border-status-strong bg-status-strong/10'
                }`}>
                  <div className="flex items-center gap-3">
                    {daysRemaining < 7 && <AlertCircle className="w-5 h-5 text-destructive" />}
                    <div>
                      <p className="text-2xl font-bold">
                        {daysRemaining} {t('examDate.daysLeft', { fallback: 'days remaining' })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {daysRemaining < 7
                          ? t('examDate.urgentMsg', { fallback: 'Time is short — we\'ll optimize for high-impact practice!' })
                          : daysRemaining < 14
                          ? t('examDate.moderateMsg', { fallback: 'Good amount of time for focused preparation.' })
                          : t('examDate.comfortMsg', { fallback: 'Great! Plenty of time to build a solid foundation.' })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={() => setStep(2)}
                className="w-full mt-6"
                size="lg"
                disabled={!examDate || !daysRemaining || daysRemaining < 1}
              >
                {tc('button.continue')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Time Budget (T-026) */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {t('time.title')}
              </CardTitle>
              <CardDescription>
                {t('time.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={useCustomTime ? 'custom' : timeBudget.toString()}
                onValueChange={(value) => {
                  if (value === 'custom') {
                    setUseCustomTime(true)
                  } else {
                    setUseCustomTime(false)
                    setTimeBudget(Number(value))
                  }
                }}
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
                      className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all bg-background ${
                        !useCustomTime && timeBudget === option.value
                          ? "ring-2 ring-primary border-primary shadow-md"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div>
                        <p className="font-bold text-lg">{option.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {option.subtitle}
                        </p>
                      </div>
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                          !useCustomTime && timeBudget === option.value
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background"
                        }`}
                      >
                        {!useCustomTime && timeBudget === option.value && <Check className="h-4 w-4" />}
                      </div>
                    </Label>
                  </div>
                ))}

                {/* Custom time input */}
                <div>
                  <RadioGroupItem
                    value="custom"
                    id="time-custom"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="time-custom"
                    className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all bg-background ${
                      useCustomTime
                        ? "ring-2 ring-primary border-primary shadow-md"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex-1">
                      <p className="font-bold text-lg">{t('time.custom', { fallback: 'Custom' })}</p>
                      {useCustomTime && (
                        <div className="mt-2 flex items-center gap-2">
                          <Input
                            type="number"
                            min={10}
                            max={480}
                            value={customTimeBudget}
                            onChange={(e) => setCustomTimeBudget(e.target.value)}
                            placeholder="45"
                            className="w-24 h-9"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="text-sm text-muted-foreground">
                            {t('time.minutesPerDay', { fallback: 'minutes/day' })}
                          </span>
                        </div>
                      )}
                    </div>
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                        useCustomTime
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background"
                      }`}
                    >
                      {useCustomTime && <Check className="h-4 w-4" />}
                    </div>
                  </Label>
                </div>
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
                  <li>📅 {t('summary.examDate', { fallback: 'Exam date' })}: {examDate ? new Date(examDate).toLocaleDateString() : '—'} ({daysRemaining} {t('examDate.daysLeft', { fallback: 'days remaining' })})</li>
                  <li>⏱️ {t('summary.dailyStudy', { minutes: useCustomTime ? Number(customTimeBudget) : timeBudget })}</li>
                  <li>🎯 {t('summary.targetUni', { university: targetUniversity || "Not specified" })}</li>
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

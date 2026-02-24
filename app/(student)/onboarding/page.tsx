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

const PACKAGE_OPTIONS = [
  { value: 7, label: "7 Days", subtitle: "Sprint mode - final week prep", color: "bg-construct-teliti" },
  { value: 14, label: "14 Days", subtitle: "Intensive - 2 weeks focus", color: "bg-construct-speed" },
  { value: 21, label: "21 Days", subtitle: "Balanced - 3 weeks plan", color: "bg-construct-reasoning" },
  { value: 30, label: "30 Days", subtitle: "Comprehensive - full month", color: "bg-construct-computation" },
]

const TIME_BUDGET_OPTIONS = [
  { value: 30, label: "30 min/day", subtitle: "Quick sessions" },
  { value: 60, label: "1 hour/day", subtitle: "Standard" },
  { value: 90, label: "1.5 hours/day", subtitle: "Intensive" },
  { value: 120, label: "2+ hours/day", subtitle: "Full commitment" },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  // Form data
  const [packageDays, setPackageDays] = useState<number>(14)
  const [timeBudget, setTimeBudget] = useState<number>(60)
  const [targetUniversity, setTargetUniversity] = useState("")
  const [targetMajor, setTargetMajor] = useState("")

  const handleComplete = async () => {
    if (!targetUniversity.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter your target university",
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
        title: "Setup Complete! 🎯",
        description: "Let's start with your baseline assessment",
      })

      // Redirect to baseline
      router.push("/baseline")
      router.refresh()
    } catch (error) {
      console.error("Onboarding error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save your preferences. Please try again.",
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
            Step {step} of 3
          </p>
        </div>

        {/* Step 1: Package Selection */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>How much time do you have?</CardTitle>
              <CardDescription>
                Choose your prep duration - we'll create a personalized plan
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
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Time Budget */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Daily study time?</CardTitle>
              <CardDescription>
                How much time can you commit each day?
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
                  Back
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1" size="lg">
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Target University */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Your target university?</CardTitle>
              <CardDescription>
                We'll tailor your prep to match their standards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="university">
                  Target University <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="university"
                  placeholder="e.g., Universitas Indonesia"
                  value={targetUniversity}
                  onChange={(e) => setTargetUniversity(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="major">
                  Target Major <span className="text-muted-foreground text-sm">(Optional)</span>
                </Label>
                <Input
                  id="major"
                  placeholder="e.g., Kedokteran, Teknik Informatika"
                  value={targetMajor}
                  onChange={(e) => setTargetMajor(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {/* Summary */}
              <div className="bg-muted p-4 rounded-lg mt-6 space-y-2">
                <p className="font-semibold text-sm">Your Plan Summary:</p>
                <ul className="text-sm space-y-1">
                  <li>📅 Duration: <strong>{packageDays} days</strong></li>
                  <li>⏱️ Daily study: <strong>{timeBudget} minutes</strong></li>
                  <li>🎯 Target: <strong>{targetUniversity || "Not specified"}</strong></li>
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
                  Back
                </Button>
                <Button
                  onClick={handleComplete}
                  className="flex-1"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? "Setting up..." : "Start Baseline Assessment"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

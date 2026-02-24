"use client"

/**
 * Signup Page
 * Phase 1: Authentication & State Machine
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { getUserFriendlyError } from "@/lib/utils/error-messages"
import { useTranslation } from "@/lib/i18n"

export default function SignupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation('auth')

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: t('signup.passwordMismatch'),
        description: t('signup.passwordMismatchDesc'),
      })
      return
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: t('signup.weakPassword'),
        description: t('signup.weakPasswordDesc'),
      })
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        toast({
          variant: "destructive",
          title: t('signup.failed'),
          description: getUserFriendlyError(error, t('signup.failedDesc')),
        })
        return
      }

      if (data.user) {
        // Update profile with full name
        const { error: updateError } = await supabase
          .from("profiles")
          // @ts-ignore - Supabase type mismatch for profiles update
          .update({ full_name: fullName })
          .eq("id", data.user.id)

        if (updateError) {
          console.error("Profile update error:", updateError)
          // Don't block signup for profile update failure
        }

        // Check if email confirmation is required
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          // Email confirmation required
          toast({
            title: t('signup.checkEmail'),
            description: t('signup.checkEmailDesc'),
          })
          return
        }

        toast({
          title: t('signup.created'),
          description: t('signup.createdDesc'),
        })

        // Redirect to onboarding
        router.push("/onboarding")
        router.refresh()
      }
    } catch (error: any) {
      console.error("Signup error:", error)
      toast({
        variant: "destructive",
        title: t('signup.error'),
        description: getUserFriendlyError(error, t('signup.failedDesc')),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-background">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl mb-2">
          {t('signup.title')}
        </CardTitle>
        <CardDescription>
          {t('signup.subtitle')}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSignup}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">{t('signup.fullName')}</Label>
            <Input
              id="fullName"
              type="text"
              placeholder={t('signup.fullNamePlaceholder')}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('signup.email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('signup.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('signup.password')}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t('signup.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('signup.confirmPassword')}</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder={t('signup.confirmPasswordPlaceholder')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? t('signup.submitting') : t('signup.submit')}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            {t('signup.hasAccount')}{" "}
            <Link
              href="/login"
              className="font-semibold text-primary hover:underline"
            >
              {t('signup.loginLink')}
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}

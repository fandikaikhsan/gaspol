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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

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

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (error) {
        toast({
          variant: "destructive",
          title: t('signup.failed'),
          description: error.message,
        })
        setIsGoogleLoading(false)
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('signup.failed'),
        description: error.message,
      })
      setIsGoogleLoading(false)
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
            disabled={isLoading || isGoogleLoading}
          >
            {isLoading ? t('signup.submitting') : t('signup.submit')}
          </Button>

          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t('signup.orContinueWith')}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignup}
            disabled={isLoading || isGoogleLoading}
          >
            {isGoogleLoading ? (
              t('signup.googleLoading')
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                {t('signup.google')}
              </>
            )}
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

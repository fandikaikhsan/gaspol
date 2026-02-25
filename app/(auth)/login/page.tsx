"use client"

/**
 * Login Page
 * Phase 1: Authentication & State Machine
 */

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { getUserFriendlyError, getDevMessage } from "@/lib/utils/error-messages"
import { useTranslation } from "@/lib/i18n"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/plan"
  const { toast } = useToast()
  const { t } = useTranslation('auth')

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Handle email confirmation error specifically
        if (error.message.includes("Email not confirmed")) {
          toast({
            variant: "destructive",
            title: t('login.emailNotConfirmed'),
            description: getDevMessage(
              "Please check your email and click the confirmation link. Or disable email confirmation in Supabase dashboard for development.",
              t('login.emailNotConfirmedDesc')
            ),
          })
        } else {
          toast({
            variant: "destructive",
            title: t('login.failed'),
            description: getUserFriendlyError(error, t('login.failedDesc')),
          })
        }
        return
      }

      if (data.user) {
        toast({
          title: t('login.welcomeBack'),
          description: t('login.redirecting'),
        })
        router.push(redirectTo)
        router.refresh()
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('login.failed'),
        description: getUserFriendlyError(error, t('login.failedDesc')),
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      })
      
      if (error) {
        toast({
          variant: "destructive",
          title: t('login.failed'),
          description: error.message,
        })
        setIsGoogleLoading(false)
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('login.failed'),
        description: error.message,
      })
      setIsGoogleLoading(false)
    }
  }

  return (
    <Card className="bg-background">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl mb-2">
          {t('login.title')}
        </CardTitle>
        <CardDescription>
          {t('login.subtitle')}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('login.email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('login.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('login.password')}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t('login.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {isLoading ? t('login.submitting') : t('login.submit')}
          </Button>

          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t('login.orContinueWith')}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={isLoading || isGoogleLoading}
          >
            {isGoogleLoading ? (
              t('login.googleLoading')
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
                {t('login.google')}
              </>
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            {t('login.noAccount')}{" "}
            <Link
              href="/signup"
              className="font-semibold text-primary hover:underline"
            >
              {t('login.signupLink')}
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}

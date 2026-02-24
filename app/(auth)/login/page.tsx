"use client"

/**
 * Login Page
 * Phase 1: Authentication & State Machine
 */

import { useState } from "react"
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

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/plan"
  const { toast } = useToast()
  const { t } = useTranslation('auth')

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

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
            disabled={isLoading}
          >
            {isLoading ? t('login.submitting') : t('login.submit')}
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

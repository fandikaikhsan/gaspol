"use client"

/**
 * Profile Settings Page
 * User can edit name, change password, switch language, and logout
 */

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useTranslation, useLanguageStore } from "@/lib/i18n"
import type { Locale } from "@/lib/i18n"

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation('settings')
  const { locale, setLocale } = useLanguageStore()

  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Edit name state
  const [fullName, setFullName] = useState("")

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      setProfile(data)
      setFullName(data?.full_name || "")
    }
  }

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", user.id)

      if (error) throw error

      toast({
        title: t('name.success'),
        description: t('name.successDesc'),
      })

      loadProfile()
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('name.error'),
        description: t('name.errorDesc'),
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: t('password.mismatch'),
        description: t('password.mismatchDesc'),
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: t('password.weak'),
        description: t('password.weakDesc'),
      })
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      toast({
        title: t('password.success'),
        description: t('password.successDesc'),
      })

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('password.error'),
        description: t('password.errorDesc'),
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLanguageChange = async (newLocale: Locale) => {
    setLocale(newLocale)

    // Persist to DB
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from("profiles")
        .update({ language: newLocale })
        .eq("id", user.id)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/plan">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
        </div>

        {/* Profile Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.title')}</CardTitle>
            <CardDescription>{t('profile.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">{t('profile.email')}</p>
              <p className="font-semibold">{profile?.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('profile.role')}</p>
              <p className="font-semibold capitalize">{profile?.role || t('profile.student')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Edit Name Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('name.title')}</CardTitle>
            <CardDescription>{t('name.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateName} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t('name.label')}</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder={t('name.placeholder')}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('name.saving') : t('name.save')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Language Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('language.title')}</CardTitle>
            <CardDescription>{t('language.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button
                variant={locale === 'id' ? 'default' : 'outline'}
                onClick={() => handleLanguageChange('id')}
                className="flex-1"
              >
                {t('language.id')}
              </Button>
              <Button
                variant={locale === 'en' ? 'default' : 'outline'}
                onClick={() => handleLanguageChange('en')}
                className="flex-1"
              >
                {t('language.en')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('password.title')}</CardTitle>
            <CardDescription>{t('password.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t('password.newPassword')}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder={t('password.newPasswordPlaceholder')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('password.confirmPassword')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t('password.confirmPasswordPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('password.changing') : t('password.change')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Logout Card */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-600">{t('logout.title')}</CardTitle>
            <CardDescription>{t('logout.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleLogout} className="w-full md:w-auto">
              {t('logout.button')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

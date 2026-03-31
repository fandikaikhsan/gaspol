"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Target,
  BookOpen,
  BarChart2,
  User,
  Rocket,
  LogOut,
  Settings,
} from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"

const navigation = [
  { key: "plan", href: "/plan", icon: Target },
  { key: "review", href: "/review", icon: BookOpen },
  { key: "analytics", href: "/analytics", icon: BarChart2 },
] as const

export function SideNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const { t } = useTranslation("common")

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      setProfile(data)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-72 md:shrink-0 md:flex-col md:border-r md:bg-background">
      <div className="flex h-16 shrink-0 items-center border-b px-5">
        <Link href="/plan" className="flex items-center gap-2">
          <Rocket className="h-5 w-5" />
          <span className="text-lg font-bold tracking-tight">
            {t("nav.gaspol")}
          </span>
        </Link>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-between overflow-y-auto px-3 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{t(`nav.${item.key}`)}</span>
              </Link>
            )
          })}
        </nav>

        <div className="space-y-3 border-t px-1 pt-4">
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold">
                {profile?.full_name || t("nav.user")}
              </p>
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {profile?.email}
            </p>
          </div>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => router.push("/settings")}
          >
            <Settings className="mr-2 h-4 w-4" />
            {t("nav.profileSettings")}
          </Button>

          <Button
            variant="destructive"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t("nav.logout")}
          </Button>
        </div>
      </div>
    </aside>
  )
}

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
  PanelLeftClose,
  PanelLeftOpen,
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

interface SideNavProps {
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function SideNav({
  collapsed = false,
  onToggleCollapse,
}: SideNavProps) {
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
    <aside
      className={cn(
        "hidden md:sticky md:top-0 md:flex md:h-screen md:shrink-0 md:flex-col md:border-r md:border-border md:bg-background transition-[width] duration-200 ease-out",
        collapsed ? "md:w-16" : "md:w-72",
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center border-b",
          collapsed
            ? "flex-col gap-2 py-3 px-2"
            : "h-16 flex-row gap-1 px-3",
        )}
      >
        {collapsed ? (
          <>
            {onToggleCollapse && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0 touch-target"
                onClick={onToggleCollapse}
                aria-label={t("nav.expandSidebar", {
                  fallback: "Expand sidebar",
                })}
                title={t("nav.expandSidebar", { fallback: "Expand sidebar" })}
              >
                <PanelLeftOpen className="h-5 w-5" />
              </Button>
            )}
            <Link
              href="/plan"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-transparent text-foreground transition-colors hover:bg-muted"
              title={t("nav.gaspol")}
              aria-label={t("nav.gaspol")}
            >
              <Rocket className="h-5 w-5" />
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/plan"
              className="flex min-w-0 flex-1 items-center gap-2 px-2"
            >
              <Rocket className="h-5 w-5 shrink-0" />
              <span className="truncate text-lg font-bold tracking-tight">
                {t("nav.gaspol")}
              </span>
            </Link>
            {onToggleCollapse && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 touch-target"
                onClick={onToggleCollapse}
                aria-label={t("nav.collapseSidebar", {
                  fallback: "Collapse sidebar",
                })}
                title={t("nav.collapseSidebar", {
                  fallback: "Collapse sidebar",
                })}
              >
                <PanelLeftClose className="h-5 w-5" />
              </Button>
            )}
          </>
        )}
      </div>

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col justify-between overflow-y-auto py-4",
          collapsed ? "px-2" : "px-3",
        )}
      >
        <nav className={cn("space-y-1", collapsed && "flex flex-col items-center")}>
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const Icon = item.icon
            const label = t(`nav.${item.key}`)

            return (
              <Link
                key={item.href}
                href={item.href}
                title={label}
                aria-label={label}
                className={cn(
                  "flex items-center rounded-lg text-sm font-medium transition-colors",
                  collapsed
                    ? "h-10 w-10 shrink-0 justify-center p-0"
                    : "gap-3 px-3 py-2",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className={cn(collapsed ? "h-5 w-5" : "h-4 w-4")} />
                {!collapsed && <span>{label}</span>}
              </Link>
            )
          })}
        </nav>

        <div
          className={cn(
            "border-t pt-4",
            collapsed
              ? "flex flex-col items-center gap-2 px-0"
              : "space-y-3 px-1",
          )}
        >
          {!collapsed && (
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
          )}

          <Button
            variant="outline"
            size={collapsed ? "icon" : "default"}
            className={cn(
              collapsed
                ? "h-10 w-10 shrink-0"
                : "w-full justify-start",
            )}
            onClick={() => router.push("/settings")}
            title={t("nav.profileSettings")}
            aria-label={t("nav.profileSettings")}
          >
            <Settings className={cn("h-4 w-4", !collapsed && "mr-2")} />
            {!collapsed && t("nav.profileSettings")}
          </Button>

          <Button
            variant="destructive"
            size={collapsed ? "icon" : "default"}
            className={cn(
              collapsed
                ? "h-10 w-10 shrink-0"
                : "w-full justify-start",
            )}
            onClick={handleLogout}
            title={t("nav.logout")}
            aria-label={t("nav.logout")}
          >
            <LogOut className={cn("h-4 w-4", !collapsed && "mr-2")} />
            {!collapsed && t("nav.logout")}
          </Button>
        </div>
      </div>
    </aside>
  )
}

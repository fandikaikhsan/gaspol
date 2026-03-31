/**
 * BottomNav Component
 * Phase 9: Mobile Optimization
 */

"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Menu, Target, BookOpen, BarChart2, Zap } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { createClient } from "@/lib/supabase/client"
import { useTranslation } from "@/lib/i18n"

const navigationBeforeTutor = [
  { key: "plan", href: "/plan", icon: Target },
  { key: "review", href: "/review", icon: BookOpen },
] as const

const navigationAfterTutor = [
  { key: "analytics", href: "/analytics", icon: BarChart2 },
] as const

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
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
    setIsOpen(false)
    router.push("/login")
    router.refresh()
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t-4 border-border md:hidden z-50">
      <div className="flex items-end justify-around h-[4.25rem] px-1 pb-1">
        {navigationBeforeTutor.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full min-w-0 transition-all pb-1",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center px-3 py-1 rounded-full transition-all",
                  isActive
                    ? "bg-primary border-2 border-border shadow-brutal-sm"
                    : "border-2 border-transparent",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span
                className={cn(
                  "text-[10px] mt-1 truncate max-w-full",
                  isActive ? "font-bold" : "font-medium",
                )}
              >
                {t(`nav.${item.key}`)}
              </span>
            </Link>
          )
        })}

        <Link
          href="/tutor"
          className="flex flex-col items-center justify-center flex-1 min-w-0 -mt-3 text-foreground transition-all"
        >
          <div
            className={cn(
              "flex items-center justify-center rounded-full border-2 border-border shadow-brutal-sm transition-transform active:scale-95",
              pathname.startsWith("/tutor")
                ? "h-14 w-14 bg-amber-400 ring-2 ring-foreground/20"
                : "h-14 w-14 bg-amber-400 hover:brightness-105",
            )}
          >
            <Zap className="h-7 w-7 text-black" strokeWidth={2.75} />
          </div>
          <span className="text-[10px] mt-1 font-bold text-foreground truncate max-w-full">
            {t("nav.tutor")}
          </span>
        </Link>

        {navigationAfterTutor.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full min-w-0 transition-all pb-1",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center px-3 py-1 rounded-full transition-all",
                  isActive
                    ? "bg-primary border-2 border-border shadow-brutal-sm"
                    : "border-2 border-transparent",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span
                className={cn(
                  "text-[10px] mt-1 truncate max-w-full",
                  isActive ? "font-bold" : "font-medium",
                )}
              >
                {t(`nav.${item.key}`)}
              </span>
            </Link>
          )
        })}

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground hover:text-foreground transition-all">
              <div className="flex items-center justify-center px-4 py-1 rounded-full border-2 border-transparent">
                <Menu className="h-5 w-5" strokeWidth={2} />
              </div>
              <span className="text-[10px] font-medium mt-1">
                {t("nav.menu")}
              </span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[400px]">
            <SheetHeader>
              <SheetTitle>{t("nav.profileSettings")}</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-construct-speed rounded-lg border-2 border-border shadow-brutal-sm">
                <p className="font-bold text-lg">
                  {profile?.full_name || t("nav.user")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {profile?.email}
                </p>
              </div>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setIsOpen(false)
                  router.push("/settings")
                }}
              >
                {t("nav.profileSettings")}
              </Button>

              <Button
                variant="destructive"
                className="w-full"
                onClick={handleLogout}
              >
                {t("nav.logout")}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}

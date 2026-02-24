"use client"

/**
 * Top Navigation Bar (Desktop)
 * Shows logo, navigation links, and user menu
 */

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, User, Rocket } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/lib/i18n"

interface TopNavProps {
  userRole?: "student" | "admin"
}

export function TopNav({ userRole = "student" }: TopNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const { t } = useTranslation('common')

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

  // Student navigation links (translated)
  const studentLinks = [
    { href: "/plan", labelKey: "nav.plan" },
    { href: "/locked-in", labelKey: "nav.lockedIn" },
    { href: "/taktis", labelKey: "nav.taktis" },
    { href: "/analytics", labelKey: "nav.analytics" },
  ]

  // Admin navigation links (kept as-is, English only)
  const adminLinks = [
    { href: "/admin/taxonomy", label: "Taxonomy" },
    { href: "/admin/questions", label: "Questions" },
    { href: "/admin/modules", label: "Modules" },
    { href: "/admin/baseline", label: "Baseline" },
  ]

  return (
    <nav className="hidden md:flex items-center justify-between px-6 py-4 bg-background border-b-4 border-border">
      {/* Logo */}
      <Link
        href={userRole === "admin" ? "/admin" : "/plan"}
        className="flex items-center gap-2"
      >
        <Rocket className="h-6 w-6" />
        <div className="text-2xl font-bold text-foreground">{t('nav.gaspol')}</div>
      </Link>

      {/* Navigation Links */}
      <div className="flex items-center gap-2">
        {userRole === "admin"
          ? adminLinks.map((link) => {
              const isActive = pathname.startsWith(link.href)
              return (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={
                      isActive
                        ? "bg-construct-speed text-foreground border-2 border-border shadow-brutal-sm hover:bg-construct-speed/90"
                        : "hover:bg-muted"
                    }
                  >
                    {link.label}
                  </Button>
                </Link>
              )
            })
          : studentLinks.map((link) => {
              const isActive = pathname.startsWith(link.href)
              return (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={
                      isActive
                        ? "bg-construct-speed text-foreground border-2 border-border shadow-brutal-sm hover:bg-construct-speed/90"
                        : "hover:bg-muted"
                    }
                  >
                    {t(link.labelKey)}
                  </Button>
                </Link>
              )
            })}
      </div>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="rounded-full">
            <User className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-2">
            <p className="text-sm font-semibold">
              {profile?.full_name || t('nav.user')}
            </p>
            <p className="text-xs text-muted-foreground">{profile?.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            {t('nav.profileSettings')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600">
            {t('nav.logout')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  )
}

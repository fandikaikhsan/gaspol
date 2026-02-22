/**
 * BottomNav Component
 * Phase 9: Mobile Optimization
 */

"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Menu } from "lucide-react"
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

const navigation = [
  { name: 'Plan', href: '/plan', icon: '🎯' },
  { name: 'Locked-In', href: '/locked-in', icon: '🔒' },
  { name: 'Taktis', href: '/taktis/flashcards', icon: '⚡' },
  { name: 'Analytics', href: '/analytics', icon: '📊' },
]

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [profile, setProfile] = useState<any>(null)

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
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t-2 border-border md:hidden">
      <div className="flex items-center justify-around h-16">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="text-2xl mb-1">{item.icon}</span>
              <span className="text-xs font-semibold">{item.name}</span>
            </Link>
          )
        })}

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground hover:text-foreground transition-colors">
              <Menu className="h-6 w-6 mb-1" />
              <span className="text-xs font-semibold">Menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[400px]">
            <SheetHeader>
              <SheetTitle>Profile & Settings</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-pastel-sky rounded-lg border-2 border-charcoal">
                <p className="font-bold text-lg">{profile?.full_name || "User"}</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
              </div>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setIsOpen(false)
                  router.push("/settings")
                }}
              >
                Profile Settings
              </Button>

              <Button
                variant="destructive"
                className="w-full"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}

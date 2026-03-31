"use client"

/**
 * Student Layout
 * Desktop: left sidebar (full or icon-only rail on md+)
 * Mobile: bottom nav
 * Onboarding: content-only (no nav)
 */

import { usePathname } from "next/navigation"
import { useState } from "react"
import { BottomNav } from "@/components/navigation/BottomNav"
import { SideNav } from "@/components/navigation/SideNav"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { StudentLayoutClient } from "./layout-client"

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isContentOnly = pathname?.startsWith("/onboarding")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <StudentLayoutClient>
      {isContentOnly ? (
        <div className="min-h-screen">
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>
      ) : (
        <>
          <div className="min-h-screen md:flex">
            <SideNav
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
            />

            <main className="min-w-0 flex-1 pb-16 md:pb-0">
              <div className="pt-6 md:pt-8">
                <ErrorBoundary>{children}</ErrorBoundary>
              </div>
            </main>
          </div>

          <BottomNav />
        </>
      )}
    </StudentLayoutClient>
  )
}

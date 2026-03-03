/**
 * Student Layout
 * Desktop: left sidebar nav
 * Mobile: bottom nav
 */

import { BottomNav } from "@/components/navigation/BottomNav"
import { SideNav } from "@/components/navigation/SideNav"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { StudentLayoutClient } from "./layout-client"

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <StudentLayoutClient>
      <div className="min-h-screen md:flex">
        <SideNav />

        <main className="flex-1 pb-16 md:pb-0">
          <div className="pt-6 md:pt-8">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
        </main>
      </div>

      <BottomNav />
    </StudentLayoutClient>
  )
}

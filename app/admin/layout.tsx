/**
 * Admin Layout
 * Phase 8: Admin Console
 * Updated with TopNav
 */

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TopNav } from "@/components/navigation/TopNav"

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: '📊' },
  { name: 'Debug', href: '/admin/debug', icon: '🔍' },
  { name: 'Exams', href: '/admin/exams', icon: '📝' },
  { name: 'Taxonomy', href: '/admin/taxonomy', icon: '🌳' },
  { name: 'Questions', href: '/admin/questions', icon: '❓' },
  { name: 'Modules', href: '/admin/modules', icon: '📦' },
  { name: 'Baseline', href: '/admin/baseline', icon: '🎯' },
  { name: 'AI Runs', href: '/admin/ai-runs', icon: '🤖' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <TopNav userRole="admin" />
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r-2 border-border min-h-screen p-6 hidden md:block">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Admin Console</h1>
            <p className="text-sm text-muted-foreground">Content Management</p>
          </div>

          <nav className="space-y-2">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button variant="ghost" className="w-full justify-start">
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Button>
              </Link>
            ))}
          </nav>

          <div className="mt-8 pt-8 border-t-2 border-border">
            <Link href="/plan">
              <Button variant="brutal-outline" className="w-full">
                ← Student View
              </Button>
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

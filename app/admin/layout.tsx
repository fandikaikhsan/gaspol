/**
 * Admin Layout
 * Phase 8: Admin Console
 * Updated with TopNav and lucide-react icons
 */

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TopNav } from "@/components/navigation/TopNav"
import {
  LayoutDashboard,
  Bug,
  FileText,
  Network,
  HelpCircle,
  Layers,
  Package,
  Target,
  Bot,
  Sliders,
  Activity
} from "lucide-react"

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Debug', href: '/admin/debug', icon: Bug },
  { name: 'Diagnostics', href: '/admin/diagnostics', icon: Activity },
  { name: 'Exams', href: '/admin/exams', icon: FileText },
  { name: 'Taxonomy', href: '/admin/taxonomy', icon: Network },
  { name: 'Questions', href: '/admin/questions', icon: HelpCircle },
  { name: 'Flashcards', href: '/admin/flashcards', icon: Layers },
  { name: 'Metadata', href: '/admin/metadata', icon: Sliders },
  { name: 'Modules', href: '/admin/modules', icon: Package },
  { name: 'Baseline', href: '/admin/baseline', icon: Target },
  { name: 'AI Runs', href: '/admin/ai-runs', icon: Bot },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <TopNav userRole="admin" />
      <div className="flex pt-6">
        {/* Sidebar */}
        <aside className="w-64 border-r-2 border-border min-h-screen p-6 hidden md:block">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Admin Console</h1>
            <p className="text-sm text-muted-foreground">Content Management</p>
          </div>

          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href}>
                  <Button variant="ghost" className="w-full justify-start">
                    <Icon className="mr-2 h-5 w-5" />
                    {item.name}
                  </Button>
                </Link>
              )
            })}
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

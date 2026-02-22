/**
 * Admin Dashboard
 * Phase 8: Admin Console
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage content, view analytics, and configure the platform
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>🌳 Taxonomy</CardTitle>
            <CardDescription>Manage subject hierarchy</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/taxonomy">
              <Button variant="brutal" className="w-full">Manage Taxonomy</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>❓ Questions</CardTitle>
            <CardDescription>Create and edit questions</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/questions">
              <Button variant="brutal" className="w-full">Manage Questions</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📦 Modules</CardTitle>
            <CardDescription>Compose question modules</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/modules">
              <Button variant="brutal" className="w-full">Manage Modules</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🎯 Baseline</CardTitle>
            <CardDescription>Configure baseline assessment</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/baseline">
              <Button variant="brutal" className="w-full">Manage Baseline</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🤖 AI Operations</CardTitle>
            <CardDescription>View AI run logs</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/ai-runs">
              <Button variant="brutal" className="w-full">View AI Runs</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
          <CardHeader>
            <CardTitle>📊 Quick Stats</CardTitle>
            <CardDescription>Platform overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Questions:</span>
              <span className="font-bold">TBD</span>
            </div>
            <div className="flex justify-between">
              <span>Students:</span>
              <span className="font-bold">TBD</span>
            </div>
            <div className="flex justify-between">
              <span>Modules:</span>
              <span className="font-bold">TBD</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

/**
 * Admin Debug Page
 * Quick check for admin functionality
 */

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle } from "lucide-react"

export default function AdminDebugPage() {
  const [status, setStatus] = useState<any>({
    user: null,
    profile: null,
    counts: {},
    isLoading: true,
  })

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    const supabase = createClient()
    const results: any = {
      user: null,
      profile: null,
      counts: {},
      isLoading: false,
    }

    // Check auth user
    const { data: { user } } = await supabase.auth.getUser()
    results.user = user

    // Check profile
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
      results.profile = profile
    }

    // Check data counts
    const tables = [
      "taxonomy_nodes",
      "questions",
      "modules",
      "baseline_modules",
      "flashcards",
      "ai_runs",
    ]

    for (const table of tables) {
      const { count } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true })
      results.counts[table] = count || 0
    }

    setStatus(results)
  }

  const { user, profile, counts, isLoading } = status

  if (isLoading) {
    return <div className="p-6">Loading debug info...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Debug Info</h1>
        <p className="text-muted-foreground">Verify admin setup and data</p>
      </div>

      {/* Auth Status */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Logged In:</span>
            {user ? (
              <Badge className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Yes
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                No
              </Badge>
            )}
          </div>
          {user && (
            <>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Email:</span>
                <span>{user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">User ID:</span>
                <span className="text-xs font-mono">{user.id}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Profile Status */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Profile Exists:</span>
            {profile ? (
              <Badge className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Yes
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                No
              </Badge>
            )}
          </div>
          {profile && (
            <>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Role:</span>
                <Badge
                  variant={profile.role === "admin" ? "default" : "secondary"}
                  className={profile.role === "admin" ? "bg-blue-500" : ""}
                >
                  {profile.role}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Full Name:</span>
                <span>{profile.full_name || "(not set)"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Is Admin:</span>
                {profile.role === "admin" ? (
                  <Badge className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Yes ✅
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    No - Run: UPDATE profiles SET role = 'admin' WHERE email = '{user?.email}'
                  </Badge>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Data Counts */}
      <Card>
        <CardHeader>
          <CardTitle>Database Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(counts).map(([table, count]: [string, any]) => (
            <div key={table} className="flex items-center justify-between">
              <span className="font-semibold capitalize">{table.replace(/_/g, " ")}:</span>
              <div className="flex items-center gap-2">
                <Badge variant={count > 0 ? "default" : "secondary"}>
                  {count}
                </Badge>
                {count > 0 ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      {profile?.role !== "admin" && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-900">⚠️ Setup Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold mb-2">1. Make yourself admin:</p>
              <pre className="bg-white p-3 rounded border text-xs overflow-x-auto">
                UPDATE profiles SET role = 'admin' WHERE email = '{user?.email}';
              </pre>
            </div>
            {Object.values(counts).every((c) => c === 0) && (
              <div>
                <p className="font-semibold mb-2">2. Load seed data:</p>
                <p className="text-sm">
                  Go to Supabase SQL Editor and run the contents of{" "}
                  <code className="bg-white px-2 py-1 rounded">supabase/seed.sql</code>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {profile?.role === "admin" && Object.values(counts).some((c: any) => c > 0) && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900">✅ All Set!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Your admin account is configured and data is loaded. You can now use all admin pages.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

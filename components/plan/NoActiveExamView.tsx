"use client"

/**
 * NoActiveExamView
 * Shown when no exam is currently active. Students only see plan, analytics,
 * time left, etc. when there is an active exam.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export function NoActiveExamView() {
  return (
    <div className="min-h-screen p-4 flex items-center justify-center">
      <Card className="max-w-md w-full border-2 border-amber-200 bg-amber-50/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-amber-600" />
            <CardTitle className="text-xl">
              No Active Exam
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-muted-foreground">
          <p>
            There is no exam currently active. Plan, countdown, and analytics are only shown when an exam is active.
          </p>
          <p className="text-sm">
            Please check back later or contact your administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

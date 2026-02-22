/**
 * Questions Management
 * Phase 8: Admin Console
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function QuestionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Questions</h1>
          <p className="text-muted-foreground">Manage question bank</p>
        </div>
        <Button variant="brutal">+ New Question</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Question Library</CardTitle>
          <CardDescription>Browse and edit questions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-12">
            Question management interface coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

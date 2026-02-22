"use client"

/**
 * Locked-In Mode Hub
 * Phase 5: Locked-In Learning Mode
 */

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const modes = [
  {
    id: 'drill',
    title: 'Practice Drills',
    icon: '🎯',
    description: 'Focused practice on specific topics or mixed questions',
    color: 'bg-construct-teliti',
    href: '/plan',
  },
  {
    id: 'mock',
    title: 'Mock Tests',
    icon: '📝',
    description: 'Full exam simulations with time pressure',
    color: 'bg-construct-speed',
    href: '/plan',
  },
  {
    id: 'review',
    title: 'Review Mistakes',
    icon: '👁️',
    description: 'Learn from past attempts with detailed explanations',
    color: 'bg-construct-reading',
    href: '/locked-in/review',
  },
]

export default function LockedInHubPage() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Locked-In Mode 🔒</h1>
          <p className="text-muted-foreground">
            Structured learning with drills, mocks, and review
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {modes.map((mode) => (
            <Link key={mode.id} href={mode.href}>
              <Card className="hover:shadow-brutal-lg transition-all cursor-pointer h-full">
                <CardHeader>
                  <div className={`w-16 h-16 ${mode.color} rounded-lg border-2 border-border flex items-center justify-center text-4xl mb-4`}>
                    {mode.icon}
                  </div>
                  <CardTitle>{mode.title}</CardTitle>
                  <CardDescription>{mode.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="brutal" className="w-full">
                    Start {mode.title}
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card className="bg-muted/50">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">
              Drills and mocks are accessed through your study plan tasks
            </p>
            <Link href="/plan">
              <Button variant="brutal-outline">
                Go to Study Plan
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

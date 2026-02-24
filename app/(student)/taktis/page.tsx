"use client"

/**
 * Taktis Landing Page
 * Phase 6: Taktis Learning Mode
 * Quick study modes for rapid skill reinforcement
 */

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Layers, Zap } from "lucide-react"

const studyModes = [
  {
    id: "flashcards",
    name: "Flashcards",
    description: "Flip cards to test your memory and reinforce key concepts",
    icon: Layers,
    href: "/taktis/flashcards",
    color: "bg-pastel-lavender",
    available: true,
  },
  {
    id: "swipe",
    name: "Quick Swipe",
    description: "Tinder-style rapid answers for speed training",
    icon: Zap,
    href: "/taktis/swipe",
    color: "bg-pastel-peach",
    available: false,
  },
]

export default function TaktisPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Taktis</h1>
          <p className="text-muted-foreground">
            Quick study modes for rapid skill reinforcement
          </p>
        </div>

        {/* Study Mode Cards */}
        <div className="space-y-4">
          {studyModes.map((mode) => {
            const Icon = mode.icon
            return (
              <Card
                key={mode.id}
                className={`border-2 border-border shadow-brutal cursor-pointer transition-all hover:-translate-y-1 hover:shadow-brutal-lg ${
                  !mode.available ? "opacity-60" : ""
                }`}
                onClick={() => mode.available && router.push(mode.href)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div
                      className={`${mode.color} p-4 rounded-xl border-2 border-border`}
                    >
                      <Icon className="h-8 w-8" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold">{mode.name}</h2>
                        {!mode.available && (
                          <span className="text-xs bg-muted px-2 py-1 rounded-full border border-border">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground mt-1">
                        {mode.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

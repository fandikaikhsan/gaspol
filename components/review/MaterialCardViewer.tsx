"use client"

/**
 * Shared Material Card content viewer.
 * Used by both student view and admin preview to keep rendering identical.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Lightbulb, AlertTriangle, FileText } from "lucide-react"

export type ExampleItem =
  | string
  | { contoh?: string; penjelasan?: string }

export interface MaterialCardViewerData {
  title: string
  core_idea: string
  key_facts: string[]
  common_mistakes: string[]
  examples: ExampleItem[]
}

/** Normalize value to string (handles [object Object] from malformed data) */
function asString(v: unknown): string {
  if (typeof v === "string") return v
  if (v != null && typeof v === "object") {
    const obj = v as Record<string, unknown>
    if (typeof obj.contoh === "string" && obj.contoh) return obj.contoh
    if (typeof obj.solution === "string") return obj.solution
    if (typeof obj.example === "string") return obj.example
    if (typeof obj.text === "string") return obj.text
    return JSON.stringify(obj)
  }
  return String(v ?? "")
}

/** Check if example has contoh/penjelasan structure */
function isStructuredExample(
  ex: ExampleItem,
): ex is { contoh?: string; penjelasan?: string } {
  return ex != null && typeof ex === "object" && ("contoh" in ex || "penjelasan" in ex)
}

interface MaterialCardViewerProps {
  card: MaterialCardViewerData
  /** Optional skill info to display */
  skillName?: string
  skillCode?: string
  /** Show header with title and skill */
  showHeader?: boolean
}

export function MaterialCardViewer({
  card,
  skillName,
  skillCode,
  showHeader = true,
}: MaterialCardViewerProps) {
  const keyFacts = Array.isArray(card.key_facts)
    ? card.key_facts.map(asString).filter(Boolean)
    : []
  const commonMistakes = Array.isArray(card.common_mistakes)
    ? card.common_mistakes.map(asString).filter(Boolean)
    : []
  const examples = Array.isArray(card.examples)
    ? card.examples.filter(
        (ex) =>
          (typeof ex === "string" && ex.trim()) ||
          (isStructuredExample(ex) && ((ex.contoh && ex.contoh.trim()) || (ex.penjelasan && ex.penjelasan.trim()))),
      )
    : []

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="mb-4">
          <h1 className="text-2xl font-bold">{card.title}</h1>
          {(skillName || skillCode) && (
            <p className="text-sm text-muted-foreground mt-1">
              {skillName}
              {skillCode ? ` (${skillCode})` : ""}
            </p>
          )}
        </div>
      )}

      {/* Core Idea */}
      <Card className="border-2 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Core Idea
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base leading-relaxed">{card.core_idea}</p>
        </CardContent>
      </Card>

      {/* Key Facts */}
      {keyFacts.length > 0 && (
        <Card className="border-2 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Key Facts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {keyFacts.map((fact, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-800 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed">{fact}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Common Mistakes */}
      {commonMistakes.length > 0 && (
        <Card className="border-2 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Common Mistakes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {commonMistakes.map((mistake, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-400 flex-shrink-0 mt-2" />
                  <span className="text-sm leading-relaxed">{mistake}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Examples */}
      {examples.length > 0 && (
        <Card className="border-2 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-500" />
              Examples
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {examples.map((example, i) => (
                <div
                  key={i}
                  className="bg-muted/50 rounded-lg p-3 border border-border space-y-2"
                >
                  {isStructuredExample(example) ? (
                    <>
                      {example.contoh && example.contoh.trim() && (
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Contoh
                          </span>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap mt-0.5">
                            {example.contoh}
                          </p>
                        </div>
                      )}
                      {example.penjelasan && example.penjelasan.trim() && (
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Penjelasan
                          </span>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap mt-0.5">
                            {example.penjelasan}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {typeof example === "string" ? example : asString(example)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

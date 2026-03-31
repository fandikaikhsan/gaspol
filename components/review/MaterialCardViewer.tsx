"use client"

/**
 * Shared Material Card content viewer.
 * Used by both student view and admin preview to keep rendering identical.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Lightbulb, AlertTriangle, FileText } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { cn } from "@/lib/utils"

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
  /**
   * `cards` — bordered cards (admin preview).
   * `editorial` — flat reading column + example cards only (student materi detail).
   */
  variant?: "cards" | "editorial"
}

export function MaterialCardViewer({
  card,
  skillName,
  skillCode,
  showHeader = true,
  variant = "cards",
}: MaterialCardViewerProps) {
  const { t } = useTranslation("review")
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
          (isStructuredExample(ex) &&
            ((ex.contoh && ex.contoh.trim()) ||
              (ex.penjelasan && ex.penjelasan.trim()))),
      )
    : []

  if (variant === "editorial") {
    return (
      <div className="space-y-8">
        {card.core_idea?.trim() && (
          <p className="font-serif text-lg leading-relaxed text-foreground md:text-xl">
            {card.core_idea}
          </p>
        )}

        {keyFacts.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
              {t("material.facts")}
            </h2>
            <ol className="list-none space-y-3">
              {keyFacts.map((fact, i) => (
                <li key={i} className="flex gap-3 text-base leading-relaxed">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/80 text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <span className="min-w-0 pt-0.5">{fact}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {commonMistakes.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
              {t("material.commonMistakes")}
            </h2>
            <ul className="list-none space-y-2.5">
              {commonMistakes.map((mistake, i) => (
                <li key={i} className="flex gap-2.5 text-base leading-relaxed">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/70" />
                  <span className="min-w-0">{mistake}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {examples.length > 0 && (
          <section
            className={cn(
              "space-y-4",
              Boolean(
                card.core_idea?.trim() ||
                  keyFacts.length ||
                  commonMistakes.length,
              ) && "mt-10 border-t border-border/60 pt-10",
            )}
          >
              <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
                {t("material.examplesHeading")}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {examples.map((example, i) => (
                  <div
                    key={i}
                    className="space-y-2 rounded-lg border-2 border-border bg-muted/40 p-4 shadow-soft"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("material.exampleN", { n: i + 1 })}
                    </p>
                    {isStructuredExample(example) ? (
                      <>
                        {example.contoh && example.contoh.trim() && (
                          <p className="whitespace-pre-wrap font-serif text-base leading-relaxed">
                            {example.contoh}
                          </p>
                        )}
                        {example.penjelasan && example.penjelasan.trim() && (
                          <div className="border-t border-border/50 pt-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {t("material.explanation")}
                            </span>
                            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                              {example.penjelasan}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="whitespace-pre-wrap font-serif text-base leading-relaxed">
                        {typeof example === "string" ? example : asString(example)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
          </section>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="mb-4">
          <h1 className="text-2xl font-bold">{card.title}</h1>
          {(skillName || skillCode) && (
            <p className="mt-1 text-sm text-muted-foreground">
              {skillName}
              {skillCode ? ` (${skillCode})` : ""}
            </p>
          )}
        </div>
      )}

      {/* Core Idea */}
      <Card className="border-2 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
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
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-blue-500" />
              Key Facts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {keyFacts.map((fact, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-800">
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
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Common Mistakes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {commonMistakes.map((mistake, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-orange-400" />
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
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-green-500" />
              Examples
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {examples.map((example, i) => (
                <div
                  key={i}
                  className="space-y-2 rounded-lg border border-border bg-muted/50 p-3"
                >
                  {isStructuredExample(example) ? (
                    <>
                      {example.contoh && example.contoh.trim() && (
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Contoh
                          </span>
                          <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed">
                            {example.contoh}
                          </p>
                        </div>
                      )}
                      {example.penjelasan && example.penjelasan.trim() && (
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Penjelasan
                          </span>
                          <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed">
                            {example.penjelasan}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
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

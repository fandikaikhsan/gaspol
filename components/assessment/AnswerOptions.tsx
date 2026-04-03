/**
 * AnswerOptions Component
 * Phase 2: Question Runner & Assessment Engine
 * Supports MCQ5 (A–E), MCQ4 (A–D), TF. Phase 2: option content blocks for rich display.
 */

import { MCQ5Options, MCQ4Options } from "@/lib/assessment/types"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DocumentRenderer } from "@/lib/content-renderer/DocumentRenderer"
import type { ContentBlock } from "@/lib/content-renderer/types"

interface AnswerOptionsProps {
  options: MCQ5Options | MCQ4Options | Record<string, string>
  selectedAnswer: string
  onAnswerChange: (answer: string) => void
  disabled?: boolean
  showCorrectAnswer?: string // For review mode
  optionKeys?: readonly string[] // Override option keys (default: auto-detect from options)
  /** Structured content blocks per option key; when present, used instead of options[key] */
  optionContentBlocks?: Record<string, { blocks: ContentBlock[] }>
  /** Drill runner neo-brutalist option rows */
  neoDrill?: boolean
}

export function AnswerOptions({
  options,
  selectedAnswer,
  onAnswerChange,
  disabled = false,
  showCorrectAnswer,
  optionKeys: overrideKeys,
  optionContentBlocks,
  neoDrill = false,
}: AnswerOptionsProps) {
  // Auto-detect keys: if E exists → MCQ5, else if True/False → TF, otherwise MCQ4
  const optionKeys =
    overrideKeys ??
    ("True" in options || "False" in options
      ? (["True", "False"] as const)
      : "E" in options
        ? (["A", "B", "C", "D", "E"] as const)
        : (["A", "B", "C", "D"] as const))

  const renderOptionContent = (key: string) => {
    const blocks = optionContentBlocks?.[key]?.blocks
    if (blocks && blocks.length > 0) {
      return (
        <div className="leading-relaxed">
          <DocumentRenderer blocks={blocks as ContentBlock[]} />
        </div>
      )
    }
    return (
      <span className="leading-relaxed">
        {(options as Record<string, string>)[key] ?? ""}
      </span>
    )
  }

  return (
    <RadioGroup
      value={selectedAnswer}
      onValueChange={onAnswerChange}
      disabled={disabled}
      className="space-y-2 md:space-y-3"
    >
      {optionKeys.map((key) => {
        const isSelected = selectedAnswer === key
        const isCorrect = showCorrectAnswer === key
        const isWrong =
          showCorrectAnswer &&
          selectedAnswer === key &&
          selectedAnswer !== showCorrectAnswer

        return (
          <div
            key={key}
            className={`
              flex items-start gap-2 md:gap-4 rounded-xl border p-3 md:p-4 transition-all
              ${neoDrill && !showCorrectAnswer && !isSelected ? "border border-black bg-[#E8E8E4] hover:bg-[#E0E0DC]" : ""}
              ${neoDrill && !showCorrectAnswer && isSelected ? "border-2 border-black bg-white shadow-[0_4px_0_0_#000]" : ""}
              ${!neoDrill && !showCorrectAnswer && !isSelected ? "rounded-lg border-2 border-border bg-background hover:bg-muted" : ""}
              ${!neoDrill && !showCorrectAnswer && isSelected ? "rounded-lg border-2 border-primary bg-primary/10 shadow-brutal-sm" : ""}
              ${showCorrectAnswer && isCorrect ? "rounded-lg border-2 border-status-strong bg-status-strong/10" : ""}
              ${showCorrectAnswer && isWrong ? "rounded-lg border-2 border-destructive bg-destructive/10" : ""}
              ${showCorrectAnswer && !isCorrect && !isWrong ? "rounded-lg border-2 border-border bg-background opacity-60" : ""}
            `}
          >
            <RadioGroupItem
              value={key}
              id={`option-${key}`}
              disabled={disabled || !!showCorrectAnswer}
              className={neoDrill ? "mt-1 border-black text-black" : "mt-1"}
            />
            <Label
              htmlFor={`option-${key}`}
              className="flex min-w-0 flex-1 cursor-pointer items-start gap-2 md:gap-4"
            >
              {/* Option letter */}
              <div
                className={`
                  flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold md:h-8 md:w-8 md:text-base
                  ${neoDrill && !showCorrectAnswer && !isSelected ? "border-black bg-white text-black" : ""}
                  ${neoDrill && !showCorrectAnswer && isSelected ? "border-black bg-black text-white" : ""}
                  ${!neoDrill && !showCorrectAnswer && !isSelected ? "border-border bg-background" : ""}
                  ${!neoDrill && !showCorrectAnswer && isSelected ? "border-primary bg-primary text-primary-foreground" : ""}
                  ${showCorrectAnswer && isCorrect ? "border-status-strong bg-status-strong text-white" : ""}
                  ${showCorrectAnswer && isWrong ? "border-destructive bg-destructive text-white" : ""}
                `}
              >
                {key}
              </div>

              {/* Option text */}
              <div className="flex-1 pt-0.5">
                {renderOptionContent(key)}
              </div>

              {/* Correctness indicator (review mode) */}
              {showCorrectAnswer && isCorrect && (
                <div className="flex-shrink-0 text-status-strong font-semibold">
                  ✓ Correct
                </div>
              )}
              {showCorrectAnswer && isWrong && (
                <div className="flex-shrink-0 text-destructive font-semibold">
                  ✗ Wrong
                </div>
              )}
            </Label>
          </div>
        )
      })}
    </RadioGroup>
  )
}

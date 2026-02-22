/**
 * AnswerOptions Component
 * Phase 2: Question Runner & Assessment Engine
 *
 * MCQ5 format (A, B, C, D, E)
 */

import { MCQ5Options } from "@/lib/assessment/types"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface AnswerOptionsProps {
  options: MCQ5Options
  selectedAnswer: string
  onAnswerChange: (answer: string) => void
  disabled?: boolean
  showCorrectAnswer?: string // For review mode
}

export function AnswerOptions({
  options,
  selectedAnswer,
  onAnswerChange,
  disabled = false,
  showCorrectAnswer,
}: AnswerOptionsProps) {
  const optionKeys = ['A', 'B', 'C', 'D', 'E'] as const

  return (
    <RadioGroup
      value={selectedAnswer}
      onValueChange={onAnswerChange}
      disabled={disabled}
      className="space-y-3"
    >
      {optionKeys.map((key) => {
        const isSelected = selectedAnswer === key
        const isCorrect = showCorrectAnswer === key
        const isWrong = showCorrectAnswer && selectedAnswer === key && selectedAnswer !== showCorrectAnswer

        return (
          <div key={key} className="relative">
            <RadioGroupItem
              value={key}
              id={`option-${key}`}
              className="peer sr-only"
            />
            <Label
              htmlFor={`option-${key}`}
              className={`
                flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all
                ${!showCorrectAnswer && !isSelected ? 'border-border bg-background hover:bg-muted' : ''}
                ${!showCorrectAnswer && isSelected ? 'border-primary bg-primary/10 shadow-brutal-sm' : ''}
                ${showCorrectAnswer && isCorrect ? 'border-status-strong bg-status-strong/10' : ''}
                ${showCorrectAnswer && isWrong ? 'border-destructive bg-destructive/10' : ''}
                ${showCorrectAnswer && !isCorrect && !isWrong ? 'border-border bg-background opacity-60' : ''}
              `}
            >
              {/* Option letter */}
              <div
                className={`
                  flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold
                  ${!showCorrectAnswer && !isSelected ? 'border-border bg-background' : ''}
                  ${!showCorrectAnswer && isSelected ? 'border-primary bg-primary text-primary-foreground' : ''}
                  ${showCorrectAnswer && isCorrect ? 'border-status-strong bg-status-strong text-white' : ''}
                  ${showCorrectAnswer && isWrong ? 'border-destructive bg-destructive text-white' : ''}
                `}
              >
                {key}
              </div>

              {/* Option text */}
              <div className="flex-1 pt-0.5">
                <p className="leading-relaxed">{options[key]}</p>
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

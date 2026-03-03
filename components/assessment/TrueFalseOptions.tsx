/**
 * TrueFalseOptions Component
 * T-031: True/False question format
 *
 * Binary True/False selector with clean card-style buttons
 */

import { TFOptions } from "@/lib/assessment/types"
import { Check, X } from "lucide-react"

interface TrueFalseOptionsProps {
  options: TFOptions
  selectedAnswer: string
  onAnswerChange: (answer: string) => void
  disabled?: boolean
  showCorrectAnswer?: string // For review mode
}

export function TrueFalseOptions({
  options,
  selectedAnswer,
  onAnswerChange,
  disabled = false,
  showCorrectAnswer,
}: TrueFalseOptionsProps) {
  const choices = [
    { key: 'True', label: options?.True || 'True', icon: Check },
    { key: 'False', label: options?.False || 'False', icon: X },
  ]

  return (
    <div className="grid grid-cols-2 gap-4">
      {choices.map(({ key, label, icon: Icon }) => {
        const isSelected = selectedAnswer === key
        const isCorrect = showCorrectAnswer === key
        const isWrong = showCorrectAnswer && selectedAnswer === key && selectedAnswer !== showCorrectAnswer

        return (
          <button
            key={key}
            type="button"
            disabled={disabled || !!showCorrectAnswer}
            onClick={() => onAnswerChange(key)}
            className={`
              relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 p-6 
              transition-all font-semibold text-lg
              ${!showCorrectAnswer && !isSelected ? 'border-border bg-background hover:bg-muted hover:border-muted-foreground cursor-pointer' : ''}
              ${!showCorrectAnswer && isSelected ? 'border-primary bg-primary/10 shadow-brutal-sm' : ''}
              ${showCorrectAnswer && isCorrect ? 'border-status-strong bg-status-strong/10' : ''}
              ${showCorrectAnswer && isWrong ? 'border-destructive bg-destructive/10' : ''}
              ${showCorrectAnswer && !isCorrect && !isWrong ? 'border-border bg-background opacity-50' : ''}
              ${disabled || showCorrectAnswer ? 'cursor-not-allowed' : ''}
            `}
          >
            <div
              className={`
                w-12 h-12 rounded-full border-2 flex items-center justify-center
                ${!showCorrectAnswer && !isSelected ? 'border-border bg-background' : ''}
                ${!showCorrectAnswer && isSelected ? 'border-primary bg-primary text-primary-foreground' : ''}
                ${showCorrectAnswer && isCorrect ? 'border-status-strong bg-status-strong text-white' : ''}
                ${showCorrectAnswer && isWrong ? 'border-destructive bg-destructive text-white' : ''}
              `}
            >
              <Icon className="w-6 h-6" />
            </div>
            <span>{label}</span>

            {/* Correctness indicator (review mode) */}
            {showCorrectAnswer && isCorrect && (
              <span className="text-sm text-status-strong font-semibold">✓ Correct</span>
            )}
            {showCorrectAnswer && isWrong && (
              <span className="text-sm text-destructive font-semibold">✗ Wrong</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

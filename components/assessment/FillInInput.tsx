/**
 * FillInInput Component
 * Phase 2: Question Runner & Assessment Engine
 *
 * Fill-in format (Numeric or Text input)
 */

import { FillInOptions } from "@/lib/assessment/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface FillInInputProps {
  options: FillInOptions
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  showCorrectAnswer?: string // For review mode
  isCorrect?: boolean // For review mode
}

export function FillInInput({
  options,
  value,
  onChange,
  disabled = false,
  showCorrectAnswer,
  isCorrect,
}: FillInInputProps) {
  const { type, unit, placeholder } = options

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value

    // Validate numeric input
    if (type === 'numeric') {
      // Allow numbers, decimal point, negative sign
      inputValue = inputValue.replace(/[^0-9.-]/g, '')

      // Ensure only one decimal point
      const parts = inputValue.split('.')
      if (parts.length > 2) {
        inputValue = parts[0] + '.' + parts.slice(1).join('')
      }

      // Ensure negative sign only at start
      if (inputValue.indexOf('-') > 0) {
        inputValue = inputValue.replace(/-/g, '')
        if (inputValue[0] !== '-') {
          inputValue = '-' + inputValue
        }
      }
    }

    onChange(inputValue)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fill-in-answer" className="text-base">
          Your Answer:
        </Label>

        <div className="flex gap-2 items-center max-w-md">
          <Input
            id="fill-in-answer"
            type={type === 'numeric' ? 'text' : 'text'}
            inputMode={type === 'numeric' ? 'decimal' : 'text'}
            value={value}
            onChange={handleChange}
            placeholder={placeholder || (type === 'numeric' ? 'Enter number...' : 'Enter answer...')}
            disabled={disabled}
            className={`
              text-lg
              ${showCorrectAnswer && isCorrect ? 'border-status-strong bg-status-strong/10' : ''}
              ${showCorrectAnswer && !isCorrect ? 'border-destructive bg-destructive/10' : ''}
            `}
          />

          {unit && (
            <span className="text-muted-foreground font-medium">
              {unit}
            </span>
          )}
        </div>

        {type === 'numeric' && !disabled && (
          <p className="text-sm text-muted-foreground">
            Enter a numeric value. Use decimal point if needed (e.g., 3.14).
          </p>
        )}
      </div>

      {/* Review mode feedback */}
      {showCorrectAnswer && (
        <div className="space-y-2 p-4 rounded-lg border-2 border-border bg-muted">
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <>
                <div className="w-6 h-6 rounded-full bg-status-strong text-white flex items-center justify-center font-bold">
                  ✓
                </div>
                <span className="font-semibold text-status-strong">Correct!</span>
              </>
            ) : (
              <>
                <div className="w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center font-bold">
                  ✗
                </div>
                <span className="font-semibold text-destructive">Incorrect</span>
              </>
            )}
          </div>

          {!isCorrect && (
            <div>
              <p className="text-sm font-medium">Correct answer:</p>
              <p className="text-lg font-bold">
                {showCorrectAnswer} {unit && <span className="text-muted-foreground">{unit}</span>}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

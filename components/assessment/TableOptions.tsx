/**
 * TableOptions Component
 * Phase 2: Question Runner & Assessment Engine
 *
 * MCK-Table format (Multiple Choice, Check Table)
 * Matrix of rows × columns where multiple cells can be selected
 */

import { MCKTableOptions } from "@/lib/assessment/types"
import { Label } from "@/components/ui/label"

interface TableOptionsProps {
  options: MCKTableOptions
  selectedAnswers: string[] // Array of selected cell IDs (e.g., ["1-A", "2-B"])
  onAnswerChange: (answers: string[]) => void
  disabled?: boolean
  showCorrectAnswers?: string[] // For review mode
}

export function TableOptions({
  options,
  selectedAnswers,
  onAnswerChange,
  disabled = false,
  showCorrectAnswers,
}: TableOptionsProps) {
  const { rows, columns } = options

  const toggleCell = (cellId: string) => {
    if (disabled) return

    if (selectedAnswers.includes(cellId)) {
      onAnswerChange(selectedAnswers.filter((id) => id !== cellId))
    } else {
      onAnswerChange([...selectedAnswers, cellId])
    }
  }

  const isCellSelected = (rowId: string, colId: string) => {
    const cellId = `${rowId}-${colId}`
    return selectedAnswers.includes(cellId)
  }

  const isCellCorrect = (rowId: string, colId: string) => {
    if (!showCorrectAnswers) return false
    const cellId = `${rowId}-${colId}`
    return showCorrectAnswers.includes(cellId)
  }

  const isCellWrong = (rowId: string, colId: string) => {
    if (!showCorrectAnswers) return false
    const cellId = `${rowId}-${colId}`
    return selectedAnswers.includes(cellId) && !showCorrectAnswers.includes(cellId)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Select all cells that apply. You can select multiple options.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-2 border-border rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-muted">
              <th className="border-2 border-border p-3 text-left font-semibold">
                {/* Empty corner cell */}
              </th>
              {columns.map((col) => (
                <th
                  key={col.id}
                  className="border-2 border-border p-3 text-center font-semibold"
                >
                  {col.text}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-muted/50 transition-colors">
                <td className="border-2 border-border p-3 font-medium bg-muted/30">
                  {row.text}
                </td>
                {columns.map((col) => {
                  const cellId = `${row.id}-${col.id}`
                  const isSelected = isCellSelected(row.id, col.id)
                  const isCorrect = isCellCorrect(row.id, col.id)
                  const isWrong = isCellWrong(row.id, col.id)

                  return (
                    <td
                      key={col.id}
                      className="border-2 border-border p-2 text-center"
                    >
                      <button
                        type="button"
                        onClick={() => toggleCell(cellId)}
                        disabled={disabled}
                        className={`
                          w-12 h-12 rounded-lg border-2 transition-all
                          ${!showCorrectAnswers && !isSelected ? 'border-border bg-background hover:bg-muted' : ''}
                          ${!showCorrectAnswers && isSelected ? 'border-primary bg-primary text-primary-foreground shadow-brutal-sm' : ''}
                          ${showCorrectAnswers && isCorrect ? 'border-status-strong bg-status-strong text-white' : ''}
                          ${showCorrectAnswers && isWrong ? 'border-destructive bg-destructive text-white' : ''}
                          ${showCorrectAnswers && !isCorrect && !isWrong ? 'border-border bg-background opacity-60' : ''}
                          ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                        `}
                      >
                        {isSelected && !showCorrectAnswers && '✓'}
                        {showCorrectAnswers && isCorrect && '✓'}
                        {showCorrectAnswers && isWrong && '✗'}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedAnswers.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Selected: {selectedAnswers.length} cell{selectedAnswers.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}

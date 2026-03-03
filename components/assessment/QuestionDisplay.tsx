/**
 * QuestionDisplay Component
 * Phase 2: Question Runner & Assessment Engine
 * T-036: KaTeX math rendering for inline + block math
 *
 * Displays question stem with optional images and math
 */

import Image from "next/image"
import { MathRenderer } from "./MathRenderer"

interface QuestionDisplayProps {
  stem: string
  stemImages: string[]
  questionNumber: number
}

export function QuestionDisplay({
  stem,
  stemImages,
  questionNumber,
}: QuestionDisplayProps) {
  return (
    <div className="space-y-4">
      <div className="prose prose-lg max-w-none">
        <div className="whitespace-pre-wrap leading-relaxed">
          <MathRenderer text={stem} />
        </div>
      </div>

      {stemImages && stemImages.length > 0 && (
        <div className="space-y-3">
          {stemImages.map((imageUrl, idx) => (
            <div
              key={idx}
              className="relative w-full rounded-lg border-2 border-border overflow-hidden bg-muted"
            >
              <Image
                src={imageUrl}
                alt={`Question ${questionNumber} image ${idx + 1}`}
                width={800}
                height={400}
                className="w-full h-auto"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

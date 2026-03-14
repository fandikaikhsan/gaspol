/**
 * QuestionDisplay Component
 * Phase 2: Question Runner & Assessment Engine
 * T-036: KaTeX math rendering for inline + block math
 * Phase 2: Structured content via DocumentRenderer when content.stimulus exists
 */

import Image from "next/image"
import { MathRenderer } from "./MathRenderer"
import { DocumentRenderer } from "@/lib/content-renderer/DocumentRenderer"
import type { BlocksContainer } from "@/lib/content-renderer/types"

interface QuestionDisplayProps {
  stem: string
  stemImages: string[]
  questionNumber: number
  /** Structured stimulus blocks; when present, used instead of stem for primary content */
  contentStimulus?: BlocksContainer | null
}

export function QuestionDisplay({
  stem,
  stemImages,
  questionNumber,
  contentStimulus,
}: QuestionDisplayProps) {
  const hasStructuredContent =
    contentStimulus?.blocks && contentStimulus.blocks.length > 0

  return (
    <div className="space-y-4">
      <div className="prose prose-lg max-w-none">
        {hasStructuredContent ? (
          <div className="leading-relaxed">
            <DocumentRenderer blocks={contentStimulus.blocks} />
          </div>
        ) : (
          <div className="whitespace-pre-wrap leading-relaxed">
            <MathRenderer text={stem} />
          </div>
        )}
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

/**
 * GatedCTAButton Component
 * Phase 4: Plan Generation & Task System
 */

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface GatedCTAButtonProps {
  isUnlocked: boolean
  unlockedText: string
  lockedReason: string
  onClick?: () => void
}

export function GatedCTAButton({
  isUnlocked,
  unlockedText,
  lockedReason,
  onClick,
}: GatedCTAButtonProps) {
  if (isUnlocked) {
    return (
      <Card className="border-primary border-4">
        <CardContent className="pt-6">
          <Button
            onClick={onClick}
            className="w-full"
            size="lg"
          >
            {unlockedText}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-muted">
      <CardContent className="pt-6">
        <Button
          disabled
          variant="brutal-outline"
          className="w-full opacity-50 cursor-not-allowed"
          size="lg"
        >
          🔒 {lockedReason}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-2">
          Complete required tasks to unlock
        </p>
      </CardContent>
    </Card>
  )
}

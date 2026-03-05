/**
 * EmptyState Component
 * T-067: Consistent empty states across app (illustration + title + CTA)
 */

import { Button } from "@/components/ui/button"
import { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  ctaLabel?: string
  ctaHref?: string
  onCtaClick?: () => void
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  ctaHref,
  onCtaClick,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          {description}
        </p>
      )}
      {ctaLabel &&
        (ctaHref || onCtaClick) &&
        (ctaHref ? (
          <a href={ctaHref}>
            <Button>{ctaLabel}</Button>
          </a>
        ) : (
          <Button onClick={onCtaClick}>{ctaLabel}</Button>
        ))}
    </div>
  )
}

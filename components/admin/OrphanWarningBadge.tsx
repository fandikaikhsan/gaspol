"use client"

import { AlertTriangle } from "lucide-react"

interface OrphanWarningBadgeProps {
  message: string
  className?: string
}

export function OrphanWarningBadge({ message, className = "" }: OrphanWarningBadgeProps) {
  return (
    <span
      title={message}
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 cursor-help ${className}`}
    >
      <AlertTriangle className="h-3.5 w-3.5" />
      Orphaned
    </span>
  )
}

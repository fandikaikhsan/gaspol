"use client"

import * as React from "react"

/**
 * Delete Confirmation Modal
 * - Simple: confirm/cancel
 * - Critical: must type "delete" to enable confirm (for taxonomy, etc.)
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle } from "lucide-react"

const CONFIRM_WORD = "delete"

interface DeleteConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  /** For critical deletes: user must type "delete" to confirm */
  requireTypeConfirm?: boolean
  /** Extra warning for critical deletes (e.g. cascading effects) */
  criticalWarning?: string
  onConfirm: () => void | Promise<void>
  isDeleting?: boolean
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  requireTypeConfirm = false,
  criticalWarning,
  onConfirm,
  isDeleting = false,
}: DeleteConfirmDialogProps) {
  const [typedConfirm, setTypedConfirm] = React.useState("")
  const canConfirm = requireTypeConfirm
    ? typedConfirm.toLowerCase() === CONFIRM_WORD
    : true

  React.useEffect(() => {
    if (!open) setTypedConfirm("")
  }, [open])

  const handleConfirm = async () => {
    if (!canConfirm) return
    await onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => isDeleting && e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {criticalWarning && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {criticalWarning}
          </div>
        )}

        {requireTypeConfirm && (
          <div className="space-y-2">
            <Label htmlFor="confirm-delete">
              Type <span className="font-mono font-bold">{CONFIRM_WORD}</span> to
              confirm
            </Label>
            <Input
              id="confirm-delete"
              value={typedConfirm}
              onChange={(e) => setTypedConfirm(e.target.value)}
              placeholder={CONFIRM_WORD}
              className="font-mono"
              autoComplete="off"
            />
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canConfirm || isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

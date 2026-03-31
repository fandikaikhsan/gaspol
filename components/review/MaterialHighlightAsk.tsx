"use client"

/**
 * Floating "Apa maksudnya?" action when the user selects text inside materi content.
 */

import { useCallback, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n"

const MIN_CHARS = 2
const MAX_CHARS = 2000

function getContainingElement(node: Node | null): Element | null {
  if (!node) return null
  return node.nodeType === Node.TEXT_NODE
    ? (node.parentElement as Element | null)
    : (node as Element)
}

function isNodeInsideRoot(root: HTMLElement, node: Node | null): boolean {
  const el = getContainingElement(node)
  if (!el) return false
  return root.contains(el)
}

export function MaterialHighlightAsk({
  rootRef,
  onAsk,
}: {
  rootRef: React.RefObject<HTMLElement | null>
  onAsk: (selectedText: string) => void
}) {
  const { t } = useTranslation("review")
  const [toolbar, setToolbar] = useState<{
    top: number
    left: number
    text: string
  } | null>(null)

  const updateFromSelection = useCallback(() => {
    const root = rootRef.current
    if (!root) {
      setToolbar(null)
      return
    }

    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      setToolbar(null)
      return
    }

    const range = sel.getRangeAt(0)
    if (!isNodeInsideRoot(root, range.commonAncestorContainer)) {
      setToolbar(null)
      return
    }

    const raw = sel.toString()
    const text = raw.replace(/\s+/g, " ").trim()
    if (text.length < MIN_CHARS || text.length > MAX_CHARS) {
      setToolbar(null)
      return
    }

    const rect = range.getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) {
      setToolbar(null)
      return
    }

    setToolbar({
      top: rect.bottom + 8,
      left: rect.left + rect.width / 2,
      text,
    })
  }, [rootRef])

  useEffect(() => {
    const onMouseUp = () => requestAnimationFrame(updateFromSelection)
    const onTouchEnd = () => requestAnimationFrame(updateFromSelection)
    const hide = () => setToolbar(null)
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.closest?.("[data-highlight-ask-toolbar]")) return
      hide()
    }

    document.addEventListener("mouseup", onMouseUp)
    document.addEventListener("touchend", onTouchEnd)
    window.addEventListener("scroll", hide, true)
    document.addEventListener("mousedown", onDocMouseDown)

    return () => {
      document.removeEventListener("mouseup", onMouseUp)
      document.removeEventListener("touchend", onTouchEnd)
      window.removeEventListener("scroll", hide, true)
      document.removeEventListener("mousedown", onDocMouseDown)
    }
  }, [updateFromSelection])

  const handleAsk = () => {
    if (!toolbar) return
    window.getSelection()?.removeAllRanges()
    onAsk(toolbar.text)
    setToolbar(null)
  }

  if (typeof document === "undefined" || !toolbar) return null

  return createPortal(
    <div
      data-highlight-ask-toolbar
      className="pointer-events-auto fixed z-[100] -translate-x-1/2"
      style={{ top: toolbar.top, left: toolbar.left }}
    >
      <Button
        type="button"
        size="sm"
        variant="brutal"
        className="touch-target shadow-brutal-sm"
        onMouseDown={(e) => e.preventDefault()}
        onClick={handleAsk}
      >
        {t("material.highlightAsk")}
      </Button>
    </div>,
    document.body,
  )
}

"use client"

import { useCallback, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import { ChevronDown } from "lucide-react"
import type { CatatanQuizItem } from "@/lib/gaspol-tutor/parseCatatanQuizCards"
import { cn } from "@/lib/utils"

function normalizeMathDelimiters(text: string): string {
  let out = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, m) => `$$${m}$$`)
  out = out.replace(/\\\(([\s\S]*?)\\\)/g, (_, m) => `$${m}$`)
  return out
}

function SmallMarkdown({ text, className }: { text: string; className?: string }) {
  return (
    <div
      className={cn(
        "chat-markdown text-sm leading-relaxed [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-4 [&_.katex]:text-inherit",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {normalizeMathDelimiters(text)}
      </ReactMarkdown>
    </div>
  )
}

export function CatatanQuizCards({
  messageId,
  preamble,
  postamble,
  items,
  accentColor,
  t,
}: {
  messageId: string
  preamble: string
  postamble: string
  items: CatatanQuizItem[]
  accentColor?: string
  t: (key: string) => string
}) {
  const [open, setOpen] = useState<Record<number, boolean>>({})

  const toggle = useCallback((i: number) => {
    setOpen((prev) => ({ ...prev, [i]: !prev[i] }))
  }, [])

  return (
    <div className="space-y-3">
      {preamble.trim() ? (
        <div className="chat-markdown text-sm leading-relaxed [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-4 [&_.katex]:text-inherit">
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {normalizeMathDelimiters(preamble)}
          </ReactMarkdown>
        </div>
      ) : null}

      <div className="space-y-2.5">
        {items.map((item, i) => {
          const isOpen = open[i] ?? false
          const cardId = `${messageId}-quiz-${i}`
          return (
            <div
              key={cardId}
              className="overflow-hidden rounded-2xl border-2 border-border bg-card shadow-brutal-sm"
            >
              <button
                type="button"
                id={`${cardId}-trigger`}
                aria-expanded={isOpen}
                aria-controls={`${cardId}-panel`}
                onClick={() => toggle(i)}
                className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/40"
              >
                <div
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-border text-xs font-bold text-foreground"
                  style={
                    accentColor
                      ? { backgroundColor: `${accentColor}28`, borderColor: accentColor }
                      : undefined
                  }
                >
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    {t("tutor.catatanQuizSoal")}
                  </p>
                  <SmallMarkdown text={item.question} className="mt-1.5" />
                  <p className="mt-2 text-[11px] font-semibold text-muted-foreground">
                    {t("tutor.catatanTapReveal")}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    "mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
                    isOpen && "rotate-180",
                  )}
                  aria-hidden
                />
              </button>

              {isOpen ? (
                <div
                  id={`${cardId}-panel`}
                  role="region"
                  aria-labelledby={`${cardId}-trigger`}
                  className="border-t-2 border-border bg-muted/25 px-4 pb-4 pt-3"
                >
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    {t("tutor.catatanAnswerLabel")}
                  </p>
                  <SmallMarkdown text={item.answer} className="mt-1.5" />
                  <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    {t("tutor.catatanExplanationLabel")}
                  </p>
                  <SmallMarkdown text={item.explanation} className="mt-1.5" />
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      {postamble.trim() ? (
        <div className="chat-markdown text-sm leading-relaxed [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-4 [&_.katex]:text-inherit">
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {normalizeMathDelimiters(postamble)}
          </ReactMarkdown>
        </div>
      ) : null}
    </div>
  )
}

"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"
import { Loader2, Send } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"

function normalizeMathDelimiters(text: string): string {
  let out = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, m) => `$$${m}$$`)
  out = out.replace(/\\\(([\s\S]*?)\\\)/g, (_, m) => `$${m}$`)
  return out
}

function ChatBubble({
  content,
  className = "",
}: {
  content: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "chat-markdown text-sm leading-relaxed [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-4 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_code]:rounded [&_code]:bg-black/10 [&_code]:px-1 [&_.katex]:text-inherit",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {normalizeMathDelimiters(content)}
      </ReactMarkdown>
    </div>
  )
}

interface ChatRow {
  id: string
  role: "user" | "assistant"
  message: string
  created_at: string
}

const TUTOR_TOPIC = "materi" as const

export interface DrillTutorSkillHubModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Display name of the L5 skill / materi */
  skillTitle: string
  /** Number of drill modules on this hub (shown in header + first-message context). */
  practiceModuleCount?: number
}

export function DrillTutorSkillHubModal({
  open,
  onOpenChange,
  skillTitle,
  practiceModuleCount,
}: DrillTutorSkillHubModalProps) {
  const { t: tCommon } = useTranslation("common")
  const { t: tDrill } = useTranslation("drill")

  const [messages, setMessages] = useState<ChatRow[]>([])
  const [mainInput, setMainInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingHistory, setIsFetchingHistory] = useState(false)
  const [isQuotaExhausted, setIsQuotaExhausted] = useState(false)
  const [remainingTokens, setRemainingTokens] = useState<number | null>(null)
  const [totalTokens, setTotalTokens] = useState(100)

  const mainRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const includeSkillContextRef = useRef(true)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    requestAnimationFrame(() =>
      messagesEndRef.current?.scrollIntoView({ behavior, block: "end" }),
    )
  }, [])

  function autoResize(el: HTMLTextAreaElement | null) {
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
  }

  const skill = skillTitle.trim()
  const hasNamedSkill = Boolean(skill && skill !== "Skill")

  const contextLine = hasNamedSkill
    ? tCommon("tutor.drillHubLineSkill", { skill })
    : tDrill("skillHub.tutorContextFallback")

  const headerExtra =
    typeof practiceModuleCount === "number" && practiceModuleCount > 0
      ? tDrill("skillHub.tutorModalModulesLine", { count: practiceModuleCount })
      : null

  const firstMessageContextLine = (() => {
    const parts = [contextLine]
    if (
      typeof practiceModuleCount === "number" &&
      practiceModuleCount > 0
    ) {
      parts.push(
        tDrill("skillHub.tutorModelPracticeModulesLine", {
          count: practiceModuleCount,
        }),
      )
    }
    return parts.join("\n")
  })()

  useEffect(() => {
    if (!open) return
    let cancelled = false

    async function boot() {
      setIsFetchingHistory(true)
      try {
        const supabase = createClient()
        const token = (await supabase.auth.getSession()).data.session
          ?.access_token

        await fetch("/api/gaspol-tutor/ensure-opening", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ topic_id: TUTOR_TOPIC }),
        })

        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user || cancelled) return

        const { data: chatData } = await supabase
          .from("gaspol_tutor_chats")
          .select("id, role, message, created_at")
          .eq("user_id", user.id)
          .eq("topic_id", TUTOR_TOPIC)
          .order("created_at", { ascending: true })
        if (!cancelled && chatData) setMessages(chatData as ChatRow[])

        const { data: quotaData } = await supabase
          .from("tanya_gaspol_quota")
          .select("total_tokens, remaining_tokens")
          .eq("user_id", user.id)
          .single()
        if (!cancelled && quotaData) {
          setRemainingTokens(quotaData.remaining_tokens)
          setTotalTokens(quotaData.total_tokens)
          setIsQuotaExhausted(quotaData.remaining_tokens < 5)
        } else if (!cancelled) {
          setRemainingTokens(100)
          setTotalTokens(100)
          setIsQuotaExhausted(false)
        }
      } catch {
        /* no-op */
      } finally {
        if (!cancelled) setIsFetchingHistory(false)
      }
    }

    void boot()
    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      setMainInput("")
      return
    }
    includeSkillContextRef.current = true
    setMainInput("")
    requestAnimationFrame(() => mainRef.current?.focus())
  }, [open, skillTitle, practiceModuleCount])

  useEffect(() => {
    if (!isFetchingHistory) scrollToBottom("auto")
  }, [isFetchingHistory, messages, isLoading, scrollToBottom])

  const sendMessage = useCallback(async () => {
    const trimmedMain = mainInput.trim()
    const composed = includeSkillContextRef.current
      ? [firstMessageContextLine, trimmedMain].filter(Boolean).join("\n\n")
      : trimmedMain

    if (!composed.trim() || isLoading || isQuotaExhausted) return

    const userMsg: ChatRow = {
      id: `temp-user-${Date.now()}`,
      role: "user",
      message: composed,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setMainInput("")
    setIsLoading(true)

    try {
      const supabase = createClient()
      const token = (await supabase.auth.getSession()).data.session
        ?.access_token
      const response = await fetch("/api/gaspol-tutor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ topic_id: TUTOR_TOPIC, message: composed }),
      })
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 403) {
          setIsQuotaExhausted(true)
          setRemainingTokens(data.remaining_tokens ?? 0)
          setMessages((prev) => prev.filter((m) => m.id !== userMsg.id))
          return
        }
        throw new Error(data.error || "send failed")
      }

      setRemainingTokens(data.remaining_tokens)
      if (data.remaining_tokens < 5) setIsQuotaExhausted(true)
      includeSkillContextRef.current = false

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: chatData } = await supabase
          .from("gaspol_tutor_chats")
          .select("id, role, message, created_at")
          .eq("user_id", user.id)
          .eq("topic_id", TUTOR_TOPIC)
          .order("created_at", { ascending: true })
        if (chatData) setMessages(chatData as ChatRow[])
      }
    } catch {
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== userMsg.id),
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          message: tCommon("question.tutorSendError"),
          created_at: new Date().toISOString(),
        },
      ])
    } finally {
      setIsLoading(false)
      setTimeout(() => mainRef.current?.focus(), 80)
    }
  }, [
    firstMessageContextLine,
    isLoading,
    isQuotaExhausted,
    mainInput,
    tCommon,
  ])

  const brutalInput =
    "rounded-xl border-2 border-black bg-white px-3 py-2 font-sans text-sm shadow-[3px_3px_0px_0px_#000] placeholder:text-black/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90dvh,720px)] w-[calc(100vw-1.25rem)] max-w-[520px] flex-col gap-0 overflow-hidden rounded-xl border-2 border-black bg-[#F5F5F0] p-0 shadow-[8px_8px_0px_0px_#000] sm:max-w-xl">
        <DialogHeader className="flex flex-row items-start justify-between gap-3 space-y-0 border-b-2 border-black px-4 py-3 text-left">
          <div className="min-w-0 flex-1 space-y-1 pr-2">
            <DialogTitle className="font-serif text-lg font-bold text-black md:text-xl">
              {tDrill("skillHub.tutorModalTitle")}
            </DialogTitle>
            <p className="font-sans text-xs leading-snug text-black/70 md:text-sm">
              {contextLine}
            </p>
            {headerExtra && (
              <p className="font-sans text-[11px] leading-snug text-black/60 md:text-xs">
                {headerExtra}
              </p>
            )}
          </div>
          {remainingTokens !== null && (
            <Badge className="shrink-0 border-2 border-border bg-[#2D7D6F] px-2.5 py-0.5 text-[11px] font-semibold text-white hover:bg-[#2D7D6F]">
              {remainingTokens}/{totalTokens}
            </Badge>
          )}
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto bg-white/90 px-3 py-2">
          {isFetchingHistory ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-black/40" />
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((row) => (
                <div
                  key={row.id}
                  className={cn(
                    "rounded-xl border-2 border-black px-3 py-2 shadow-[3px_3px_0px_0px_#000]",
                    row.role === "user"
                      ? "ml-4 bg-[#E3DFF2]"
                      : "mr-4 bg-[#F5F5F0]",
                  )}
                >
                  <ChatBubble content={row.message} />
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 rounded-xl border-2 border-dashed border-black/30 px-3 py-2 font-sans text-sm text-black/60">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {tCommon("status.loading")}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="space-y-2 border-t-2 border-black bg-[#F5F5F0] p-3">
          {isQuotaExhausted && (
            <p className="font-sans text-xs text-destructive">
              {tCommon("tutor.quotaExhaustedShort")}
            </p>
          )}
          <Textarea
            ref={mainRef}
            value={mainInput}
            onChange={(e) => {
              setMainInput(e.target.value)
              autoResize(e.target)
            }}
            placeholder={tDrill("skillHub.tutorModalPlaceholder")}
            disabled={isLoading || isQuotaExhausted}
            rows={2}
            className={cn(brutalInput, "min-h-[80px] resize-none")}
          />
          <div className="flex justify-end">
            <Button
              type="button"
              disabled={isLoading || isQuotaExhausted || !mainInput.trim()}
              onClick={() => void sendMessage()}
              className="h-11 w-full rounded-xl border-2 border-black bg-[#E8A246] font-sans text-sm font-semibold text-black shadow-[4px_4px_0px_0px_#000] hover:bg-[#e49a3d] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#000] sm:w-auto sm:min-w-[120px]"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {tCommon("button.submit")}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

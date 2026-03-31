"use client"

/**
 * Tanya Gaspol Chat Component (F-005c / V3-T-011)
 *
 * Modal chat interface for AI-assisted learning scoped to material cards.
 * Features: preset questions, free-form input, chat persistence,
 * token quota display, and quota exhaustion state.
 * Renders assistant messages with Markdown + LaTeX (KaTeX).
 */

import { useState, useEffect, useRef, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { Send, Loader2, Coins, MessageCircle, Frown } from "lucide-react"

/**
 * Normalize LaTeX delimiters so remark-math can parse them.
 * remark-math uses $ and $$; AI often returns \( \) and \[ \].
 */
function normalizeMathDelimiters(text: string): string {
  // Block: \[ ... \] -> $$ ... $$
  let out = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `$$${math}$$`)
  // Inline: \( ... \) -> $ ... $
  out = out.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math}$`)
  return out
}

/** Renders chat message with Markdown (bold, lists, etc.) and LaTeX math (\( \), \[ \], $, $$) */
function ChatMessageBody({ content, className = "" }: { content: string; className?: string }) {
  const normalized = normalizeMathDelimiters(content)
  return (
    <div
      className={`chat-markdown text-sm leading-relaxed [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-4 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_code]:rounded [&_code]:bg-black/10 [&_code]:px-1 [&_.katex]:text-inherit ${className}`}
    >
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {normalized}
      </ReactMarkdown>
    </div>
  )
}

// Preset questions per blueprint spec
const PRESET_QUESTIONS = [
  "Saya kurang paham dengan konsep ini, bisa jelaskan dengan bahasa yang lebih sederhana?",
  "Bisa jelaskan dengan contoh soal lain?",
  "Apa tips menghindari kesalahan umum di topik ini?",
]

// Random greeting templates
const GREETING_TEMPLATES = [
  (name: string) =>
    `Halo! Ada yang mau kamu tanyakan tentang ${name}? Aku siap bantu! 💪`,
  (name: string) =>
    `Yuk belajar ${name} bareng aku! Tanya apa aja yang kamu bingung 😊`,
  (name: string) =>
    `Hai! Aku Gaspol, teman belajar kamu untuk ${name}. Mau tanya apa? 🚀`,
]

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  message: string
  created_at: string
}

interface MaterialContext {
  core_idea: string
  key_facts: string[]
  common_mistakes: string[]
}

interface TanyaGaspolChatProps {
  /** Dialog = mobile / modal. Embedded = sticky sidebar panel (desktop). */
  layout?: "dialog" | "embedded"
  open?: boolean
  onOpenChange?: (open: boolean) => void
  skillId: string
  skillName: string
  materialContext: MaterialContext
  /** Increment to push text into the input (e.g. from highlight → "Apa maksud…"). */
  prefillKey?: number | null
  prefillText?: string
  onPrefillApplied?: () => void
}

export default function TanyaGaspolChat({
  layout = "dialog",
  open = false,
  onOpenChange,
  skillId,
  skillName,
  materialContext,
  prefillKey,
  prefillText = "",
  onPrefillApplied,
}: TanyaGaspolChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingHistory, setIsFetchingHistory] = useState(false)
  const [remainingTokens, setRemainingTokens] = useState<number | null>(null)
  const [totalTokens, setTotalTokens] = useState(100)
  const [isQuotaExhausted, setIsQuotaExhausted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastPrefillKeyRef = useRef<number | null>(null)

  useEffect(() => {
    lastPrefillKeyRef.current = null
  }, [skillId])

  const greeting = useRef(
    GREETING_TEMPLATES[Math.floor(Math.random() * GREETING_TEMPLATES.length)](
      skillName,
    ),
  )

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior, block: "end" })
    })
  }, [])

  const isActive = layout === "embedded" || open

  // After history finishes loading, snap scroll to the latest messages
  useEffect(() => {
    if (isFetchingHistory) return
    scrollToBottom("auto")
  }, [isFetchingHistory, scrollToBottom])

  // New messages / typing indicator: smooth scroll
  useEffect(() => {
    if (isFetchingHistory) return
    scrollToBottom("smooth")
  }, [messages, isLoading, isFetchingHistory, scrollToBottom])

  useEffect(() => {
    if (prefillKey == null) return
    if (lastPrefillKeyRef.current === prefillKey) return
    lastPrefillKeyRef.current = prefillKey
    setInputValue(prefillText)
    onPrefillApplied?.()
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [prefillKey, prefillText, onPrefillApplied])

  // Load chat history and quota when panel is active
  useEffect(() => {
    if (!isActive) return

    async function loadHistory() {
      setIsFetchingHistory(true)
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        // Load chat history
        const { data: chatData } = await supabase
          .from("tanya_gaspol_chats")
          .select("id, role, message, created_at")
          .eq("user_id", user.id)
          .eq("skill_id", skillId)
          .order("created_at", { ascending: true })

        if (chatData) {
          setMessages(chatData as ChatMessage[])
        }

        // Load quota
        const { data: quotaData } = await supabase
          .from("tanya_gaspol_quota")
          .select("total_tokens, used_tokens, remaining_tokens")
          .eq("user_id", user.id)
          .single()

        if (quotaData) {
          setRemainingTokens(quotaData.remaining_tokens)
          setTotalTokens(quotaData.total_tokens)
          setIsQuotaExhausted(quotaData.remaining_tokens < 5)
        } else {
          // No quota record yet — user has full quota
          setRemainingTokens(100)
          setTotalTokens(100)
          setIsQuotaExhausted(false)
        }
      } catch (err) {
        console.error("[TanyaGaspolChat] Failed to load history:", err)
      } finally {
        setIsFetchingHistory(false)
      }
    }

    loadHistory()
  }, [isActive, skillId])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading || isQuotaExhausted) return

      const userMsg: ChatMessage = {
        id: `temp-user-${Date.now()}`,
        role: "user",
        message: text.trim(),
        created_at: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, userMsg])
      setInputValue("")
      setIsLoading(true)

      try {
        const supabase = createClient()
        const token = (await supabase.auth.getSession()).data.session
          ?.access_token

        const response = await fetch("/api/tanya-gaspol", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            skill_id: skillId,
            message: text.trim(),
            skill_name: skillName,
            material_context: materialContext,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          if (response.status === 403) {
            setIsQuotaExhausted(true)
            setRemainingTokens(data.remaining_tokens ?? 0)
            // Remove the optimistic user message
            setMessages((prev) => prev.filter((m) => m.id !== userMsg.id))
            return
          }
          throw new Error(data.error || "Gagal mengirim pesan")
        }

        const assistantMsg: ChatMessage = {
          id: `temp-asst-${Date.now()}`,
          role: "assistant",
          message: data.reply,
          created_at: new Date().toISOString(),
        }

        setMessages((prev) => [...prev, assistantMsg])
        setRemainingTokens(data.remaining_tokens)
        if (data.remaining_tokens < 5) {
          setIsQuotaExhausted(true)
        }
      } catch (err) {
        console.error("[TanyaGaspolChat] Send error:", err)
        // Show error as assistant message
        setMessages((prev) => [
          ...prev,
          {
            id: `temp-err-${Date.now()}`,
            role: "assistant",
            message: "Maaf, terjadi kesalahan. Coba lagi nanti ya! 😅",
            created_at: new Date().toISOString(),
          },
        ])
      } finally {
        setIsLoading(false)
        // Focus input after sending
        setTimeout(() => inputRef.current?.focus(), 100)
      }
    },
    [isLoading, isQuotaExhausted, skillId, skillName, materialContext],
  )

  const handlePresetClick = (preset: string) => {
    sendMessage(preset)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputValue)
  }

  const tokenBadge =
    remainingTokens !== null ? (
      <Badge variant="outline" className="gap-1 text-xs flex-shrink-0">
        <Coins className="h-3 w-3" />
        {remainingTokens} / {totalTokens}
      </Badge>
    ) : null

  const headerEmbedded = (
    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 pb-3 pt-4">
      <h2 className="flex min-w-0 items-center gap-2 truncate text-lg font-semibold">
        <MessageCircle className="h-5 w-5 shrink-0 text-primary" />
        <span className="truncate">Tanya Gaspol</span>
      </h2>
      {tokenBadge}
    </div>
  )

  const headerDialog = (
    <DialogHeader className="flex shrink-0 flex-row items-center justify-between gap-2 space-y-0 border-b border-border px-4 pb-3 pr-12 pt-4">
      <DialogTitle className="flex min-w-0 items-center gap-2 truncate text-lg font-semibold">
        <MessageCircle className="h-5 w-5 shrink-0 text-primary" />
        <span className="truncate">Tanya Gaspol</span>
      </DialogTitle>
      {tokenBadge}
    </DialogHeader>
  )

  const chatScrollArea = (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
          {isFetchingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Greeting */}
              <div className="flex gap-2">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">
                  🤖
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2 max-w-[85%]">
                  <ChatMessageBody content={greeting.current} />
                </div>
              </div>

              {/* Preset questions (show only if no messages yet) */}
              {messages.length === 0 && !isQuotaExhausted && (
                <div className="space-y-2 pl-9">
                  <p className="text-xs text-muted-foreground font-medium">
                    Coba tanyakan:
                  </p>
                  {PRESET_QUESTIONS.map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => handlePresetClick(preset)}
                      disabled={isLoading}
                      className="w-full text-left text-sm px-3 py-2 rounded-xl border border-border bg-background hover:bg-accent/50 transition-colors disabled:opacity-50"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              )}

              {/* Chat messages */}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${
                    msg.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">
                      🤖
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted rounded-tl-sm"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <ChatMessageBody content={msg.message} />
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.message}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex gap-2">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">
                    🤖
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2">
                    <div className="flex gap-1 items-center">
                      <div className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0ms]" />
                      <div className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:150ms]" />
                      <div className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}

              {/* Quota exhaustion state */}
              {isQuotaExhausted && (
                <div className="text-center py-4 space-y-2">
                  <Frown className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Kuota Tanya Gaspol kamu sudah habis.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Selamat belajar ya! 💪
                  </p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
    </div>
  )

  const inputFooter = (
    <div className="px-4 pb-4 pt-2 border-t border-border flex-shrink-0">
      {isQuotaExhausted ? (
        <div className="flex items-center justify-center py-2">
          <p className="text-xs text-muted-foreground">
            Kuota habis — tidak bisa mengirim pesan
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ketik pertanyaanmu..."
            disabled={isLoading}
            className="flex-1 rounded-xl"
            autoComplete="off"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !inputValue.trim()}
            className="rounded-xl flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      )}
    </div>
  )

  if (layout === "embedded") {
    return (
      <div
        className="flex w-full flex-col overflow-hidden rounded-brutal border-2 border-border bg-card shadow-brutal-sm min-h-[min(70vh,560px)] max-h-[min(70vh,calc(100vh-8rem))] h-[min(70vh,560px)]"
        aria-label="Tanya Gaspol chat"
      >
        {headerEmbedded}
        {chatScrollArea}
        {inputFooter}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange ?? (() => {})}>
      <DialogContent className="fixed left-0 top-0 right-0 bottom-0 z-50 w-screen h-screen max-w-none rounded-none translate-x-0 translate-y-0 flex flex-col p-0 gap-0 border-0 sm:left-[50%] sm:top-[50%] sm:right-auto sm:bottom-auto sm:translate-x-[-50%] sm:translate-y-[-50%] sm:w-full sm:max-w-2xl sm:h-auto sm:max-h-[88vh] sm:min-h-[min(65vh,520px)] sm:rounded-2xl sm:border-2 sm:border-charcoal">
        {headerDialog}
        {chatScrollArea}
        {inputFooter}
      </DialogContent>
    </Dialog>
  )
}

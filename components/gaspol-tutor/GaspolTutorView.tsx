"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"
import { ArrowLeft, Loader2, Send, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import {
  TUTOR_DEFAULT_BG,
  getTopicById,
  type TutorTopicId,
} from "@/lib/gaspol-tutor/topics"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"

function normalizeMathDelimiters(text: string): string {
  let out = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `$$${math}$$`)
  out = out.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math}$`)
  return out
}

function ChatMessageBody({
  content,
  className = "",
}: {
  content: string
  className?: string
}) {
  const normalized = normalizeMathDelimiters(content)
  return (
    <div
      className={cn(
        "chat-markdown text-sm leading-relaxed [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-4 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_code]:rounded [&_code]:bg-black/10 [&_code]:px-1 [&_.katex]:text-inherit",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {normalized}
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

const TOP_ROW: TutorTopicId[] = ["aturan_utbk", "ujian_mandiri", "tips_ujian"]
const BOTTOM_ROW: TutorTopicId[] = ["jurusan", "materi", "motivasi"]

export function GaspolTutorView() {
  const { t } = useTranslation("common")
  const [activeTopic, setActiveTopic] = useState<TutorTopicId | null>(null)
  const [messages, setMessages] = useState<ChatRow[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingHistory, setIsFetchingHistory] = useState(false)
  const [remainingTokens, setRemainingTokens] = useState<number | null>(null)
  const [totalTokens, setTotalTokens] = useState(100)
  const [isQuotaExhausted, setIsQuotaExhausted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  /** First message from landing input — sent after history + opening are ready */
  const pendingLandingMessageRef = useRef<string | null>(null)
  const sendMessageRef = useRef<
    (text: string, topicOverride?: TutorTopicId) => Promise<void>
  >(() => Promise.resolve())

  const topicMeta = activeTopic ? getTopicById(activeTopic) : null

  const surfaceStyle = activeTopic
    ? {
        background: `linear-gradient(165deg, ${topicMeta?.themeColor}33 0%, ${TUTOR_DEFAULT_BG} 42%, ${TUTOR_DEFAULT_BG} 100%)`,
      }
    : { backgroundColor: TUTOR_DEFAULT_BG }

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior, block: "end" })
    })
  }, [])

  useEffect(() => {
    if (!activeTopic) return
    const topicId = activeTopic
    let cancelled = false

    async function bootTopic() {
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
          body: JSON.stringify({ topic_id: topicId }),
        })

        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user || cancelled) return

        const { data: chatData } = await supabase
          .from("gaspol_tutor_chats")
          .select("id, role, message, created_at")
          .eq("user_id", user.id)
          .eq("topic_id", topicId)
          .order("created_at", { ascending: true })

        if (!cancelled && chatData) {
          setMessages(chatData as ChatRow[])
        }

        const { data: quotaData } = await supabase
          .from("tanya_gaspol_quota")
          .select("total_tokens, used_tokens, remaining_tokens")
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
      } catch (e) {
        console.error("[GaspolTutorView] load:", e)
      } finally {
        if (!cancelled) setIsFetchingHistory(false)
        const pending = pendingLandingMessageRef.current
        if (!cancelled && pending) {
          pendingLandingMessageRef.current = null
          void sendMessageRef.current(pending, topicId)
        }
      }
    }

    bootTopic()
    return () => {
      cancelled = true
    }
  }, [activeTopic])

  useEffect(() => {
    if (isFetchingHistory) return
    scrollToBottom("auto")
  }, [isFetchingHistory, activeTopic, scrollToBottom])

  useEffect(() => {
    if (isFetchingHistory) return
    scrollToBottom("smooth")
  }, [messages, isLoading, isFetchingHistory, scrollToBottom])

  const sendMessage = useCallback(
    async (text: string, topicOverride?: TutorTopicId) => {
      const topicId = topicOverride ?? activeTopic
      if (!topicId || !text.trim() || isLoading || isQuotaExhausted) return

      const userMsg: ChatRow = {
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

        const response = await fetch("/api/gaspol-tutor", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            topic_id: topicId,
            message: text.trim(),
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          if (response.status === 403) {
            setIsQuotaExhausted(true)
            setRemainingTokens(data.remaining_tokens ?? 0)
            setMessages((prev) => prev.filter((m) => m.id !== userMsg.id))
            return
          }
          throw new Error(data.error || "Gagal mengirim pesan")
        }

        setRemainingTokens(data.remaining_tokens)
        if (data.remaining_tokens < 5) setIsQuotaExhausted(true)

        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const { data: chatData } = await supabase
            .from("gaspol_tutor_chats")
            .select("id, role, message, created_at")
            .eq("user_id", user.id)
            .eq("topic_id", topicId)
            .order("created_at", { ascending: true })
          if (chatData) setMessages(chatData as ChatRow[])
        }
      } catch (e) {
        console.error("[GaspolTutorView] send:", e)
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== userMsg.id),
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            message: "Maaf, terjadi kesalahan. Coba lagi nanti ya.",
            created_at: new Date().toISOString(),
          },
        ])
      } finally {
        setIsLoading(false)
        setTimeout(() => inputRef.current?.focus(), 80)
      }
    },
    [activeTopic, isLoading, isQuotaExhausted],
  )

  sendMessageRef.current = sendMessage

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputValue)
  }

  const handleBack = () => {
    setActiveTopic(null)
    setMessages([])
    setInputValue("")
  }

  const tokenBadge =
    remainingTokens !== null ? (
      <Badge variant="outline" className="gap-1 text-xs shrink-0 border-2 border-border">
        {remainingTokens} / {totalTokens}
      </Badge>
    ) : null

  function TopicCardButton({ topicId }: { topicId: TutorTopicId }) {
    const topic = getTopicById(topicId)
    if (!topic) return null
    const isHero = topicId === "materi"
    return (
      <button
        type="button"
        onClick={() => {
          pendingLandingMessageRef.current = null
          setActiveTopic(topicId)
        }}
        className={cn(
          "relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-border text-left shadow-brutal-sm transition-transform hover:scale-[1.02] active:scale-[0.99]",
          isHero ? "min-h-[200px] p-5 md:min-h-[240px]" : "min-h-[100px] p-4 md:min-h-[112px]",
        )}
        style={{ backgroundColor: topic.themeColor }}
      >
        <span
          className={cn(
            "font-bold leading-tight text-white drop-shadow-sm",
            isHero ? "text-lg md:text-xl max-w-[85%]" : "text-sm md:text-base",
          )}
        >
          {topic.title}
        </span>
        <div
          className="pointer-events-none absolute opacity-25"
          aria-hidden
        >
          <Zap
            className={cn(
              "text-white",
              isHero ? "absolute bottom-3 right-3 h-16 w-16 md:h-24 md:w-24" : "absolute bottom-2 right-2 h-10 w-10",
            )}
          />
        </div>
      </button>
    )
  }

  return (
    <div
      className="min-h-[calc(100dvh-5rem)] md:min-h-[calc(100dvh-4rem)] -mt-6 md:-mt-8 px-3 pb-28 pt-6 transition-[background] duration-500 md:px-6 md:pb-10"
      style={surfaceStyle}
    >
      {!activeTopic ? (
        <div className="mx-auto flex max-w-lg flex-col gap-8 md:max-w-2xl">
          <header className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("tutor.tagline")}
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground md:text-3xl">
              {t("tutor.headline")}
            </h1>
          </header>

          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-3">
              {TOP_ROW.map((id) => (
                <TopicCardButton key={id} topicId={id} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {BOTTOM_ROW.map((id) => (
                <TopicCardButton key={id} topicId={id} />
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!inputValue.trim()) return
              pendingLandingMessageRef.current = inputValue.trim()
              setInputValue("")
              setActiveTopic("materi")
            }}
            className="sticky bottom-0 pt-2"
          >
            <div className="flex gap-2 rounded-full border-2 border-border bg-white p-1.5 pl-4 shadow-brutal-sm">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t("tutor.inputPlaceholder")}
                className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
              />
              <Button
                type="submit"
                className="h-10 shrink-0 rounded-full border-2 border-border bg-foreground px-5 text-background hover:bg-foreground/90"
                disabled={!inputValue.trim()}
              >
                {t("tutor.ask")}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="mx-auto flex h-[min(100dvh-8rem,calc(100dvh-5rem))] max-w-2xl flex-col">
          <div className="mb-3 flex shrink-0 items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full border-2 border-border shadow-brutal-sm"
              onClick={handleBack}
              aria-label={t("button.back")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground">
                {topicMeta?.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("tutor.changeTopicHint")}
              </p>
            </div>
            {tokenBadge}
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border-2 border-border bg-card/80 shadow-brutal-sm backdrop-blur-sm">
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4 md:px-4">
              {isFetchingHistory ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-2",
                        msg.role === "user" ? "flex-row-reverse" : "",
                      )}
                    >
                      {msg.role === "assistant" && (
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-border bg-primary/15 text-sm">
                          <Zap className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[88%] rounded-2xl border-2 border-border px-3 py-2",
                          msg.role === "user"
                            ? "rounded-tr-sm bg-primary text-primary-foreground"
                            : "rounded-tl-sm bg-muted",
                        )}
                      >
                        {msg.role === "assistant" ? (
                          <ChatMessageBody content={msg.message} />
                        ) : (
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">
                            {msg.message}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-2">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-border bg-primary/15">
                        <Zap className="h-4 w-4 text-primary" />
                      </div>
                      <div className="rounded-2xl rounded-tl-sm border-2 border-border bg-muted px-3 py-2">
                        <div className="flex items-center gap-1">
                          <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
                        </div>
                      </div>
                    </div>
                  )}
                  {isQuotaExhausted && (
                    <p className="text-center text-sm text-muted-foreground">
                      {t("tutor.quotaExhausted")}
                    </p>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <div className="shrink-0 border-t-2 border-border p-3">
              {isQuotaExhausted ? (
                <p className="text-center text-xs text-muted-foreground">
                  {t("tutor.quotaExhaustedShort")}
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={t("tutor.chatPlaceholder")}
                    disabled={isLoading}
                    className="flex-1 rounded-xl border-2 border-border"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isLoading || !inputValue.trim()}
                    className="h-10 w-10 shrink-0 rounded-xl border-2 border-border"
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
          </div>
        </div>
      )}
    </div>
  )
}

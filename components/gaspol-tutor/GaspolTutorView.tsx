"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"
import { ArrowLeft, Loader2, Send, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import {
  TUTOR_DEFAULT_BG,
  getTopicById,
  type TutorTopicId,
} from "@/lib/gaspol-tutor/topics"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import {
  IllustrationAturanUTBK,
  IllustrationUjianMandiri,
  IllustrationMateri,
  IllustrationTipsUjian,
  IllustrationJurusan,
  IllustrationMotivasi,
  DecoThreeDashes,
} from "./TopicIllustrations"

/* ------------------------------------------------------------------ */
/*  Markdown + KaTeX                                                   */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Types & Constants                                                  */
/* ------------------------------------------------------------------ */

interface ChatRow {
  id: string
  role: "user" | "assistant"
  message: string
  created_at: string
}

const ILLUST: Record<TutorTopicId, React.FC<{ className?: string }>> = {
  aturan_utbk: IllustrationAturanUTBK,
  ujian_mandiri: IllustrationUjianMandiri,
  materi: IllustrationMateri,
  tips_ujian: IllustrationTipsUjian,
  jurusan: IllustrationJurusan,
  motivasi: IllustrationMotivasi,
}

/*  Desktop 5-col bento:
 *  [aturan]  [jadwal]  [materi  materi]  [tips]
 *  [deco]    [jurusan] [materi  materi]  [motivasi]        */
const GRID_POS: Record<TutorTopicId | "deco", string> = {
  aturan_utbk: "col-start-1 row-start-1",
  ujian_mandiri: "col-start-2 row-start-1",
  materi: "col-start-3 col-span-2 row-start-1 row-span-2",
  tips_ujian: "col-start-5 row-start-1",
  deco: "col-start-1 row-start-2",
  jurusan: "col-start-2 row-start-2",
  motivasi: "col-start-5 row-start-2",
}

const MOBILE_ORDER: TutorTopicId[] = [
  "aturan_utbk",
  "ujian_mandiri",
  "materi",
  "tips_ujian",
  "jurusan",
  "motivasi",
]

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

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
  const landingInputRef = useRef<HTMLTextAreaElement>(null)
  const chatInputRef = useRef<HTMLTextAreaElement>(null)
  const pendingRef = useRef<string | null>(null)
  const sendRef = useRef<(text: string, t?: TutorTopicId) => Promise<void>>(
    () => Promise.resolve(),
  )

  const topicMeta = activeTopic ? getTopicById(activeTopic) : null

  const bgStyle = activeTopic
    ? {
        background: `linear-gradient(170deg, ${topicMeta?.themeColor}40 0%, ${TUTOR_DEFAULT_BG} 38%)`,
        transition: "background 0.5s ease",
      }
    : { backgroundColor: TUTOR_DEFAULT_BG, transition: "background 0.5s ease" }

  /* -- scroll -- */
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    requestAnimationFrame(() =>
      messagesEndRef.current?.scrollIntoView({ behavior, block: "end" }),
    )
  }, [])

  /* -- load quota for landing badge -- */
  useEffect(() => {
    if (activeTopic) return
    async function loadQuota() {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from("tanya_gaspol_quota")
          .select("total_tokens, used_tokens, remaining_tokens")
          .eq("user_id", user.id)
          .single()
        if (data) {
          setRemainingTokens(data.remaining_tokens)
          setTotalTokens(data.total_tokens)
        } else {
          setRemainingTokens(100)
          setTotalTokens(100)
        }
      } catch {
        /* no-op */
      }
    }
    loadQuota()
  }, [activeTopic])

  /* -- boot topic -- */
  useEffect(() => {
    if (!activeTopic) return
    const topicId = activeTopic
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
        if (!cancelled && chatData) setMessages(chatData as ChatRow[])

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
        const pending = pendingRef.current
        if (!cancelled && pending) {
          pendingRef.current = null
          void sendRef.current(pending, topicId)
        }
      }
    }

    boot()
    return () => {
      cancelled = true
    }
  }, [activeTopic])

  useEffect(() => {
    if (!isFetchingHistory) scrollToBottom("auto")
  }, [isFetchingHistory, activeTopic, scrollToBottom])
  useEffect(() => {
    if (!isFetchingHistory) scrollToBottom("smooth")
  }, [messages, isLoading, isFetchingHistory, scrollToBottom])

  /* -- send -- */
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
          body: JSON.stringify({ topic_id: topicId, message: text.trim() }),
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
        setTimeout(() => chatInputRef.current?.focus(), 80)
      }
    },
    [activeTopic, isLoading, isQuotaExhausted],
  )

  sendRef.current = sendMessage

  const handleBack = () => {
    setActiveTopic(null)
    setMessages([])
    setInputValue("")
  }

  /* -- auto-resize textarea -- */
  function autoResize(el: HTMLTextAreaElement | null) {
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  /* ================================================================ */
  /*  TOPIC CARD                                                       */
  /* ================================================================ */

  function TopicCard({ topicId }: { topicId: TutorTopicId }) {
    const topic = getTopicById(topicId)
    if (!topic) return null
    const Illustration = ILLUST[topicId]
    const isHero = topicId === "materi"

    return (
      <button
        type="button"
        onClick={() => {
          pendingRef.current = null
          setActiveTopic(topicId)
        }}
        className={cn(
          "group relative flex h-full w-full flex-col justify-start overflow-hidden rounded-2xl border-2 border-border text-left transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]",
          isHero ? "shadow-brutal p-5" : "shadow-brutal-sm p-3 md:p-4",
          GRID_POS[topicId],
        )}
        style={{ backgroundColor: topic.themeColor }}
      >
        <span
          className={cn(
            "relative z-10 font-bold leading-tight text-white drop-shadow-sm",
            isHero
              ? "text-base sm:text-lg md:text-xl max-w-[60%]"
              : "text-xs sm:text-sm",
          )}
        >
          {topic.title}
        </span>
        <div
          className={cn(
            "pointer-events-none absolute",
            isHero
              ? "bottom-0 right-0 w-[70%] h-[70%]"
              : "bottom-0 right-0 w-[72%] h-[72%]",
          )}
        >
          <Illustration className="h-full w-full opacity-90 transition-opacity group-hover:opacity-100" />
        </div>
      </button>
    )
  }

  /* ================================================================ */
  /*  LANDING VIEW                                                     */
  /* ================================================================ */

  const landingView = (
    <div className="flex min-h-[calc(100dvh-5rem)] md:min-h-[calc(100dvh-4rem)] flex-col items-center justify-center px-4 py-6 md:py-10 lg:py-12">
      <div className="flex w-full max-w-[580px] flex-col items-center gap-8 md:max-w-[640px] md:gap-12 lg:max-w-[680px] lg:gap-16">
        {/* Headline — matches material detail (review/[skillId]): font-serif + bold; larger + airy on md/lg */}
        <header className="w-full px-2 text-center md:px-4">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground leading-[1.2] md:text-4xl md:leading-[1.18] lg:text-5xl ">
            <span className="block">{t("tutor.headlineLine1")}</span>
            <span className="mt-2 block md:mt-3 lg:mt-4">
              {t("tutor.headlineLine2")}
            </span>
          </h1>
        </header>

        {/* Bento Grid — desktop */}
        <div className="w-full">
          <div
            className="hidden md:grid gap-2.5"
            style={{
              gridTemplateColumns: "1fr 1.2fr 1.4fr 1.4fr 1fr",
              gridTemplateRows: "100px 100px",
            }}
          >
            <TopicCard topicId="aturan_utbk" />
            <TopicCard topicId="ujian_mandiri" />
            <TopicCard topicId="materi" />
            <TopicCard topicId="tips_ujian" />
            <div
              className={cn(
                "hidden md:flex items-center justify-center rounded-2xl border-2 border-border bg-[#E8E4DF] shadow-brutal-sm",
                GRID_POS.deco,
              )}
            >
              <DecoThreeDashes className="w-14 opacity-60" />
            </div>
            <TopicCard topicId="jurusan" />
            <TopicCard topicId="motivasi" />
          </div>

          {/* Bento Grid — mobile */}
          <div className="grid grid-cols-2 gap-2.5 md:hidden">
            {MOBILE_ORDER.map((id) => {
              const isHero = id === "materi"
              return (
                <div
                  key={id}
                  className={isHero ? "col-span-2" : ""}
                  style={{ minHeight: isHero ? 160 : 90 }}
                >
                  <TopicCard topicId={id} />
                </div>
              )
            })}
          </div>
        </div>

        {/* Input card — ChatGPT-style wide textarea */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!inputValue.trim()) return
            pendingRef.current = inputValue.trim()
            setInputValue("")
            setActiveTopic("materi")
          }}
          className="w-full"
        >
          <div className="flex flex-col gap-3 rounded-2xl bg-[#D9D3CB] px-4 pb-3 pt-4 shadow-soft md:px-5 md:pt-5">
            <textarea
              ref={landingInputRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value)
                autoResize(e.target)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  if (inputValue.trim()) {
                    pendingRef.current = inputValue.trim()
                    setInputValue("")
                    setActiveTopic("materi")
                  }
                }
              }}
              placeholder={t("tutor.inputPlaceholder")}
              rows={1}
              className="w-full resize-none bg-transparent font-serif text-sm text-foreground placeholder:font-serif placeholder:text-foreground/45 focus:outline-none md:text-base"
            />
            <div className="flex items-center justify-between">
              {remainingTokens !== null ? (
                <Badge className="border-2 border-border bg-[#2D7D6F] text-white text-[11px] font-semibold px-2.5 py-0.5 hover:bg-[#2D7D6F]">
                  {remainingTokens}/{totalTokens}
                </Badge>
              ) : (
                <span />
              )}
              {inputValue.trim() && (
                <Button
                  type="submit"
                  size="icon"
                  className="h-8 w-8 rounded-lg border-2 border-border bg-foreground text-background shadow-brutal-sm hover:bg-foreground/90"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )

  /* ================================================================ */
  /*  CHAT VIEW — AI Chat best practices                               */
  /* ================================================================ */

  const chatView = (
    <div
      className="mx-auto flex w-full max-w-[680px] flex-col px-3 pb-20 md:px-4 md:pb-4"
      style={{ height: "calc(100dvh - 4rem)" }}
    >
      {/* Header bar */}
      <div className="flex shrink-0 items-center gap-3 py-3 md:py-4">
        <button
          type="button"
          onClick={handleBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-border bg-card shadow-brutal-sm transition-colors hover:bg-muted"
          aria-label={t("button.back")}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-border"
          style={{ backgroundColor: topicMeta?.themeColor }}
        >
          <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground">
            {topicMeta?.title}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {t("tutor.changeTopicHint")}
          </p>
        </div>

        {remainingTokens !== null && (
          <Badge className="border-2 border-border bg-[#2D7D6F] text-white text-[11px] font-semibold px-2.5 py-0.5 hover:bg-[#2D7D6F]">
            {remainingTokens}/{totalTokens}
          </Badge>
        )}
      </div>

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-5 py-2">
          {isFetchingHistory ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3",
                    msg.role === "user" && "justify-end",
                  )}
                >
                  {msg.role === "assistant" && (
                    <div
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-border"
                      style={{ backgroundColor: `${topicMeta?.themeColor}20` }}
                    >
                      <Zap
                        className="h-3.5 w-3.5"
                        style={{ color: topicMeta?.themeColor }}
                        strokeWidth={2.5}
                      />
                    </div>
                  )}

                  {msg.role === "assistant" ? (
                    <div className="max-w-[85%] md:max-w-[80%]">
                      <ChatBubble content={msg.message} />
                    </div>
                  ) : (
                    <div className="max-w-[85%] md:max-w-[80%] rounded-2xl rounded-tr-md border-2 border-border bg-foreground px-4 py-2.5 text-background shadow-brutal-sm">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {msg.message}
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-border"
                    style={{ backgroundColor: `${topicMeta?.themeColor}20` }}
                  >
                    <Zap
                      className="h-3.5 w-3.5"
                      style={{ color: topicMeta?.themeColor }}
                      strokeWidth={2.5}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 pt-2">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:0ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:300ms]" />
                  </div>
                </div>
              )}

              {isQuotaExhausted && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  {t("tutor.quotaExhausted")}
                </p>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Chat input — pinned bottom, ChatGPT-style */}
      <div className="shrink-0 pb-1 pt-3">
        {isQuotaExhausted ? (
          <p className="py-2 text-center text-xs text-muted-foreground">
            {t("tutor.quotaExhaustedShort")}
          </p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendMessage(inputValue)
            }}
            className="flex items-end gap-2 rounded-2xl border-2 border-border bg-card px-3 py-2 shadow-brutal-sm focus-within:border-foreground/50 transition-colors"
          >
            <textarea
              ref={chatInputRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value)
                autoResize(e.target)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage(inputValue)
                }
              }}
              placeholder={t("tutor.chatPlaceholder")}
              disabled={isLoading}
              rows={1}
              className="min-h-[36px] max-h-[120px] flex-1 resize-none bg-transparent text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-50"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !inputValue.trim()}
              className="mb-0.5 h-8 w-8 shrink-0 rounded-lg border-2 border-border shadow-brutal-sm disabled:opacity-40"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  )

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  return (
    <div className="min-h-[calc(100dvh-4rem)] -mt-6 md:-mt-8" style={bgStyle}>
      {!activeTopic ? landingView : chatView}
    </div>
  )
}

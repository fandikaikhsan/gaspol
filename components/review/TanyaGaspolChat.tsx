"use client"

/**
 * Tanya Gaspol Chat Component (F-005c / V3-T-011)
 *
 * Modal chat interface for AI-assisted learning scoped to material cards.
 * Features: preset questions, free-form input, chat persistence,
 * token quota display, and quota exhaustion state.
 */

import { useState, useEffect, useRef, useCallback } from "react"
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
  open: boolean
  onOpenChange: (open: boolean) => void
  skillId: string
  skillName: string
  materialContext: MaterialContext
}

export default function TanyaGaspolChat({
  open,
  onOpenChange,
  skillId,
  skillName,
  materialContext,
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

  const greeting = useRef(
    GREETING_TEMPLATES[Math.floor(Math.random() * GREETING_TEMPLATES.length)](
      skillName,
    ),
  )

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Load chat history and quota when dialog opens
  useEffect(() => {
    if (!open) return

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
  }, [open, skillId])

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0 gap-0 border-2 border-charcoal rounded-2xl">
        {/* Header */}
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="h-5 w-5 text-primary" />
              Tanya Gaspol
            </DialogTitle>
            {remainingTokens !== null && (
              <Badge variant="outline" className="gap-1 text-xs flex-shrink-0">
                <Coins className="h-3 w-3" />
                {remainingTokens} / {totalTokens}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Chat area */}
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
                  <p className="text-sm leading-relaxed">{greeting.current}</p>
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
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.message}
                    </p>
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

        {/* Input area */}
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
      </DialogContent>
    </Dialog>
  )
}

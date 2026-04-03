/**
 * Idempotent: inserts the card opening assistant message if the topic has no rows yet.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { getOpeningMessage, isTutorTopicId } from "@/lib/gaspol-tutor/topics"

export async function POST(request: NextRequest) {
  try {
    const supabaseAuth = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      )
    }

    const body = await request.json()
    const topic_id = body?.topic_id as string

    if (!topic_id || !isTutorTopicId(topic_id)) {
      return NextResponse.json({ error: "Invalid topic_id" }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      },
    )

    const { count, error: countError } = await supabase
      .from("gaspol_tutor_chats")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("topic_id", topic_id)

    if (countError) {
      console.error("[gaspol-tutor/ensure-opening] count:", countError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if ((count ?? 0) > 0) {
      return NextResponse.json({ seeded: false })
    }

    const opening = getOpeningMessage(topic_id)
    const { error: insertError } = await supabase
      .from("gaspol_tutor_chats")
      .insert({
        user_id: user.id,
        topic_id,
        role: "assistant",
        message: opening,
        tokens_used: 0,
      })

    if (insertError) {
      console.error("[gaspol-tutor/ensure-opening] insert:", insertError)
      return NextResponse.json({ error: "Failed to seed opening" }, { status: 500 })
    }

    return NextResponse.json({ seeded: true })
  } catch (e) {
    console.error("[gaspol-tutor/ensure-opening]", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

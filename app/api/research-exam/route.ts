import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get request body
    const body = await request.json()
    const { exam_type, year, additional_info } = body

    if (!exam_type || !year) {
      return NextResponse.json(
        { error: "exam_type and year are required" },
        { status: 400 }
      )
    }

    // Get session for forwarding to edge function
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No active session" }, { status: 401 })
    }

    // Call edge function directly with fetch to ensure headers are sent
    const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/research_exam`

    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify({
        exam_type,
        year,
        additional_info,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Edge function error:", errorText)
      return NextResponse.json(
        { error: `Failed to research exam: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("API route error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

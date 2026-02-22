/**
 * Research Exam API Route
 * Proxies to research_exam Edge Function
 */

import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")
    const body = await request.json()

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/research_exam`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader || "",
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
        },
        body: JSON.stringify(body),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    )
  }
}

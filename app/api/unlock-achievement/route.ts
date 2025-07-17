import { supabase } from "@/lib/supabaseClient"

import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { userId, achievementId } = await req.json()

    if (!userId || !achievementId) {
      return NextResponse.json({ error: "Missing userId or achievementId" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("user_achievements")
      .insert([{ user_id: userId, achievement_id: achievementId }])

    if (error) {
      console.error("Error unlocking achievement:", error)
      return NextResponse.json({ error: "Failed to unlock achievement" }, { status: 500 })
    }

    return NextResponse.json({ message: "Achievement unlocked successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

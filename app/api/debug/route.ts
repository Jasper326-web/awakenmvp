import { NextResponse } from "next/server"

export async function GET() {
  try {
    const openRouterKey = process.env.OPENROUTER_API_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

    return NextResponse.json({
      environment: {
        openRouterKey: openRouterKey ? `${openRouterKey.substring(0, 10)}...` : "未设置",
        supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : "未设置",
        supabaseServiceKey: supabaseServiceKey ? `${supabaseServiceKey.substring(0, 10)}...` : "未设置",
        siteUrl: siteUrl || "未设置",
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Debug API error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

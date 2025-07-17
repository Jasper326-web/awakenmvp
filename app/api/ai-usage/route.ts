import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

export async function GET(request: NextRequest) {
  try {
    // 获取用户信息
    const { data: user } = await supabase.auth.getUser()
    
    if (!user.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }

    // 获取用户AI使用统计信息
    const { data: usageStats, error: usageError } = await supabase
      .rpc('get_user_ai_usage_stats', {
        user_uuid: user.user.id
      })

    if (usageError) {
      console.error('Usage stats error:', usageError)
      return NextResponse.json({ error: "获取使用统计时出错" }, { status: 500 })
    }

    return NextResponse.json({ 
      usage: usageStats
    })

  } catch (error) {
    console.error("AI usage API error:", error)
    return NextResponse.json(
      { 
        error: "获取使用统计时出错",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    )
  }
} 
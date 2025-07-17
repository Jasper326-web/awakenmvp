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

    // 获取chat_logs表的原始数据用于验证
    const { data: chatLogs, error: logsError } = await supabase
      .from('chat_logs')
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (logsError) {
      console.error('Chat logs error:', logsError)
    }

    return NextResponse.json({ 
      usage: usageStats,
      debug: {
        user_id: user.user.id,
        chat_logs: chatLogs,
        current_date: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error("Test AI usage API error:", error)
    return NextResponse.json(
      { 
        error: "获取使用统计时出错",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    )
  }
} 
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "配置错误" }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 获取webhook日志（如果有webhook_logs表的话）
    const { data: webhookLogs, error: webhookError } = await supabase
      .from("webhook_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    // 获取最近的订阅变更记录
    const { data: subscriptionChanges, error: subscriptionError } = await supabase
      .from("user_subscriptions")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(20)

    return NextResponse.json({
      webhookLogs: webhookLogs || [],
      subscriptionChanges: subscriptionChanges || [],
      webhookError: webhookError?.message,
      subscriptionError: subscriptionError?.message
    })
  } catch (error) {
    console.error("获取webhook日志失败:", error)
    return NextResponse.json({ error: "获取日志失败" }, { status: 500 })
  }
} 
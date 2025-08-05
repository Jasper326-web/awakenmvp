import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: NextRequest) {
  try {
    console.log("[Setup Creem Subscription ID] 开始执行数据库迁移")
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[Setup Creem Subscription ID] 缺少必要的环境变量")
      return NextResponse.json({ error: "配置错误" }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 直接尝试添加字段
    const { error: alterError } = await supabase
      .rpc('exec_sql', {
        sql: 'ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS creem_subscription_id TEXT;'
      })

    if (alterError) {
      console.error("[Setup Creem Subscription ID] 添加字段失败:", alterError)
      return NextResponse.json({ 
        error: "添加字段失败", 
        details: alterError.message 
      }, { status: 500 })
    }

    console.log("[Setup Creem Subscription ID] 数据库迁移成功")
    return NextResponse.json({ 
      success: true, 
      message: "Creem订阅ID字段添加成功" 
    })
  } catch (error) {
    console.error("[Setup Creem Subscription ID] 处理异常:", error)
    return NextResponse.json({ 
      error: "设置失败", 
      details: String(error) 
    }, { status: 500 })
  }
} 
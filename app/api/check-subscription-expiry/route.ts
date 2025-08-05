import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(req: NextRequest) {
  try {
    console.log("[Check Subscription Expiry] 开始检查订阅过期")
    
    // 使用服务端角色创建Supabase客户端
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 查找已过期但状态仍为active的订阅
    const now = new Date().toISOString()
    
    const { data: expiredSubscriptions, error: queryError } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("status", "active")
      .lt("end_date", now)

    console.log("[Check Subscription Expiry] 过期订阅:", expiredSubscriptions)

    if (queryError) {
      console.error("[Check Subscription Expiry] 查询失败:", queryError)
      return NextResponse.json({ error: "查询失败", details: queryError.message }, { status: 500 })
    }

    // 更新过期订阅状态
    if (expiredSubscriptions && expiredSubscriptions.length > 0) {
      const { error: updateError } = await supabase
        .from("user_subscriptions")
        .update({ 
          status: "expired",
          updated_at: now
        })
        .eq("status", "active")
        .lt("end_date", now)

      if (updateError) {
        console.error("[Check Subscription Expiry] 更新失败:", updateError)
        return NextResponse.json({ error: "更新失败", details: updateError.message }, { status: 500 })
      }

      console.log("[Check Subscription Expiry] 已更新过期订阅状态")
    }

    return NextResponse.json({ 
      success: true, 
      message: "订阅过期检查完成",
      expiredCount: expiredSubscriptions?.length || 0
    })
  } catch (error) {
    console.error("[Check Subscription Expiry] 处理异常:", error)
    return NextResponse.json({ error: "检查失败", details: String(error) }, { status: 500 })
  }
} 
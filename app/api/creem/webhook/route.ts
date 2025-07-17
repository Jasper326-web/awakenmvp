import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

// Creem会员Webhook
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // 假设Creem回调包含user_id和支付状态
    const { user_id, status } = body
    if (!user_id || status !== "success") {
      return NextResponse.json({ error: "参数错误或未支付成功" }, { status: 400 })
    }
    // 激活会员（月付，30天）
    const now = new Date()
    const endDate = new Date(now)
    endDate.setDate(now.getDate() + 30)
    const { error } = await supabase.from("user_subscriptions").upsert({
      user_id,
      subscription_type: "premium",
      status: "active",
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      end_date: endDate.toISOString(),
    })
    if (error) {
      return NextResponse.json({ error: "会员激活失败", details: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: "Webhook处理异常", details: String(e) }, { status: 500 })
  }
} 
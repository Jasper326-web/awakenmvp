import { NextRequest, NextResponse } from "next/server"
import { authService } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: NextRequest) {
  try {
    console.log("[Activate Membership] 开始处理请求")
    
    // 检查环境变量
    console.log("[Activate Membership] 环境变量检查:")
    console.log("- NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "已设置" : "未设置")
    console.log("- SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "已设置" : "未设置")
    
    const currentUser = await authService.getCurrentUserFromRequest(req)
    if (!currentUser) {
      console.log("[Activate Membership] 用户未登录")
      return NextResponse.json({ error: "用户未登录" }, { status: 401 })
    }

    console.log("[Activate Membership] 手动激活用户会员:", currentUser.email, "ID:", currentUser.id)

    // 使用服务端角色创建Supabase客户端，绕过RLS
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

    console.log("[Activate Membership] Supabase客户端创建成功")

    // 激活会员（30天）
    const now = new Date()
    const endDate = new Date(now)
    endDate.setDate(now.getDate() + 30)

    console.log("[Activate Membership] 准备插入数据:", {
      user_id: currentUser.id,
      subscription_type: "premium",
      status: "active",
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      end_date: endDate.toISOString(),
    })

    const { data, error } = await supabase.from("user_subscriptions").upsert({
      user_id: currentUser.id,
      subscription_type: "premium",
      status: "active",
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      end_date: endDate.toISOString(),
    })

    console.log("[Activate Membership] 数据库操作结果:", { data, error })

    if (error) {
      console.error("[Activate Membership] 会员激活失败:", error)
      return NextResponse.json({ error: "会员激活失败", details: error.message }, { status: 500 })
    }

    console.log("[Activate Membership] 会员激活成功:", currentUser.email)
    return NextResponse.json({ success: true, message: "会员激活成功", data })
  } catch (error) {
    console.error("[Activate Membership] 处理异常:", error)
    return NextResponse.json({ error: "激活失败", details: String(error) }, { status: 500 })
  }
}

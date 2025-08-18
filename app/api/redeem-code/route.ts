import { NextRequest, NextResponse } from "next/server"
import { authService } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: NextRequest) {
  try {
    const currentUser = await authService.getCurrentUserFromRequest(req)
    if (!currentUser) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { code } = await req.json()
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "缺少兑换码" }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const normalized = code.trim()

    // 调用数据库原子函数，支持多用户共用同一码（max_uses/uses_count）
    const { data: result, error: rpcErr } = await supabase
      .rpc("redeem_membership_code", { p_user_id: currentUser.id, p_code: normalized })

    if (rpcErr) {
      return NextResponse.json({ error: rpcErr.message || "兑换失败" }, { status: 400 })
    }

    const row = Array.isArray(result) ? result[0] : result
    return NextResponse.json({
      success: true,
      message: "兑换成功",
      days_added: row?.duration_days,
      subscription_type: row?.subscription_type,
      new_end: row?.new_end,
    })
  } catch (error) {
    return NextResponse.json({ error: "兑换失败", details: String(error) }, { status: 500 })
  }
}



import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  try {
    // 从cookie中获取用户ID，而不是依赖客户端会话
    const cookieStore = await cookies()
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

    // 从cookie中获取Supabase会话
    const authCookie = cookieStore.get('sb-tcokifhplpdippdntsya-auth-token')
    if (!authCookie?.value) {
      console.log("[Redeem Code] 未找到认证cookie")
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    let user: any = null

    // 解析cookie中的JWT token
    try {
      // cookie值是base64编码的，需要先解码
      const decodedValue = decodeURIComponent(authCookie.value)
      let tokenData
      
      if (decodedValue.startsWith('base64-')) {
        // 如果是base64格式，先解码
        const base64Data = decodedValue.replace('base64-', '')
        const jsonString = Buffer.from(base64Data, 'base64').toString('utf-8')
        tokenData = JSON.parse(jsonString)
      } else {
        // 如果不是base64，直接解析JSON
        tokenData = JSON.parse(decodedValue)
      }
      
      const accessToken = tokenData.access_token
      
      if (!accessToken) {
        console.log("[Redeem Code] 未找到access_token")
        return NextResponse.json({ error: "未登录" }, { status: 401 })
      }

      // 使用access_token获取用户信息
      const { data: { user: userData }, error: authError } = await supabase.auth.getUser(accessToken)

      if (authError || !userData) {
        console.log("[Redeem Code] 认证失败:", authError?.message || "无用户")
        return NextResponse.json({ error: "未登录" }, { status: 401 })
      }

      user = userData
      console.log("[Redeem Code] 用户已认证:", user.email)
    } catch (parseError) {
      console.log("[Redeem Code] Cookie解析失败:", parseError)
      return NextResponse.json({ error: "认证信息无效" }, { status: 401 })
    }

    const { code } = await req.json()
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "缺少兑换码" }, { status: 400 })
    }

    const normalized = code.trim()

    // 调用数据库原子函数，支持多用户共用同一码（max_uses/uses_count）
    console.log("[Redeem Code] 调用兑换函数:", { user_id: user.id, code: normalized })
    
    const { data: result, error: rpcErr } = await supabase
      .rpc("redeem_membership_code", { p_user_id: user.id, p_code: normalized })

    if (rpcErr) {
      console.log("[Redeem Code] 兑换失败:", rpcErr)
      return NextResponse.json({ error: rpcErr.message || "兑换失败" }, { status: 400 })
    }

    console.log("[Redeem Code] 兑换成功，结果:", result)

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



import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  try {
    console.log("[Cancel Creem Subscription] 开始处理取消订阅请求")
    
    // 检查环境变量
    console.log("[Cancel Creem Subscription] 环境变量检查:")
    console.log("- CREEM_API_KEY:", process.env.CREEM_API_KEY ? "已设置" : "未设置")
    console.log("- NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "已设置" : "未设置")
    console.log("- NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "已设置" : "未设置")
    
    // 使用与user-subscription相同的方法获取用户
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
    
    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log("[Cancel Creem Subscription] 用户未登录")
      return NextResponse.json({ error: "用户未登录" }, { status: 401 })
    }

    const currentUser = user

    console.log("[Cancel Creem Subscription] 取消订阅用户:", currentUser.email)

    // 获取Creem API密钥
    const creemApiKey = process.env.CREEM_API_KEY
    if (!creemApiKey) {
      console.error("[Cancel Creem Subscription] 缺少Creem API密钥")
      return NextResponse.json({ error: "配置错误" }, { status: 500 })
    }

    // 从我们的数据库中获取用户的订阅ID
    console.log("[Cancel Creem Subscription] 查询用户订阅，用户ID:", currentUser.id)
    
    const { data: userSubscriptions, error: dbError } = await supabase
      .from("user_subscriptions")
      .select("id, status, end_date, creem_subscription_id")
      .eq("user_id", currentUser.id)
      .or("status.eq.active,status.eq.cancelled")
      .order("created_at", { ascending: false })
      .limit(1)

    console.log("[Cancel Creem Subscription] 数据库查询结果:", { userSubscriptions, dbError })

    if (dbError) {
      console.error("[Cancel Creem Subscription] 数据库查询失败:", dbError)
      return NextResponse.json({ 
        error: "获取订阅信息失败", 
        details: "数据库查询错误" 
      }, { status: 500 })
    }

    if (!userSubscriptions || userSubscriptions.length === 0) {
      console.error("[Cancel Creem Subscription] 未找到用户订阅:", currentUser.email)
      return NextResponse.json({ 
        error: "未找到活跃订阅", 
        details: "用户没有活跃的订阅" 
      }, { status: 404 })
    }

    const userSubscription = userSubscriptions[0]
    console.log("[Cancel Creem Subscription] 找到用户订阅:", userSubscription.id)

    // 验证订阅是否仍然活跃
    if (userSubscription.status === "cancelled") {
      console.log("[Cancel Creem Subscription] 订阅已经取消:", userSubscription.id)
      return NextResponse.json({ 
        error: "订阅已经取消", 
        details: "该订阅已经被取消" 
      }, { status: 400 })
    }

    // 检查Creem订阅ID是否存在
    if (!userSubscription.creem_subscription_id) {
      console.log("[Cancel Creem Subscription] 用户没有Creem订阅ID，可能是免费试用用户或测试数据:", currentUser.email)
      
      // 对于没有Creem订阅ID的用户，直接更新数据库状态
      const { error: updateError } = await supabase
        .from("user_subscriptions")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString()
        })
        .eq("id", userSubscription.id)
        .eq("status", "active")

      if (updateError) {
        console.error("[Cancel Creem Subscription] 数据库更新失败:", updateError)
        return NextResponse.json({ 
          error: "取消订阅失败", 
          details: "数据库更新失败" 
        }, { status: 500 })
      }

      console.log("[Cancel Creem Subscription] 无Creem订阅ID的用户订阅状态更新成功")
      return NextResponse.json({ 
        success: true, 
        message: "订阅已取消",
        subscription_id: userSubscription.id,
        details: "订阅已取消，当前会员权限将在到期后失效"
      })
    }

    console.log("[Cancel Creem Subscription] 准备取消Creem订阅:", userSubscription.creem_subscription_id)

    // 调用Creem API取消订阅
    console.log("[Cancel Creem Subscription] 准备调用Creem API:")
    console.log("- URL:", `https://api.creem.io/v1/subscriptions/${userSubscription.creem_subscription_id}/cancel`)
    console.log("- Method: POST")
    console.log("- Headers:", { 'x-api-key': '***', 'Content-Type': 'application/json' })
    
    const cancelResponse = await fetch(`https://api.creem.io/v1/subscriptions/${userSubscription.creem_subscription_id}/cancel`, {
      method: 'POST',
      headers: {
        'x-api-key': creemApiKey,
        'Content-Type': 'application/json'
      }
    })

    console.log("[Cancel Creem Subscription] Creem API响应状态:", cancelResponse.status)
    console.log("[Cancel Creem Subscription] Creem API响应头:", Object.fromEntries(cancelResponse.headers.entries()))

    if (!cancelResponse.ok) {
      const errorText = await cancelResponse.text()
      console.error("[Cancel Creem Subscription] Creem API调用失败:")
      console.error("- Status:", cancelResponse.status)
      console.error("- Response:", errorText)
      return NextResponse.json({ 
        error: "取消订阅失败", 
        details: `Creem API返回: ${cancelResponse.status} - ${errorText}` 
      }, { status: 500 })
    }

    const result = await cancelResponse.json()
    console.log("[Cancel Creem Subscription] Creem API调用成功:", result)

    // 更新数据库状态为已取消
    const { error: updateError } = await supabase
      .from("user_subscriptions")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString()
      })
      .eq("id", userSubscription.id)
      .eq("status", "active")

    if (updateError) {
      console.error("[Cancel Creem Subscription] 数据库更新失败:", updateError)
      return NextResponse.json({ 
        error: "取消订阅失败", 
        details: "Creem API调用成功，但数据库更新失败" 
      }, { status: 500 })
    }

    console.log("[Cancel Creem Subscription] 订阅取消成功")

    return NextResponse.json({ 
      success: true, 
      message: "订阅已取消",
      subscription_id: userSubscription.creem_subscription_id,
      details: "自动续费已取消，当前会员权限将在到期后失效",
      creem_response: result
    })
  } catch (error) {
    console.error("[Cancel Creem Subscription] 处理异常:", error)
    return NextResponse.json({ error: "取消订阅失败", details: String(error) }, { status: 500 })
  }
} 
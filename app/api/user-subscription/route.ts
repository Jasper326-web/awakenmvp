import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
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
      return NextResponse.json({ error: "未认证" }, { status: 401 })
    }

    // 使用服务端权限查询订阅数据
    // 修改逻辑：允许已取消但未过期的订阅，获取最新的有效订阅
    // 添加limit(1)优化查询性能
    const { data: subscriptions, error } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .or("status.eq.active,status.eq.cancelled")
      .order("created_at", { ascending: false })
      .limit(1)

    if (error) {
      console.error("查询订阅数据失败:", error)
      // 对于非会员用户，返回null而不是错误
      return NextResponse.json({ data: null })
    }

    // 如果有多个订阅记录，选择最新的有效订阅
    let data = null
    if (subscriptions && subscriptions.length > 0) {
      const now = new Date()
      
      // 找到最新的未过期订阅
      for (const subscription of subscriptions) {
        if (subscription.end_date) {
          const endDate = new Date(subscription.end_date)
          if (now <= endDate) {
            data = subscription
            break
          }
        }
      }
      
      // 如果没有找到未过期的订阅，使用最新的订阅记录
      if (!data && subscriptions.length > 0) {
        data = subscriptions[0]
      }
    }

    // 检查订阅是否过期
    if (data && data.end_date) {
      const now = new Date()
      const endDate = new Date(data.end_date)
      
      if (now > endDate) {
        console.log(`[User Subscription] 订阅已过期: ${user.email}, 结束时间: ${data.end_date}`)
        
        // 更新订阅状态为过期
        const { error: updateError } = await supabase
          .from("user_subscriptions")
          .update({ 
            status: "expired",
            updated_at: now.toISOString()
          })
          .eq("id", data.id)
        
        if (updateError) {
          console.error("更新过期订阅状态失败:", updateError)
        }
        
        // 返回null表示已过期
        return NextResponse.json({ data: null })
      }
      
      // 如果订阅未过期但状态是cancelled，仍然返回数据（允许使用功能）
      if (data.status === "cancelled" && now <= endDate) {
        console.log(`[User Subscription] 已取消但未过期的订阅: ${user.email}, 剩余天数: ${Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))}`)
      }
    }

    // 返回数据，如果没有找到记录则返回null
    const response = NextResponse.json({ data })
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')
    return response
  } catch (error) {
    console.error("API错误:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
} 
import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
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
      return NextResponse.json({ error: "用户未登录" }, { status: 401 })
    }

    // 获取用户订阅信息
    const { data: userSubscriptions, error: dbError } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (dbError) {
      return NextResponse.json({ 
        error: "获取订阅信息失败", 
        details: dbError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      user_id: user.id,
      user_email: user.email,
      subscriptions: userSubscriptions || [],
      count: userSubscriptions?.length || 0
    })
  } catch (error) {
    console.error("[Check Subscription] 异常:", error)
    return NextResponse.json({ 
      error: "检查订阅信息失败", 
      details: String(error) 
    }, { status: 500 })
  }
} 
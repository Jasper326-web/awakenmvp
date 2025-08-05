import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(req: NextRequest) {
  try {
    console.log("[Test Service Role] 开始测试服务端角色")
    
    // 检查环境变量
    console.log("[Test Service Role] 环境变量检查:")
    console.log("- NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "已设置" : "未设置")
    console.log("- SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "已设置" : "未设置")
    
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

    console.log("[Test Service Role] Supabase客户端创建成功")

    // 测试查询user_subscriptions表
    const { data: subscriptions, error: queryError } = await supabase
      .from("user_subscriptions")
      .select("*")
      .limit(5)

    console.log("[Test Service Role] 查询结果:", { subscriptions, queryError })

    if (queryError) {
      console.error("[Test Service Role] 查询失败:", queryError)
      return NextResponse.json({ error: "查询失败", details: queryError.message }, { status: 500 })
    }

    // 测试插入一条测试记录
    const testData = {
      user_id: "00000000-0000-0000-0000-000000000000", // 使用有效的UUID格式
      subscription_type: "test",
      status: "test",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      end_date: new Date().toISOString(),
    }

    console.log("[Test Service Role] 准备插入测试数据:", testData)

    const { data: insertData, error: insertError } = await supabase
      .from("user_subscriptions")
      .insert(testData)
      .select()

    console.log("[Test Service Role] 插入结果:", { insertData, insertError })

    if (insertError) {
      console.error("[Test Service Role] 插入失败:", insertError)
      return NextResponse.json({ error: "插入失败", details: insertError.message }, { status: 500 })
    }

    // 删除测试记录
    const { error: deleteError } = await supabase
      .from("user_subscriptions")
      .delete()
      .eq("user_id", "00000000-0000-0000-0000-000000000000")

    console.log("[Test Service Role] 删除测试记录结果:", { deleteError })

    return NextResponse.json({ 
      success: true, 
      message: "服务端角色测试成功",
      subscriptions: subscriptions?.length || 0,
      testInsert: insertData
    })
  } catch (error) {
    console.error("[Test Service Role] 处理异常:", error)
    return NextResponse.json({ error: "测试失败", details: String(error) }, { status: 500 })
  }
} 
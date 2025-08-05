import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(req: NextRequest) {
  try {
    console.log("[Test Supabase] 开始测试Supabase连接")
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log("[Test Supabase] 环境变量:", {
      url: supabaseUrl ? "已设置" : "未设置",
      serviceKey: supabaseServiceKey ? "已设置" : "未设置"
    })
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "缺少环境变量" }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    console.log("[Test Supabase] 客户端创建成功")
    
    // 测试查询
    const { data: subscriptions, error: queryError } = await supabase
      .from("user_subscriptions")
      .select("*")
      .limit(1)
    
    console.log("[Test Supabase] 查询结果:", { subscriptions, queryError })
    
    if (queryError) {
      return NextResponse.json({ error: "查询失败", details: queryError.message }, { status: 500 })
    }
    
    // 测试插入（使用测试数据）
    const testData = {
      user_id: "test-user-id",
      subscription_type: "test",
      status: "test",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      end_date: new Date().toISOString(),
    }
    
    console.log("[Test Supabase] 准备插入测试数据:", testData)
    
    const { data: insertData, error: insertError } = await supabase
      .from("user_subscriptions")
      .insert(testData)
      .select()
    
    console.log("[Test Supabase] 插入结果:", { insertData, insertError })
    
    if (insertError) {
      return NextResponse.json({ 
        error: "插入失败", 
        details: insertError.message,
        querySuccess: true,
        subscriptions: subscriptions?.length || 0
      }, { status: 500 })
    }
    
    // 删除测试数据
    const { error: deleteError } = await supabase
      .from("user_subscriptions")
      .delete()
      .eq("user_id", "test-user-id")
    
    console.log("[Test Supabase] 删除测试数据结果:", { deleteError })
    
    return NextResponse.json({ 
      success: true, 
      message: "Supabase连接测试成功",
      subscriptions: subscriptions?.length || 0,
      insertSuccess: true,
      deleteSuccess: !deleteError
    })
  } catch (error) {
    console.error("[Test Supabase] 测试异常:", error)
    return NextResponse.json({ error: "测试异常", details: String(error) }, { status: 500 })
  }
} 
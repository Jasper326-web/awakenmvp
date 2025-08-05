import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(req: NextRequest) {
  try {
    console.log("[Test Direct SQL] 开始测试直接SQL")
    
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

    console.log("[Test Direct SQL] Supabase客户端创建成功")

    // 使用直接SQL查询，绕过RLS
    const { data: queryResult, error: queryError } = await supabase
      .rpc('test_direct_sql', {
        sql_query: 'SELECT COUNT(*) as count FROM user_subscriptions'
      })

    console.log("[Test Direct SQL] 查询结果:", { queryResult, queryError })

    if (queryError) {
      console.error("[Test Direct SQL] 查询失败:", queryError)
      
      // 尝试直接SQL插入
      const { data: insertResult, error: insertError } = await supabase
        .rpc('test_insert_sql', {
          user_id_param: '00000000-0000-0000-0000-000000000000',
          subscription_type_param: 'test',
          status_param: 'test'
        })

      console.log("[Test Direct SQL] 插入结果:", { insertResult, insertError })

      if (insertError) {
        return NextResponse.json({ 
          error: "SQL操作失败", 
          queryError: queryError.message,
          insertError: insertError.message
        }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: "直接SQL测试成功",
        insertResult
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: "直接SQL测试成功",
      queryResult
    })
  } catch (error) {
    console.error("[Test Direct SQL] 处理异常:", error)
    return NextResponse.json({ error: "测试失败", details: String(error) }, { status: 500 })
  }
} 
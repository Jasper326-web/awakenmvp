import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
  )
}

// 单例模式确保只创建一个客户端实例
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseInstance
})()

// 测试连接函数
export async function testConnection() {
  try {
    console.log("[Supabase] 开始测试连接...")

    const { data, error } = await supabase.from("addiction_tests").select("count").limit(1)

    if (error) {
      console.error("[Supabase] 连接测试失败:", error)
      return { success: false, error: error.message }
    }

    console.log("[Supabase] 连接测试成功")
    return { success: true, data }
  } catch (error) {
    console.error("[Supabase] 连接测试异常:", error)
    return { success: false, error: String(error) }
  }
}

// 获取当前用户会话
export async function getCurrentUser() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error("[Supabase] 获取会话失败:", error)
      return { user: null, session: null, error }
    }

    console.log("[Supabase] 当前会话状态:", session ? "已登录" : "未登录")
    return { user: session?.user || null, session, error: null }
  } catch (error) {
    console.error("[Supabase] 获取用户异常:", error)
    return { user: null, session: null, error }
  }
}

// 默认导出
export default supabase

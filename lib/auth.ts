import { supabase } from "@/lib/supabaseClient"
import type { User, Session } from "@supabase/supabase-js"
import { NextRequest } from "next/server"

export const authService = {
  // 获取当前用户
  async getCurrentUser(): Promise<User | null> {
    try {
      console.log("[authService] 开始获取当前用户")

      // 检查 Supabase 客户端是否已初始化
      if (!supabase) {
        console.error("[authService] Supabase 客户端未初始化")
        return null
      }

      console.log("[authService] Supabase 客户端已初始化")

      // 先检查当前会话
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("[authService] 获取会话失败:", sessionError)
        return null
      }

      console.log("[authService] 会话状态:", sessionData.session ? "有会话" : "无会话")

      if (!sessionData.session) {
        console.log("[authService] 用户未登录，返回 null")
        return null
      }

      // 获取用户信息
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError) {
        console.error("[authService] 获取用户信息失败:", userError)
        return null
      }

      if (!userData.user) {
        console.log("[authService] 用户数据为空")
        return null
      }

      console.log("[authService] 成功获取用户信息:", userData.user.email)
      return userData.user
    } catch (error) {
      console.error("[authService] getCurrentUser 异常:", error)
      return null
    }
  },

  // API路由认证 - 从请求头获取认证信息
  async getCurrentUserFromRequest(request: NextRequest): Promise<User | null> {
    try {
      console.log("[authService] 开始从请求头获取用户信息")
      
      // 从请求头获取认证信息
      const authHeader = request.headers.get('authorization')
      const cookieHeader = request.headers.get('cookie')
      
      console.log("[authService] Authorization header:", authHeader)
      console.log("[authService] Cookie header:", cookieHeader)
      
      // 如果有Bearer token，使用它来设置会话
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        console.log("[authService] 使用Bearer token进行认证")
        
        // 使用token获取用户信息
        const { data: userData, error: userError } = await supabase.auth.getUser(token)
        
        if (userError) {
          console.error("[authService] Bearer token认证失败:", userError)
          return null
        }
        
        if (userData.user) {
          console.log("[authService] Bearer token认证成功:", userData.user.email)
          return userData.user
        }
      }

      // 如果没有Bearer token，尝试从会话获取用户
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("[authService] 获取会话失败:", sessionError)
        return null
      }

      console.log("[authService] API会话状态:", sessionData.session ? "有会话" : "无会话")

      if (!sessionData.session) {
        console.log("[authService] API用户未登录，返回 null")
        return null
      }

      // 获取用户信息
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError) {
        console.error("[authService] 获取用户信息失败:", userError)
        return null
      }

      if (!userData.user) {
        console.log("[authService] API用户数据为空")
        return null
      }

      console.log("[authService] API成功获取用户信息:", userData.user.email)
      return userData.user
    } catch (error) {
      console.error("[authService] getCurrentUserFromRequest 异常:", error)
      return null
    }
  },

  // 获取当前会话
  async getSession(): Promise<Session | null> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      return session
    } catch (error) {
      console.error("获取会话失败:", error)
      return null
    }
  },

  // 邮箱密码登录
  async signIn(email: string, password: string) {
    console.log("[authService] 开始邮箱密码登录")
    const result = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return result
  },

  // 邮箱密码注册
  async signUp(email: string, password: string) {
    console.log("[authService] 开始邮箱密码注册")
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (result.data.user) {
      console.log("[authService] 注册成功，用户:", result.data.user.email)
    }

    return result
  },

  // Google 登录
  async signInWithGoogle() {
    console.log("[authService] 开始 Google 登录")
    return await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  },

  // GitHub 登录
  async signInWithGitHub() {
    console.log("[authService] 开始 GitHub 登录")
    return await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  },

  // 退出登录
  async signOut() {
    console.log("[authService] 开始退出登录")
    const result = await supabase.auth.signOut()

    // 退出成功后刷新页面
    setTimeout(() => {
      window.location.reload()
    }, 500)

    return result
  },

  // 监听认证状态变化
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      console.log("[authService] 认证状态变化:", event, session ? "有会话" : "无会话")
      callback(event, session)
    })
  },

  // 重置密码
  async resetPassword(email: string) {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
  },

  // 更新用户信息
  async updateUser(updates: { email?: string; password?: string; data?: any }) {
    return await supabase.auth.updateUser(updates)
  },

  // 刷新会话
  async refreshSession() {
    return await supabase.auth.refreshSession()
  },
}

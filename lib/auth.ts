import { supabase } from "@/lib/supabaseClient"
import type { User, Session } from "@supabase/supabase-js"

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
    return supabase.auth.onAuthStateChange((event: string, session: Session | null) => {
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

  // 游客一键登录
  async guestSignIn() {
    // 检查当前是否已登录
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session && sessionData.session.user) {
      // 已有用户，直接返回
      return { user: sessionData.session.user, isGuest: sessionData.session.user.user_metadata?.isGuest };
    }
    // 生成随机邮箱和密码
    const randomId = Math.random().toString(36).substring(2, 12);
    const email = `guest_${randomId}@guest.awaken`;
    const password = Math.random().toString(36).slice(2) + 'A1!';
    // 注册游客账号
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { isGuest: true, username: `Guest_${randomId}` },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) return { error };
    // 自动登录
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) return { error: signInError };
    return { user: signInData.user, isGuest: true };
  },
}

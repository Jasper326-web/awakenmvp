import { supabase } from "@/lib/supabaseClient"

export interface UserSubscription {
  id: string
  user_id: string
  subscription_type: "free" | "pro" | "premium"
  status: "active" | "inactive" | "expired" | "cancelled"
  end_date: string | null
  activated_at: string | null
  order_id: string | null
  created_at: string
  updated_at: string
}

export interface SubscriptionStatus {
  subscription_type: "free" | "pro" | "premium"
  status: "active" | "inactive" | "expired" | "cancelled"
  end_date: string | null
  is_expired: boolean
  is_pro: boolean
  is_premium: boolean
  days_remaining: number | null
}

export const subscriptionService = {
  // 获取用户订阅信息
  async getUserSubscription(userId: string) {
    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("subscription_type, status, end_date, activated_at, order_id, created_at, updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("获取用户订阅信息失败:", error)
      return null
    }

    return data as UserSubscription | null
  },

  // 激活用户订阅
  async activateUserSubscription(userId: string, orderId: string) {
    const { data, error } = await supabase
      .from("user_subscriptions")
      .update({
        status: "active",
        activated_at: new Date().toISOString(),
        order_id: orderId,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("激活用户订阅失败:", error)
      return null
    }

    return data
  },

  // 检查订阅是否激活
  async checkIsActive(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("status, end_date")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return false
    if (data.status !== "active") return false
    if (data.end_date) {
      const endDate = new Date(data.end_date)
      const now = new Date()
      return endDate > now
    }
    return true
  },

  // 获取用户订阅状态（详细信息）
  async getUserSubscriptionStatus(userId: string): Promise<SubscriptionStatus | null> {
    try {
      const subscription = await this.getUserSubscription(userId)

      if (!subscription) {
        // 返回免费用户状态
        return {
          subscription_type: "free",
          status: "inactive",
          end_date: null,
          is_expired: false,
          is_pro: false,
          is_premium: false,
          days_remaining: null,
        }
      }

      const now = new Date()
      const endDate = subscription.end_date ? new Date(subscription.end_date) : null
      const isExpired = endDate ? endDate <= now : false
      const isActive = subscription.status === "active" && !isExpired
      const daysRemaining = endDate && !isExpired ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null

      return {
        subscription_type: subscription.subscription_type,
        status: isExpired ? "expired" : subscription.status,
        end_date: subscription.end_date,
        is_expired: isExpired,
        is_pro: subscription.subscription_type === "pro" && isActive,
        is_premium: subscription.subscription_type === "premium" && isActive,
        days_remaining: daysRemaining,
      }
    } catch (error) {
      console.error("获取订阅状态失败:", error)
      return null
    }
  },

  // 创建新订阅
  async createSubscription(userId: string, subscription_type: "pro" | "premium", durationDays: number): Promise<boolean> {
    try {
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + durationDays)

      const { error } = await supabase.from("user_subscriptions").upsert({
        user_id: userId,
        subscription_type,
        status: "active",
        end_date: endDate.toISOString(),
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (error) {
        console.error("创建订阅失败:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("创建订阅失败:", error)
      return false
    }
  },

  // 取消订阅
  async cancelSubscription(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("user_subscriptions")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)

      if (error) {
        console.error("取消订阅失败:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("取消订阅失败:", error)
      return false
    }
  },

  // 续费订阅
  async renewSubscription(userId: string, durationDays: number): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId)
      if (!subscription) return false

      const currentExpiry = subscription.end_date ? new Date(subscription.end_date) : new Date()
      const newExpiry = new Date(Math.max(currentExpiry.getTime(), new Date().getTime()))
      newExpiry.setDate(newExpiry.getDate() + durationDays)

      const { error } = await supabase
        .from("user_subscriptions")
        .update({
          status: "active",
          end_date: newExpiry.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)

      if (error) {
        console.error("续费订阅失败:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("续费订阅失败:", error)
      return false
    }
  },

  // 检查功能权限
  checkFeatureAccess(subscription: SubscriptionStatus | null, feature: string): boolean {
    if (!subscription || subscription.status !== "active" || subscription.is_expired) return false
    const proFeatures = [
      "unlimited_checkins",
      "custom_reminders",
      "full_leaderboard",
      "advanced_filters",
      "premium_content",
    ]
    const premiumFeatures = [
      "meditation_courses",
      "personal_coach",
      "advanced_analytics",
      "priority_support",
      "exclusive_content",
    ]
    if (subscription.is_premium) {
      return true
    }
    if (subscription.is_pro) {
      return proFeatures.includes(feature) || !premiumFeatures.includes(feature)
    }
    return false
  },

  // 激活会员码
  async activateMembershipCode(userId: string, code: string): Promise<{ success: boolean; message: string }> {
    try {
      // 检查会员码是否存在且未使用
      const { data: membershipCode, error: codeError } = await supabase
        .from("membership_codes")
        .select("*")
        .eq("code", code)
        .eq("is_used", false)
        .maybeSingle()

      if (codeError || !membershipCode) {
        return { success: false, message: "会员码无效或已被使用" }
      }

      // 检查会员码是否过期
      if (membershipCode.expires_at && new Date(membershipCode.expires_at) < new Date()) {
        return { success: false, message: "会员码已过期" }
      }

      // 激活订阅
      const success = await this.createSubscription(userId, membershipCode.subscription_type, membershipCode.duration_days)

      if (!success) {
        return { success: false, message: "激活订阅失败" }
      }

      // 标记会员码为已使用
      await supabase
        .from("membership_codes")
        .update({
          is_used: true,
          used_by: userId,
          used_at: new Date().toISOString(),
        })
        .eq("id", membershipCode.id)

      return { success: true, message: "会员码激活成功" }
    } catch (error) {
      console.error("激活会员码失败:", error)
      return { success: false, message: "激活失败，请稍后重试" }
    }
  },
}

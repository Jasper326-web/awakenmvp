import { supabase } from "@/lib/supabaseClient"
import { subscriptionService } from "./subscription"

// 基础数据库操作服务
export const databaseService = {
  // 用户相关操作
  async createUser(userData: any) {
    const { data, error } = await supabase.from("users").insert(userData).select().single()

    if (error) throw error
    return data
  },

  async getUserById(userId: string) {
    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

    if (error) throw error
    return data
  },

  async updateUser(userId: string, updates: any) {
    const { data, error } = await supabase.from("users").update(updates).eq("id", userId).select().single()

    if (error) throw error
    return data
  },

  // 打卡记录操作
  async createCheckin(userId: string, checkinData: any) {
    const { data, error } = await supabase
      .from("daily_checkins")
      .insert({
        user_id: userId,
        ...checkinData,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getUserCheckins(userId: string, limit = 30) {
    const { data, error } = await supabase
      .from("daily_checkins")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  },

  // 成就系统操作
  async getUserAchievements(userId: string) {
    const { data, error } = await supabase
      .from("user_achievements")
      .select(`
        *,
        achievements (
          id,
          name,
          description,
          icon,
          category
        )
      `)
      .eq("user_id", userId)

    if (error) throw error
    return data
  },

  async unlockAchievement(userId: string, achievementId: string) {
    const { data, error } = await supabase
      .from("user_achievements")
      .insert({
        user_id: userId,
        achievement_id: achievementId,
        unlocked_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 社区帖子操作
  async createPost(userId: string, postData: any) {
    const { data, error } = await supabase
      .from("community_posts")
      .insert({
        user_id: userId,
        ...postData,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getPosts(limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from("community_posts")
      .select(`
        *,
        users (
          id,
          username,
          avatar_url
        )
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data
  },

  // 测试结果操作
  async saveTestResult(userId: string, testData: any) {
    const { data, error } = await supabase
      .from("addiction_tests")
      .insert({
        user_id: userId,
        ...testData,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getUserTestResults(userId: string) {
    const { data, error } = await supabase
      .from("addiction_tests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data
  },
}

// ❌ 旧写法（会触发打包器 bug）
// export { subscriptionService } from "./subscription"

export { subscriptionService }

import { supabase } from "./supabase"

export interface StreakData {
  currentStreak: number
  maxStreak: number
  totalCheckins: number
}

export const calculateUserStreak = async (userId: string): Promise<StreakData> => {
  try {
    // 获取用户所有打卡记录，按日期排序
    const { data: checkins, error } = await supabase
      .from("daily_checkins")
      .select("date, status")
      .eq("user_id", userId)
      .order("date", { ascending: true })

    if (error || !checkins) {
      console.error("获取打卡记录失败:", error)
      return { currentStreak: 0, maxStreak: 0, totalCheckins: 0 }
    }

    if (checkins.length === 0) {
      return { currentStreak: 0, maxStreak: 0, totalCheckins: 0 }
    }

    // 计算最大连续天数
    let maxStreak = 0
    let tempStreak = 0

    for (const checkin of checkins) {
      if (checkin.status === 'success') {
        tempStreak++
        maxStreak = Math.max(maxStreak, tempStreak)
      } else {
        tempStreak = 0
      }
    }

    // 计算当前连续天数（从最新记录往前算）
    let currentStreak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 从今天开始往前检查连续天数
    for (let i = 0; i < 365; i++) {
      // 最多检查365天
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      const dateStr = checkDate.toISOString().split("T")[0]

      const checkin = checkins.find((c) => c.date === dateStr)

      if (checkin && checkin.status === 'success') {
        currentStreak++
      } else if (checkin && checkin.status === 'failed') {
        // 如果这一天破戒了，连续天数中断
        break
      } else if (i === 0) {
        // 如果今天没有打卡记录，从昨天开始算
        continue
      } else {
        // 如果某天没有记录且不是今天，则连续天数中断
        break
      }
    }

    return {
      currentStreak,
      maxStreak,
      totalCheckins: checkins.length,
    }
  } catch (error) {
    console.error("计算连续天数失败:", error)
    return { currentStreak: 0, maxStreak: 0, totalCheckins: 0 }
  }
}

// 批量计算多个用户的连续天数（用于排行榜）
export const calculateMultipleUserStreaks = async (userIds: string[]): Promise<Record<string, StreakData>> => {
  const results: Record<string, StreakData> = {}

  const promises = userIds.map(async (userId) => {
    const streakData = await calculateUserStreak(userId)
    results[userId] = streakData
  })

  await Promise.all(promises)
  return results
}

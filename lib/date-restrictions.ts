/**
 * 日期操作限制工具函数
 */

import { useLanguage } from "@/lib/lang-context"

// 获取 UTC 时区的当前日期
export function getChinaToday(): Date {
  // 使用 UTC 时区获取当前日期
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

// 获取日期字符串（YYYY-MM-DD格式）
export function getDateString(date: Date): string {
  // 使用本地时区生成日期字符串，避免 UTC 时区导致的日期偏差
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 计算两个日期之间的天数差
export function getDaysDifference(date1: Date, date2: Date): number {
  // 使用日期字符串比较，避免时区问题
  const date1String = getDateString(date1)
  const date2String = getDateString(date2)
  
  // 转换为时间戳进行比较
  const time1 = new Date(date1String + 'T00:00:00').getTime()
  const time2 = new Date(date2String + 'T00:00:00').getTime()
  
  const timeDiff = time2 - time1
  return Math.floor(timeDiff / (1000 * 60 * 60 * 24))
}

// 判断日期的操作权限
export function getDatePermissions(dateString: string, hasExistingData = false, t?: (key: string) => string) {
  const targetDate = new Date(dateString)
  const today = getChinaToday()
  const daysDiff = getDaysDifference(targetDate, today)

  // 调试信息
  console.log('getDatePermissions debug:', {
    dateString,
    targetDate: targetDate.toISOString(),
    today: today.toISOString(),
    daysDiff,
    hasExistingData
  })

  // 未来日期
  if (daysDiff < 0) {
    return {
      canClick: false,
      canEdit: false,
      canView: false,
      reason: t ? t("calendar.reason.future") : "未来日期无法操作",
      type: "future" as const,
    }
  }

  // 今天
  if (daysDiff === 0) {
    return {
      canClick: true,
      canEdit: true,
      canView: true,
      reason: t ? t("calendar.reason.today") : "今天可以正常操作",
      type: "today" as const,
    }
  }

  // 过去1-3天
  if (daysDiff >= 1 && daysDiff <= 3) {
    return {
      canClick: true,
      canEdit: true,
      canView: true,
      reason: t ? t("calendar.reason.makeup") : "可以补打卡",
      type: "recent_past" as const,
    }
  }

  // 过去3天以上
  if (daysDiff > 3) {
    if (hasExistingData) {
      return {
        canClick: true,
        canEdit: false,
        canView: true,
        reason: t ? t("calendar.reason.old_with_data") : "只能查看历史记录",
        type: "old_with_data" as const,
      }
    } else {
      return {
        canClick: false,
        canEdit: false,
        canView: false,
        reason: t ? t("calendar.reason.old_no_data") : "超过补打卡时限",
        type: "old_no_data" as const,
      }
    }
  }

  // 默认情况
  return {
    canClick: false,
    canEdit: false,
    canView: false,
    reason: t ? t("calendar.reason.unknown") : "无法操作",
    type: "unknown" as const,
  }
}

// 格式化日期显示
export function formatDateDisplay(dateString: string): string {
  const date = new Date(dateString)
  const today = getChinaToday()
  const daysDiff = getDaysDifference(date, today)

  if (daysDiff === 0) return "今天"
  if (daysDiff === 1) return "昨天"
  if (daysDiff === 2) return "前天"
  if (daysDiff > 0) return `${daysDiff}天前`
  if (daysDiff === -1) return "明天"
  if (daysDiff < -1) return `${Math.abs(daysDiff)}天后`

  return date.toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
  })
}

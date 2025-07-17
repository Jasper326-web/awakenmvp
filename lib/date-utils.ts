/**
 * 日期和时间工具函数
 */

// 获取中国时区的当前日期时间
export function getChinaDateTime(): Date {
  // 创建一个表示当前时间的 Date 对象
  const now = new Date()

  // 获取 UTC 时间的毫秒数
  const utcTime = now.getTime()

  // 获取本地时区与 UTC 的时差（分钟）
  const localTimezoneOffset = now.getTimezoneOffset()

  // 中国时区是 UTC+8，即比 UTC 早 8 小时，时差为 -480 分钟
  const chinaTimezoneOffset = -480

  // 计算本地时区与中国时区的时差（毫秒）
  const offsetDiff = (localTimezoneOffset - chinaTimezoneOffset) * 60 * 1000

  // 调整时间
  return new Date(utcTime + offsetDiff)
}

// 格式化为中国日期（年月日）
export function formatChinaDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date

  // 使用 toLocaleDateString 格式化日期
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Shanghai",
  })
}

// 格式化为中国时间（年月日时分秒）
export function formatChinaDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date

  // 使用 toLocaleString 格式化日期和时间
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Shanghai",
  })
}

// 获取中国时区的今天日期（YYYY-MM-DD格式）
export function getChinaToday(): string {
  const chinaDate = getChinaDateTime()
  const year = chinaDate.getFullYear()
  const month = String(chinaDate.getMonth() + 1).padStart(2, "0")
  const day = String(chinaDate.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

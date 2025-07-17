"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Check, X, BookOpen, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getDatePermissions, getChinaToday, getDateString } from "@/lib/date-restrictions"
import { useLanguage } from "@/lib/lang-context"

interface CalendarDay {
  date: string
  day: number
  isCurrentMonth: boolean
  isToday: boolean
  isPast: boolean
  isFuture: boolean
  permissions: ReturnType<typeof getDatePermissions>
  status?: "success" | "failed" | "pending"
  hasJournal?: boolean
  hasVideo?: boolean
}

interface CalendarProps {
  selectedDate: string
  onDateSelect: (date: string) => void
  checkinData: Record<
    string,
    {
      status: "success" | "failed" | "pending"
      hasJournal: boolean
      hasVideo: boolean
    }
  >
  onDateHover?: (date: string) => void
  onDateLeave?: () => void
}

export default function CalendarComponent({
  selectedDate,
  onDateSelect,
  checkinData,
  onDateHover,
  onDateLeave,
}: CalendarProps) {
  const { t } = useLanguage()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])

  const months = [
    t("calendar.months.1"), t("calendar.months.2"), t("calendar.months.3"), t("calendar.months.4"),
    t("calendar.months.5"), t("calendar.months.6"), t("calendar.months.7"), t("calendar.months.8"),
    t("calendar.months.9"), t("calendar.months.10"), t("calendar.months.11"), t("calendar.months.12")
  ]
  const weekDays = [
    t("calendar.weekdays.0"), t("calendar.weekdays.1"), t("calendar.weekdays.2"), t("calendar.weekdays.3"),
    t("calendar.weekdays.4"), t("calendar.weekdays.5"), t("calendar.weekdays.6")
  ]

  useEffect(() => {
    generateCalendarDays()
  }, [currentDate, checkinData])

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days: CalendarDay[] = []
    const todayDateOnly = getChinaToday()

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)

      const dateString = getDateString(date)
      const checkin = checkinData[dateString]
      const hasExistingData = !!(checkin?.status || checkin?.hasJournal || checkin?.hasVideo)

      // 使用 getDateString 确保日期格式一致
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const todayString = getDateString(todayDateOnly)
      const currentDateString = getDateString(dateOnly)

      // 判断日期类型 - 使用字符串比较确保一致性
      const isToday = currentDateString === todayString
      const isPast = currentDateString < todayString
      const isFuture = currentDateString > todayString

      // 获取日期权限（传入 t）
      const permissions = getDatePermissions(dateString, hasExistingData, t)

      days.push({
        date: dateString,
        day: date.getDate(),
        isCurrentMonth: date.getMonth() === month,
        isToday: isToday,
        isPast: isPast,
        isFuture: isFuture,
        permissions: permissions,
        status: checkin?.status,
        hasJournal: checkin?.hasJournal || false,
        hasVideo: checkin?.hasVideo || false,
      })
    }

    setCalendarDays(days)
  }

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentDate.getMonth() + (direction === "next" ? 1 : -1))
    setCurrentDate(newDate)
  }

  const getStatusIcon = (day: CalendarDay) => {
    if (!day.isCurrentMonth) return null

    const icons = []

    if (day.status === "success") {
      icons.push(<Check key="success" className="w-3 h-3 text-green-400" />)
    } else if (day.status === "failed") {
      icons.push(<X key="failed" className="w-3 h-3 text-red-400" />)
    }

    if (day.hasJournal) {
      icons.push(<BookOpen key="journal" className="w-2 h-2 text-blue-400" />)
    }

    if (day.hasVideo) {
      icons.push(<Video key="video" className="w-2 h-2 text-purple-400" />)
    }

    return icons.length > 0 ? <div className="flex flex-wrap gap-0.5 mt-1">{icons}</div> : null
  }

  const getDayStyle = (day: CalendarDay) => {
    if (!day.isCurrentMonth) {
      return "text-gray-500/30 cursor-default"
    }

    let baseStyle = "text-white transition-all duration-200"

    // 根据权限设置样式
    if (!day.permissions.canClick) {
      baseStyle += " cursor-not-allowed opacity-50"
    } else {
      baseStyle += " cursor-pointer hover:bg-white/10 transform hover:scale-105"
    }

    // 根据日期类型和状态设置背景色
    if (day.isToday) {
      // 今天的日期
      if (day.status) {
        baseStyle += " bg-blue-900/50 border-2 border-blue-500 shadow-lg text-blue-100"
      } else {
        baseStyle += " bg-blue-900/30 border-2 border-blue-400/50 shadow-md text-blue-200"
      }
    } else if (selectedDate === day.date) {
      baseStyle += " bg-white/10 border-2 border-white/30"
    } else if (day.status === "success") {
      baseStyle += " bg-green-900/30 border border-green-500/30"
    } else if (day.status === "failed") {
      baseStyle += " bg-red-900/30 border border-red-500/30"
    } else if (day.permissions.type === "recent_past" && !day.status) {
      // 可补打卡的日期
      baseStyle += " bg-yellow-900/30 text-yellow-200 border border-yellow-500/30"
    } else if (day.permissions.type === "old_no_data") {
      // 超过时限且无数据的日期
      baseStyle += " bg-gray-900/30 text-gray-400 border border-gray-700/30"
    } else if (day.permissions.type === "future") {
      // 未来日期
      baseStyle += " bg-gray-900/20 text-gray-400 border border-gray-700/20"
    } else {
      baseStyle += " border border-gray-700/30 hover:border-gray-500/50"
    }

    return baseStyle
  }

  const handleDateClick = (day: CalendarDay) => {
    if (day.isCurrentMonth && day.permissions.canClick) {
      onDateSelect(day.date)
    }
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-6 border border-white/10 shadow-xl">
      {/* 日历头部 */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateMonth("prev")}
          className="text-gray-300 hover:text-white hover:bg-white/10"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <h3 className="text-2xl font-bold text-white">
          {currentDate.getFullYear()} {months[currentDate.getMonth()]}
        </h3>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateMonth("next")}
          className="text-gray-300 hover:text-white hover:bg-white/10"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-400 py-3">
            {day}
          </div>
        ))}
      </div>

      {/* 日历网格 */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day, index) => (
          <button
            key={index}
            onClick={() => handleDateClick(day)}
            onMouseEnter={() => day.isCurrentMonth && day.permissions.canClick && onDateHover?.(day.date)}
            onMouseLeave={() => onDateLeave?.()}
            className={`relative h-16 flex flex-col items-center justify-center text-sm rounded-lg ${getDayStyle(day)}`}
            title={day.isCurrentMonth ? (day.isToday ? t("calendar.todayTooltip") : day.permissions.reason) : undefined}
          >
            <span className="font-medium">{day.day}</span>
            {getStatusIcon(day)}

            {/* 今天标记 */}
            {day.isToday && <div className="absolute bottom-1 left-1 text-xs font-bold text-blue-400">{t("calendar.today")}</div>}

            {/* 补打卡标记 */}
            {day.permissions.type === "recent_past" && !day.status && day.isCurrentMonth && (
              <div className="absolute bottom-1 left-1 text-xs font-bold text-yellow-400">{t("calendar.makeup")}</div>
            )}

            {/* 超时标记 */}
            {day.permissions.type === "old_no_data" && day.isCurrentMonth && (
              <div className="absolute top-1 right-1 w-2 h-2 bg-gray-500 rounded-full"></div>
            )}

            {/* 未来日期标记 */}
            {day.permissions.type === "future" && day.isCurrentMonth && (
              <div className="absolute top-1 right-1 w-2 h-2 bg-gray-600 rounded-full"></div>
            )}
          </button>
        ))}
      </div>

      {/* 图例 */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-300 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-900/50 border border-blue-500/50 rounded"></div>
          <span>{t("calendar.legend.today")}</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-400" />
          <span>{t("calendar.legend.success")}</span>
        </div>
        <div className="flex items-center gap-2">
          <X className="w-4 h-4 text-red-400" />
          <span>{t("calendar.legend.failed")}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-900/30 border border-yellow-500/30 rounded"></div>
          <span>{t("calendar.legend.makeup")}</span>
        </div>
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-400" />
          <span>{t("calendar.legend.journal")}</span>
        </div>
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-purple-400" />
          <span>{t("calendar.legend.video")}</span>
        </div>
      </div>

      {/* 操作说明 */}
      <div className="mt-4 text-xs text-gray-400 text-center space-y-1">
        <p>• {t("calendar.rules.today")}</p>
        <p>• {t("calendar.rules.recent")}</p>
        <p>• {t("calendar.rules.old")}</p>
        <p>• {t("calendar.rules.future")}</p>
      </div>
    </div>
  )
}

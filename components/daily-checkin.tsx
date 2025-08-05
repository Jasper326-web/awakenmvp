"use client"

import { useState, useEffect } from "react"
import { supabase, getCurrentUser } from "@/lib/supabaseClient"
import CalendarComponent from "./calendar-component"
import CheckinModal from "./checkin-modal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, TrendingUp, Award } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/lib/lang-context"
import AuthModal from './auth-modal'
import UpgradeModal from './upgrade-modal'
import { calculateSuccessRate } from "@/lib/streak-calculator"

interface CheckinData {
  [date: string]: {
    status: "success" | "failed" | "pending"
    hasJournal: boolean
    hasVideo: boolean
    journalContent?: string
    videoUrl?: string
  }
}

interface UserStats {
  maxStreak: number
  currentStreak: number
  successRate: number
  totalDays: number
}

export default function DailyCheckin() {
  const { t } = useLanguage()
  // 使用 UTC 时区获取当前日期
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [checkinData, setCheckinData] = useState<CheckinData>({})
  const [userStats, setUserStats] = useState<UserStats>({
    maxStreak: 0,
    currentStreak: 0,
    successRate: 0,
    totalDays: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [upgradeModalData, setUpgradeModalData] = useState({
    title: "",
    message: "",
    feature: ""
  })

  useEffect(() => {
    checkUser()
    loadCheckinData()

    // 监听升级弹窗事件
    const handleShowUpgradeModal = (event: CustomEvent) => {
      setUpgradeModalData({
        title: event.detail.title || "升级为会员",
        message: event.detail.message || "您本月的免费打卡次数已用完，升级为会员享受无限次打卡。",
        feature: event.detail.feature || ""
      })
      setUpgradeModalOpen(true)
    }

    window.addEventListener("showUpgradeModal", handleShowUpgradeModal as EventListener)

    return () => {
      window.removeEventListener("showUpgradeModal", handleShowUpgradeModal as EventListener)
    }
  }, [])

  const checkUser = async () => {
    console.log("[打卡页面] 开始检查用户状态...")
    const { user, session, error } = await getCurrentUser()

    if (error) {
      console.error("[打卡页面] 用户检查失败:", error)
      toast.error(t("common.userVerificationFailed"))
      return
    }

    if (!user) {
      console.log("[打卡页面] 用户未登录")
      return
    }

    console.log("[打卡页面] 用户已登录:", user.id)
    setUser(user)
    setSession(session)
  }

  const loadCheckinData = async () => {
    try {
      setIsLoading(true)
      console.log("[打卡页面] 开始加载打卡数据...")

      const { user } = await getCurrentUser()
      if (!user) {
        console.log("[打卡页面] 用户未登录，跳过数据加载")
        setIsLoading(false)
        return
      }

      // 获取用户打卡统计（与个人中心一致）
      const { data: userStatsData, error: userStatsError } = await supabase
        .from("users")
        .select("current_streak, max_streak, total_days")
        .eq("id", user.id)
        .single()

      if (userStatsError) {
        console.error("[打卡页面] 获取用户统计失败:", userStatsError)
        toast.error("加载统计失败: " + userStatsError.message)
        return
      }

      // 使用新的成功率计算函数
      const currentStreak = userStatsData.current_streak || 0
      const totalDays = userStatsData.total_days || 0
      const maxStreak = userStatsData.max_streak || 0
      
      // 使用新的加权阶段模型计算成功率
      const successRate = calculateSuccessRate(currentStreak)

      setUserStats({
        maxStreak,
        currentStreak,
        successRate,
        totalDays,
      })

      // 仍然加载checkinData用于日历等
      const { data: checkins, error } = await supabase
        .from("daily_checkins")
        .select("date, status, notes, video_url")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(90)

      if (error) {
        console.error("[打卡页面] 加载打卡数据失败:", error)
        toast.error(t("common.loadDataFailed") + ": " + error.message)
        return
      }

      // 转换数据格式
      const formattedData: CheckinData = {}
      checkins?.forEach((checkin: any) => {
        const status = checkin.status || "pending"
        formattedData[checkin.date] = {
          status,
          hasJournal: !!checkin.notes,
          hasVideo: !!checkin.video_url,
          journalContent: checkin.notes,
          videoUrl: checkin.video_url,
        }
      })
      setCheckinData(formattedData)
    } catch (error) {
      console.error("[打卡页面] 加载数据时出错:", error)
      toast.error(t("common.loadDataFailed"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setIsModalOpen(true)
  }

  const handleSaveCheckin = async (data: {
    status: "success" | "failed"
    journalContent?: string
    videoUrl?: string
  }) => {
    try {
      console.log("[打卡页面] 开始保存打卡数据:", data)

      // 检查用户是否登录
      const { user: currentUser, session: currentSession } = await getCurrentUser()

      if (!currentUser) {
        console.log("[打卡页面] 用户未登录，显示登录提示")
        setAuthModalOpen(true)
        return
      }

      console.log("[打卡页面] 确认用户ID:", currentUser.id)
      console.log("[打卡页面] 会话状态:", currentSession ? "有效" : "无效")

      const status = data.status

      // 计算新的统计数据
      const { data: existingCheckins } = await supabase
        .from("daily_checkins")
        .select("date, status, max_streak, total_days")
        .eq("user_id", currentUser.id)
        .order("date", { ascending: false })

      let newMaxStreak = 0
      const newTotalDays = (existingCheckins?.length || 0) + 1

      if (status === "success") {
        // 计算连续天数
        let currentStreak = 1
        const sortedDates =
          existingCheckins
            ?.filter((c: any) => c.status === "success")
            .map((c: any) => c.date)
            .sort()
            .reverse() || []

        const selectedDateObj = new Date(selectedDate)
        for (const dateStr of sortedDates) {
          const checkDate = new Date(dateStr)
          const dayDiff = Math.floor((selectedDateObj.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24))

          if (dayDiff === currentStreak) {
            currentStreak++
          } else {
            break
          }
        }

        newMaxStreak = Math.max(currentStreak, existingCheckins?.[0]?.max_streak || 0)
      } else {
        newMaxStreak = existingCheckins?.[0]?.max_streak || 0
      }

      const checkinRecord = {
        user_id: currentUser.id,
        date: selectedDate,
        status,
        notes: data.journalContent || null,
        video_url: data.videoUrl || null,
        max_streak: newMaxStreak,
        total_days: newTotalDays,
        updated_at: new Date().toISOString(),
      }

      console.log("[打卡页面] 准备保存的记录:", checkinRecord)

      const { data: savedData, error } = await supabase
        .from("daily_checkins")
        .upsert(checkinRecord, {
          onConflict: "user_id,date",
        })
        .select()

      if (error) {
        console.error("[打卡页面] 保存打卡失败:", error)
        toast.error(t("common.saveFailed") + ": " + error.message)
        return
      }

      console.log("[打卡页面] 打卡保存成功:", savedData)

      // 更新本地数据
      setCheckinData((prev: any) => ({
        ...prev,
        [selectedDate]: {
          status: data.status,
          hasJournal: !!data.journalContent,
          hasVideo: !!data.videoUrl,
          journalContent: data.journalContent,
          videoUrl: data.videoUrl,
        },
      }))

      toast.success(t("checkin.saveSuccess"))

      // 重新加载数据以更新统计
      loadCheckinData()
    } catch (error) {
      console.error("[打卡页面] 保存时出错:", error)
      toast.error(t("common.saveFailed") + ": " + String(error))
    }
  }

  const handleVideoSaved = (videoUrl: string) => {
    setCheckinData(prev => ({
      ...prev,
      [selectedDate]: {
        ...prev[selectedDate],
        hasVideo: true,
        videoUrl,
      }
    }))
  }

  const handleResetCheckin = (date: string) => {
    setCheckinData(prev => {
      const newData = { ...prev }
      delete newData[date]
      return newData
    })
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white border-t-transparent mx-auto mb-4"></div>
          <p>{t("checkin.loading")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6 relative">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{t("checkin.title")}</h1>
          <p className="text-gray-300">{t("checkin.subtitle")}</p>
        </div>



        {/* 统计卡片 - 未登录时显示占位数据 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gray-900/50 backdrop-blur-sm border-white/10">
            <CardContent className="p-4 relative">
              <div className="absolute right-4 top-4 text-3xl font-bold text-coral drop-shadow-lg select-none pointer-events-none">
                {user ? userStats.currentStreak : '--'}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-300 whitespace-pre-line">{t("checkin.currentStreak")}</div>
                <div className="text-xs text-gray-400 mt-1">{t("checkin.currentConsecutive")}</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 backdrop-blur-sm border-white/10">
            <CardContent className="p-4 relative">
              <div className="absolute right-4 top-4 text-3xl font-bold text-coral drop-shadow-lg select-none pointer-events-none">
                {user ? userStats.maxStreak : '--'}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-300 whitespace-pre-line">{t("checkin.maxStreak")}</div>
                <div className="text-xs text-gray-400 mt-1">{t("checkin.historicalBest")}</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 backdrop-blur-sm border-white/10">
            <CardContent className="p-4 relative">
              <div className="absolute right-4 top-4 text-3xl font-bold text-coral drop-shadow-lg select-none pointer-events-none">
                {user ? userStats.successRate + '%' : '--'}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-300">{t("checkin.successRate")}</div>
                <div className="text-xs text-gray-400 mt-1">{t("checkin.basedOnStreak")}</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 backdrop-blur-sm border-white/10">
            <CardContent className="p-4 relative">
              <div className="absolute right-4 top-4 text-3xl font-bold text-coral drop-shadow-lg select-none pointer-events-none">
                {user ? userStats.totalDays : '--'}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-300">{t("checkin.totalDays")}</div>
                <div className="text-xs text-gray-400 mt-1">{t("checkin.accumulatedRecord")}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 日历组件 - 允许未登录用户点击，但保存时提示登录 */}
        <div className="w-full">
          <CalendarComponent 
            selectedDate={selectedDate} 
            onDateSelect={handleDateSelect} 
            checkinData={user ? checkinData : {}} 
          />
        </div>

        {/* 打卡弹窗 - 未登录用户也可以打开，但保存时提示登录 */}
          <CheckinModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            selectedDate={selectedDate}
            existingData={checkinData[selectedDate]}
            onSave={handleSaveCheckin}
            userId={user?.id}
            onVideoSaved={handleVideoSaved}
            onReset={handleResetCheckin}
          isLoggedIn={!!user}
          />
      </div>
      {/* Auth Modal */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      
      {/* Upgrade Modal */}
      <UpgradeModal 
        open={upgradeModalOpen} 
        onOpenChange={setUpgradeModalOpen}
        title={upgradeModalData.title}
        message={upgradeModalData.message}
        feature={upgradeModalData.feature}
      />
    </div>
  )
}

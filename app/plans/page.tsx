"use client"

import React, { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Calendar,
  Target,
  Trophy,
  CheckCircle,
  BookOpen,
  Headphones,
  Video,
  FileText,
  Star,
  Flame,
  Sparkles,
  RefreshCw,
  Play,
  Pause,
  Volume2,
  Lock,
  Crown,
  Activity,
  Brain,
  Heart,
  Gift,
  Zap,
} from "lucide-react"
import { authService } from "@/lib/auth"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import { useSubscription } from "@/hooks/use-subscription"
import ReactMarkdown from 'react-markdown'
import { generateTasksByAddictionLevel } from "../../lib/plan-tasks"
import { CoralSeparator } from '@/components/ui/separator';
import { useLanguage } from '@/lib/lang-context'
import AuthModal from '@/components/auth-modal'

export default function PlansPage() {
  const router = useRouter()
  const { isPro, isPremium, isFree } = useSubscription()
  const { t, language } = useLanguage()
  const [authModalOpen, setAuthModalOpen] = useState(false)

  // 戒色计划阶段配置
  const PLAN_STAGES = {
    1: { name: t("plans.stage1"), days: t("plans.stage1_days"), color: "bg-blue-100 text-blue-800" },
    2: { name: t("plans.stage2"), days: t("plans.stage2_days"), color: "bg-green-100 text-green-800" },
    3: { name: t("plans.stage3"), days: t("plans.stage3_days"), color: "bg-purple-100 text-purple-800" },
    4: { name: t("plans.stage4"), days: t("plans.stage4_days"), color: "bg-gold-100 text-gold-800" },
  }

  const getStageByStreak = (streak: number) => {
    if (streak <= 20) return 1
    if (streak <= 59) return 2
    if (streak <= 179) return 3
    return 4
  }

  // 1. 紧急自救步骤内容
  const EMERGENCY_STEPS = [
    {
      title: t("plans.emergency.cold_water"),
      command: t("plans.emergency.cold_water_cmd"),
      reason: t("plans.emergency.cold_water_reason")
    },
    {
      title: t("plans.emergency.breathing"),
      command: t("plans.emergency.breathing_cmd"),
      reason: t("plans.emergency.breathing_reason")
    },
    {
      title: t("plans.emergency.pepper"),
      command: t("plans.emergency.pepper_cmd"),
      reason: t("plans.emergency.pepper_reason")
    },
    {
      title: t("plans.emergency.environment"),
      command: t("plans.emergency.environment_cmd"),
      reason: t("plans.emergency.environment_reason")
    },
    {
      title: t("plans.emergency.mantra"),
      command: t("plans.emergency.mantra_cmd"),
      reason: t("plans.emergency.mantra_reason")
    },
  ]

  // 音频资源列表
  const audioResources = [
    { id: 1, title: t("plans.audio.lesson1"), file: "/audio/1.mp3" },
    { id: 2, title: t("plans.audio.lesson2"), file: "/audio/2.mp3" },
    { id: 3, title: t("plans.audio.lesson3"), file: "/audio/3.mp3" },
  ]

  // 文章章节内容动态加载
  const articleChapters = [
    { title: t("plans.article.chapter1"), file: "/articles/1.md" },
    { title: t("plans.article.chapter2"), file: "/articles/2.md" },
    { title: t("plans.article.chapter3"), file: "/articles/3.md" },
    { title: t("plans.article.chapter4"), file: "/articles/4.md" },
    { title: t("plans.article.chapter5"), file: "/articles/5.md" },
    { title: t("plans.article.chapter6"), file: "/articles/6.md" },
  ]
  const [currentChapter, setCurrentChapter] = useState(0)
  const [chapterContent, setChapterContent] = useState<string>("")
  useEffect(() => {
    fetch(articleChapters[currentChapter].file)
      .then(res => res.text())
      .then(setChapterContent)
  }, [currentChapter])

  // 文章资源
  const articleResources = [
    { 
      id: 1, 
      title: t("plans.article.title"), 
      file: "重返光明.pdf",
      description: t("plans.article.desc")
    }
  ]

  // 咒语资源
  const mantraResources = [
    { 
      id: 1, 
      title: t("plans.mantra.title"), 
      file: "准提神咒.jpg",
      description: t("plans.mantra.desc")
    }
  ]

  // 咒语弹窗图片路径和英文注释
  const mantraImage = "/mantra/zhouyu.jpg"
  const mantraNote = t("plans.mantra.note")

  const [user, setUser] = useState<any>(null)
  const [userStats, setUserStats] = useState<any>(null)
  const [testData, setTestData] = useState<any>(null)
  const [todayTasks, setTodayTasks] = useState<any[]>([])
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // 弹窗状态
  const [audioModalOpen, setAudioModalOpen] = useState(false)
  const [pdfModalOpen, setPdfModalOpen] = useState(false)
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [instructionModalOpen, setInstructionModalOpen] = useState(false)
  const [currentInstruction, setCurrentInstruction] = useState("")

  // 紧急自救弹窗状态
  const [emergencyOpen, setEmergencyOpen] = useState(false)
  const [emergencyStep, setEmergencyStep] = useState(0)

  // 音频播放状态
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentAudio, setCurrentAudio] = useState<string>("")
  const [audioList, setAudioList] = useState<any[]>([])

  // 新增音频时长缓存
  const [audioDurations, setAudioDurations] = useState<{[file: string]: number}>({})

  // 格式化时间
  function formatDuration(sec: number) {
    if (!sec || isNaN(sec)) return "0:00"
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // 处理音频元数据加载
  const handleLoadedMetadata = () => {
    if (audioRef.current && currentAudio) {
      setAudioDurations(d => ({ ...d, [currentAudio]: audioRef.current!.duration }))
      setDuration(audioRef.current.duration)
    }
  }

  // 处理进度更新
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
  }

  useEffect(() => {
    loadUserData()
  }, [])

  // 只在 testData、t、language 变化时重新生成 todayTasks
  useEffect(() => {
    if (testData) {
      setTodayTasks(generateTasksByAddictionLevel(testData.addiction_level, t))
    }
  }, [testData, t, language])

  // 音频播放器引用
  const audioRef = useRef<HTMLAudioElement>(null)

  // 处理音频播放
  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current
      
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration)
      })
      
      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime)
      })
      
      audio.addEventListener('ended', () => {
        setIsPlaying(false)
        setCurrentTime(0)
      })
    }
  }, [])

  // 播放/暂停音频
  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  // 音频弹窗 setAudioSource 直接用 file 字段
  const setAudioSource = (fileName: string) => {
    if (audioRef.current) {
      audioRef.current.src = fileName
      audioRef.current.load()
      setCurrentAudio(fileName)
      setIsPlaying(false)
      setCurrentTime(0)
    }
  }

  // 拉取今日任务完成状态
  const loadCompletedTasks = async (userId: string, todayTasks: any[]) => {
    try {
      const today = new Date().toISOString().slice(0, 10)
      
      console.log("[loadCompletedTasks] 开始加载用户任务完成状态:", userId, today)
      
      // 从数据库获取今日已完成的任务
      const { data: completedTasksData, error } = await supabase
        .from("user_task_progress")
        .select("task_id, completed")
        .eq("user_id", userId)
        .eq("date", today)
        .eq("completed", true)

      if (error) {
        console.error("获取已完成任务失败:", error)
        return
      }

      console.log("[loadCompletedTasks] 数据库返回的已完成任务:", completedTasksData)

      // 将数据库中的已完成任务ID转换为Set
      const completedTaskIds = new Set<string>(completedTasksData.map((item: any) => String(item.task_id)))
      console.log("[loadCompletedTasks] 设置已完成任务集合:", Array.from(completedTaskIds))
      
      setCompletedTasks(completedTaskIds)
      
      // 同时保存到localStorage作为缓存
      localStorage.setItem('completedTasks', JSON.stringify(Array.from(completedTaskIds)))
    } catch (error) {
      console.error("加载已完成任务失败:", error)
    }
  }

  // 修改loadUserData，拉取完成状态
  const loadUserData = async () => {
    try {
      setLoading(true)
      const currentUser = await authService.getCurrentUser()
      if (!currentUser) {
        setUser(null)
        setLoading(false)
        return
      }

      setUser(currentUser)

      // 获取用户测试数据
      const { data: testDataResult, error: testError } = await supabase
        .from("addiction_tests")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (testDataResult) {
        setTestData(testDataResult)
        const tasks = generateTasksByAddictionLevel(testDataResult.addiction_level, t)
        setTodayTasks(tasks)
        await loadCompletedTasks(currentUser.id, tasks)
      }

      await loadUserStats(currentUser.id)
    } catch (error) {
      console.error("加载用户数据失败:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserStats = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("username, current_streak, level")
        .eq("id", userId)
        .single()

      if (error) {
        console.error("Failed to get user stats:", error)
        return
      }

      setUserStats(data)
    } catch (error) {
      console.error("Failed to load user stats:", error)
    }
  }

  // 修改handleTaskAction，完成任务时写入user_task_progress
  const handleTaskAction = async (task: any) => {
    // 检查任务权限
    if (!task.isFree && isFree) {
      setShowUpgradeModal(true)
      return
    }

    // 如果任务已经完成，直接返回
    if (completedTasks.has(task.id)) {
      console.log("[handleTaskAction] 任务已完成，跳过:", task.id)
      return
    }

    console.log("[handleTaskAction] 开始处理任务:", task.id)

    switch (task.action) {
      case "redirect":
        router.push(task.target)
        break
      case "modal":
        if (task.modalType === "audio") {
          setAudioModalOpen(true)
        } else if (task.modalType === "pdf") {
          setPdfModalOpen(true)
        } else if (task.modalType === "image") {
          setImageModalOpen(true)
        }
        break
      case "instruction":
        setCurrentInstruction(task.instruction)
        setInstructionModalOpen(true)
        break
      default:
        break
    }

    // 标记任务为已完成并写入数据库
    try {
      const today = new Date().toISOString().slice(0, 10)
      
      console.log("[handleTaskAction] 写入数据库:", {
        user_id: user.id,
        task_id: task.id,
        date: today
      })
      
      // 写入数据库
      const { error } = await supabase.from("user_task_progress").upsert({
        user_id: user.id,
        task_id: task.id, // 使用字符串类型的task.id
        date: today,
        completed: true,
        completed_at: new Date().toISOString(),
      }, { onConflict: ["user_id", "task_id", "date"] })

      if (error) {
        console.error("保存任务完成状态失败:", error)
        return
      }

      console.log("[handleTaskAction] 数据库写入成功，更新前端状态")

      // 更新前端状态
      setCompletedTasks(prev => {
        const newSet = new Set([...prev, task.id])
        localStorage.setItem('completedTasks', JSON.stringify(Array.from(newSet)))
        return newSet
      })
    } catch (error) {
      console.error("保存任务完成状态失败:", error)
    }
  }

  const toggleTaskCompletion = async (taskId: string) => {
    try {
      const today = new Date().toISOString().slice(0, 10)
      const isCurrentlyCompleted = completedTasks.has(taskId)

      console.log("[toggleTaskCompletion] 切换任务状态:", {
        taskId,
        isCurrentlyCompleted,
        today
      })

      if (isCurrentlyCompleted) {
        // 取消任务完成状态
        console.log("[toggleTaskCompletion] 取消任务完成状态")
        const { error } = await supabase
          .from("user_task_progress")
          .delete()
          .eq("user_id", user.id)
          .eq("task_id", taskId)
          .eq("date", today)

        if (error) {
          console.error("取消任务完成状态失败:", error)
          return
        }
        console.log("[toggleTaskCompletion] 数据库删除成功")
      } else {
        // 标记任务为已完成
        console.log("[toggleTaskCompletion] 标记任务为已完成")
        const { error } = await supabase.from("user_task_progress").upsert({
          user_id: user.id,
          task_id: taskId, // 使用字符串类型的taskId
          date: today,
          completed: true,
          completed_at: new Date().toISOString(),
        }, { onConflict: ["user_id", "task_id", "date"] })

        if (error) {
          console.error("保存任务完成状态失败:", error)
          return
        }
        console.log("[toggleTaskCompletion] 数据库写入成功")
      }

      // 更新前端状态
      setCompletedTasks((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(taskId)) {
          newSet.delete(taskId)
          console.log("[toggleTaskCompletion] 从前端状态中移除任务:", taskId)
        } else {
          newSet.add(taskId)
          console.log("[toggleTaskCompletion] 向前端状态中添加任务:", taskId)
        }
        localStorage.setItem('completedTasks', JSON.stringify(Array.from(newSet)))
        return newSet
      })
    } catch (error) {
      console.error("切换任务完成状态失败:", error)
    }
  }

  // 检查任务是否已完成
  const isTaskCompleted = (taskId: string) => {
    return completedTasks.has(taskId)
  }

  // 获取今日已完成任务数量
  const completedCount = completedTasks.size

  // 获取免费任务和付费任务
  const freeTasks = todayTasks.filter(task => task.isFree)
  const premiumTasks = todayTasks.filter(task => !task.isFree)
  const totalTasks = todayTasks.length

  // 在 useLanguage 解构后添加 addictionLevelText 变量
  const addictionLevelText = (() => {
    if (!testData?.addiction_level) return "-"
    const val = testData.addiction_level.toLowerCase()
    if (val.includes("轻度") || val.includes("mild")) return t("plans.level.mild")
    if (val.includes("中度") || val.includes("moderate")) return t("plans.level.moderate")
    if (val.includes("重度") || val.includes("severe")) return t("plans.level.severe")
    return testData.addiction_level
  })()

  // 未登录状态友好展示
  const NotLoggedInBanner = () => (
    <div className="w-full flex flex-col items-center justify-center py-8">
      <div className="text-lg text-gray-200 mb-4 font-semibold">{t("common.pleaseLoginToUse")}</div>
      <button
        className="px-6 py-2 rounded bg-coral text-white font-bold hover:bg-coral/90 transition"
        onClick={() => setAuthModalOpen(true)}
      >
        {t("common.loginButton")}
      </button>
    </div>
  )

  // 未完成测试友好展示
  const NoTestBanner = () => (
    <div className="w-full flex flex-col items-center justify-center py-8">
      <div className="text-lg text-gray-200 mb-4 font-semibold">{t("common.pleaseCompleteTest")}</div>
      <button
        className="px-6 py-2 rounded bg-coral text-white font-bold hover:bg-coral/90 transition"
        onClick={() => router.push("/test")}
      >
        {t("common.takeTest")}
      </button>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  const currentStage = getStageByStreak(userStats?.current_streak || 0)
  const stageInfo = PLAN_STAGES[currentStage]
  const progressPercentage = Math.min(((userStats?.current_streak || 0) / 180) * 100, 100)

  const ICON_MAP = { Calendar, FileText, Video, Headphones, BookOpen, Sparkles, Brain, Heart, Activity }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* 未登录提示 */}
        {!user && <NotLoggedInBanner />}
        
        {/* 未完成测试提示 */}
        {user && !testData && <NoTestBanner />}

        {/* 测试结果概览 - 未登录时禁用 */}
        {user && testData && (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center">
                  <Target className="w-6 h-6 mr-2" />
                  {t("plans.overview_title")}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/30 text-white bg-transparent hover:bg-white/10"
                  onClick={() => router.push("/test")}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {t("plans.retest")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-2">{testData?.test_score || 0}/80</div>
                  <p className="text-gray-300">{t("plans.test_score")}</p>
                </div>
                <div className="text-center">
                  <Badge className="text-lg px-4 py-2 bg-orange-900/50 text-orange-200 border border-orange-500/50">
                    {addictionLevelText}
                  </Badge>
                  <p className="text-gray-300 mt-2">{t("plans.addiction_level")}</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">{totalTasks}</div>
                  <p className="text-gray-300">{t("plans.daily_tasks")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 用户状态卡片 - 未登录时显示占位符 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-5 w-5" />
                {t("plans.current_streak")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                {user ? (userStats?.current_streak || 0) : '--'} {t("plans.days")}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Star className="h-5 w-5" />
                {t("plans.current_level")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                {user ? (userStats?.level || 1) : '--'}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5" />
                {t("plans.todays_progress")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                {user ? `${completedCount}/${totalTasks}` : '--'}
              </div>
              {user && (
                <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0}%` }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 任务区域 - 未登录时显示前两个任务，其余用遮罩 */}
        {user && testData && (
          <>
            {/* 免费任务 */}
            <Card className="bg-purple-100/20 backdrop-blur-sm border-purple-300/30 text-white mb-6">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <CheckCircle className="w-6 h-6 mr-2 text-green-400" />
                  {t("plans.free_tasks")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {freeTasks.map((task, index) => (
                    <div key={task.id} className="flex flex-col p-4 bg-purple-200/10 rounded-lg border border-purple-300/20">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                          {React.createElement(ICON_MAP[task.icon as keyof typeof ICON_MAP], { className: "w-4 h-4 text-white" })}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-white">{task.title.replace(/\{count\}/g, '')}</h3>
                          <p className="text-sm text-purple-200">{task.description}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className={`w-full ${
                          isTaskCompleted(task.id) 
                            ? "bg-green-600 hover:bg-green-700 text-white" 
                            : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                        }`}
                        onClick={() => {
                          if (isTaskCompleted(task.id)) {
                            // 如果任务已完成，点击取消完成状态
                            toggleTaskCompletion(task.id)
                          } else {
                            // 如果任务未完成，点击执行任务并标记为完成
                            handleTaskAction(task)
                          }
                        }}
                      >
                        {isTaskCompleted(task.id) ? t("task.completed") : t("task.start")}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 会员任务 */}
            <Card className="bg-purple-100/20 backdrop-blur-sm border-purple-300/30 text-white mb-6">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Crown className="w-6 h-6 mr-2 text-yellow-400" />
                  {t("plans.premium_tasks")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {premiumTasks.slice(0, 2).map((task, index) => (
                    <div key={task.id} className="flex flex-col p-4 bg-purple-200/10 rounded-lg border border-purple-300/20">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                          {React.createElement(ICON_MAP[task.icon as keyof typeof ICON_MAP], { className: "w-4 h-4 text-white" })}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-white">{task.title.replace(/\{count\}/g, '')}</h3>
                          <p className="text-sm text-purple-200">{task.description}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className={`w-full ${
                          isTaskCompleted(task.id) 
                            ? "bg-yellow-600 hover:bg-yellow-700 text-white" 
                            : "bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white"
                        }`}
                        onClick={() => {
                          if (isTaskCompleted(task.id)) {
                            // 如果任务已完成，点击取消完成状态
                            toggleTaskCompletion(task.id)
                          } else {
                            // 如果任务未完成，点击执行任务并标记为完成
                            handleTaskAction(task)
                          }
                        }}
                      >
                        {isTaskCompleted(task.id) ? t("task.completed") : t("task.start")}
                      </Button>
                    </div>
                  ))}
                  {premiumTasks.length > 2 && !isPremium && (
                    <div className="relative p-4 bg-purple-200/10 rounded-lg border border-purple-300/20">
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                        <div className="text-center">
                          <div className="text-white text-lg mb-2">{t("common.pleaseLoginToUse")}</div>
                          <button
                            className="px-4 py-2 rounded bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-medium hover:from-yellow-700 hover:to-orange-700 transition"
                            onClick={() => setAuthModalOpen(true)}
                          >
                            {t("common.loginButton")}
                          </button>
                        </div>
                      </div>
                      <div className="opacity-50">
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                              <Lock className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-white">{t("plans.premium_tasks")}</h3>
                              <p className="text-sm text-purple-200">{t("plans.unlock_more_tasks")}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* 会员用户可以看到所有任务 */}
                  {isPremium && premiumTasks.slice(2).map((task, index) => (
                    <div key={task.id} className="flex flex-col p-4 bg-purple-200/10 rounded-lg border border-purple-300/20">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                          {React.createElement(ICON_MAP[task.icon as keyof typeof ICON_MAP], { className: "w-4 h-4 text-white" })}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-white">{task.title.replace(/\{count\}/g, '')}</h3>
                          <p className="text-sm text-purple-200">{task.description}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className={`w-full ${
                          isTaskCompleted(task.id) 
                            ? "bg-yellow-600 hover:bg-yellow-700 text-white" 
                            : "bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white"
                        }`}
                        onClick={() => {
                          if (isTaskCompleted(task.id)) {
                            // 如果任务已完成，点击取消完成状态
                            toggleTaskCompletion(task.id)
                          } else {
                            // 如果任务未完成，点击执行任务并标记为完成
                            handleTaskAction(task)
                          }
                        }}
                      >
                        {isTaskCompleted(task.id) ? t("task.completed") : t("task.start")}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* 未登录时显示占位任务 */}
        {!user && (
          <div className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <CheckCircle className="w-6 h-6 mr-2" />
                  {t("plans.sample_tasks")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 opacity-50">
                  {[1, 2].map((index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-white">{t("plans.sample_task")} {index}</h3>
                          <p className="text-sm text-gray-300">{t("plans.sample_task_desc")}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white/30 text-white bg-transparent"
                        disabled
                      >
                        {t("plans.sample_button")}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 会员专享功能区域 */}
        <Card className="mb-8 bg-white/10 backdrop-blur-sm border-white/20 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-400" />
              {t("plans.premium_features")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">{t("plans.personalized_guidance")}</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• {t("plans.customized_plan")}</li>
                  <li>• {t("plans.ai_analysis")}</li>
                  <li>• {t("plans.online_counseling")}</li>
                  <li>• {t("plans.progress_tracking")}</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">{t("plans.advanced_tools")}</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• {t("plans.meditation_audio")}</li>
                  <li>• {t("plans.nofap_books")}</li>
                  <li>• {t("plans.emergency_help")}</li>
                  <li>• {t("plans.community_vip")}</li>
                </ul>
              </div>
            </div>

            {isFree && (
              <div className="mt-6 text-center">
                <Button
                  onClick={() => router.push("/pricing")}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  {t("plans.upgrade_to_premium")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 升级提示弹窗 */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="bg-gradient-to-br from-slate-800 to-purple-900 border border-purple-700/50 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              {t("plans.upgrade_to_premium_title")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-white/10 rounded-lg p-4">
              <h4 className="font-medium mb-2 text-yellow-300">{t("plans.premium_exclusive_features")}</h4>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>• {t("plans.professional_nofap_audio")}</li>
                <li>• {t("plans.nofap_knowledge_article")}</li>
                <li>• {t("plans.video_checkin")}</li>
                <li>• {t("plans.personalized_nofap_plan")}</li>
                <li>• {t("plans.ai_analysis")}</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => router.push("/pricing")}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
              >
                <Crown className="w-4 h-4 mr-2" />
                {t("plans.upgrade_now")}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowUpgradeModal(false)}
                className="border-white/30 text-white bg-transparent hover:bg-white/10"
              >
                {t("plans.maybe_later")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 音频播放弹窗 */}
      <Dialog open={audioModalOpen} onOpenChange={setAudioModalOpen}>
        <DialogContent className="bg-gradient-to-br from-slate-800 to-purple-900 border border-purple-700/50 text-white max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Headphones className="w-5 h-5" />
              {t("plans.nofap_audio_library")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* 音频列表 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {audioResources.map((audio) => (
                <div
                  key={audio.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    currentAudio === audio.file
                      ? "bg-blue-500/20 border-blue-400/50"
                      : "bg-white/5 border-white/20 hover:bg-white/10"
                  }`}
                  onClick={() => setCurrentAudio(audio.file)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">{audio.title}</h4>
                    <span className="text-sm text-gray-400">
                      {audioDurations[audio.file] ? formatDuration(audioDurations[audio.file]) : "0:00"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (currentAudio === audio.file) {
                          toggleAudio()
                        } else {
                          setAudioSource(audio.file)
                          setTimeout(() => toggleAudio(), 100)
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {currentAudio === audio.file && isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <span className="text-sm text-gray-300">{t("plans.click_to_play")}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 当前播放器 */}
            {currentAudio && (
              <div className="bg-white/10 rounded-lg p-4">
                <h4 className="font-medium mb-3 text-blue-300">
                  {t("plans.playing")}: {audioResources.find(a => a.file === currentAudio)?.title}
                </h4>
                <div className="flex items-center gap-4">
                  <Button
                    size="sm"
                    onClick={toggleAudio}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <div className="flex-1">
                    <div className="bg-white/20 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <Volume2 className="w-4 h-4" />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{formatDuration(currentTime)}</span>
                  <span>{formatDuration(duration)}</span>
                </div>
              </div>
            )}

            <div className="text-sm text-gray-300">
              <p>{t("plans.professional_nofap_audio_desc")}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF阅读弹窗改为章节选择和内容展示 */}
      <Dialog open={pdfModalOpen} onOpenChange={setPdfModalOpen}>
        <DialogContent className="bg-gradient-to-br from-slate-800 to-purple-900 border border-purple-700/50 text-white max-w-5xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {t("plans.nofap_article_library")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* 章节选择 */}
            <div className="flex flex-wrap gap-2 mb-4">
              {articleChapters.map((chapter, idx) => (
                <Button
                  key={chapter.title}
                  size="sm"
                  className={`rounded ${idx === currentChapter ? "bg-blue-600 text-white" : "bg-white/10 text-blue-200"}`}
                  onClick={() => setCurrentChapter(idx)}
                >
                  {chapter.title}
                </Button>
              ))}
            </div>
            {/* 章节内容 */}
            <div className="bg-white/10 rounded-lg p-6 whitespace-pre-line text-gray-100 text-base leading-relaxed max-h-[60vh] overflow-y-auto">
              <ReactMarkdown>{chapterContent}</ReactMarkdown>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 咒语弹窗 */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="bg-gradient-to-br from-slate-800 to-purple-900 border border-purple-700/50 text-white max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              {t("plans.mantra_practice")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {mantraResources.map((mantra) => (
              <div key={mantra.id} className="space-y-4">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-yellow-400 mb-2">{mantra.title}</h3>
                  <p className="text-gray-300 text-sm mb-4">{mantra.description}</p>
                </div>
                {/* 咒语图片和英文注释 */}
                <div className="flex justify-center">
                  <div className="bg-white/10 rounded-lg p-4 max-w-md">
                    <img
                      src={mantraImage}
                      alt="Zhunti Mantra with Pinyin"
                      style={{ maxWidth: '100%', height: 'auto', margin: '0 auto', display: 'block' }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const next = e.currentTarget.nextElementSibling as HTMLElement;
                        if (next) next.style.display = 'block';
                      }}
                    />
                    <div className="hidden text-center text-gray-400 py-8">
                      <Sparkles className="w-12 h-12 mx-auto mb-2" />
                      <p>{t("plans.zhunti_mantra_image")}</p>
                    </div>
                    <p className="text-center text-gray-400 mt-2 text-sm">{mantraNote}</p>
                  </div>
                </div>
                {/* 念诵方法保留 */}
                <div className="bg-white/10 rounded-lg p-6">
                  <h4 className="font-semibold text-white mb-3 text-center">{t("plans.chanting_method")}</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• {t("plans.find_quiet_place")}</li>
                    <li>• {t("plans.fold_hands")}</li>
                    <li>• {t("plans.chant_7_or_21_times")}</li>
                    <li>• {t("plans.chant_while_visualizing_master_zhunti_compassionate_light")}</li>
                    <li>• {t("plans.pray_for_mind_purification_and_willpower_strengthening")}</li>
                  </ul>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-300 mb-4">
                    {t("plans.devote_yourself_to_chanting_zhunti_mantra_with_sincerity")}
                    {t("plans.it_is_recommended_to_chant_once_in_the_morning_and_once_in_the_evening_every_day")}
                    {t("plans.with_perseverance")}
                  </p>
                  <Button
                    onClick={() => {
                      setCompletedTasks((prev) => new Set([...prev, "mantra"]))
                      setImageModalOpen(false)
                    }}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {t("plans.mark_as_completed")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* 指导说明弹窗 */}
      <Dialog open={instructionModalOpen} onOpenChange={setInstructionModalOpen}>
        <DialogContent className="bg-gradient-to-br from-slate-800 to-purple-900 border border-purple-700/50 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              {t("plans.task_instructions")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-gray-300 leading-relaxed">{currentInstruction}</p>
            </div>
            <Button
              onClick={() => {
                setInstructionModalOpen(false)
              }}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {t("plans.i_understand")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 紧急自救弹窗 */}
      <Dialog open={emergencyOpen} onOpenChange={setEmergencyOpen}>
        <DialogContent className="bg-gradient-to-br from-black to-gray-900 border border-red-700/50 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400 text-2xl font-bold">
              ⚠️ {t("plans.emergency_self_help")} ({EMERGENCY_STEPS[emergencyStep]?.title || t("plans.end")})
            </DialogTitle>
          </DialogHeader>
          {emergencyStep < EMERGENCY_STEPS.length ? (
            <div className="space-y-6">
              <div className="text-xl font-bold text-red-300">{EMERGENCY_STEPS[emergencyStep].command}</div>
              <div className="text-base text-gray-300">{EMERGENCY_STEPS[emergencyStep].reason}</div>
              <Button
                className="w-full bg-red-500 hover:bg-red-600 text-white text-lg font-bold py-3"
                onClick={() => setEmergencyStep(emergencyStep + 1)}
              >
                {t("plans.completed_next_step")}
              </Button>
              <div className="text-xs text-gray-500 text-center pt-2">{t("plans.cannot_skip_step")}</div>
            </div>
          ) : (
            <div className="space-y-6 text-center">
              <div className="text-2xl font-bold text-green-400">{t("plans.successfully_interrupted_impulse")}</div>
              <div className="text-base text-gray-300">{t("plans.please_start_a_positive_task")}</div>
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white text-lg font-bold py-3"
                onClick={() => setEmergencyOpen(false)}
              >
                {t("plans.close_modal")}
              </Button>
              <div className="pt-4">
                <Button
                  variant="outline"
                  className="w-full border-red-400 text-red-300"
                  onClick={() => {
                    setEmergencyStep(0)
                    setEmergencyOpen(false)
                    setTimeout(() => setEmergencyOpen(true), 200)
                  }}
                >
                  {t("plans.still_cannot_control_myself")}
                </Button>
                <div className="text-xs text-gray-400 mt-2">{t("plans.if_still_unable_to_control_yourself")}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 隐藏的音频播放器 */}
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
      {/* Auth Modal */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  )
}

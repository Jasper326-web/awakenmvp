"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Target, TestTube, Sparkles, RefreshCw, Flame, Users, Calendar, FileText, Video, Headphones, BookOpen, Brain, Heart, Activity, UserIcon, CheckCircle, Trophy } from "lucide-react"
import { authService } from "@/lib/auth"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import FeedbackSection from "@/components/feedback-section"
import AuthModal from "@/components/auth-modal"
import DailyPushSection from "@/components/daily-push-section"
import { generateTasksByAddictionLevel } from "../lib/plan-tasks"
import { CoralButton } from '@/components/ui/button';
import { CoralSeparator } from '@/components/ui/separator';
import { useLanguage } from '@/lib/lang-context'
import SolidFlame from "@/components/solid-flame";

const ICON_MAP = { Calendar, FileText, Video, Headphones, BookOpen, Sparkles, Brain, Heart, Activity }

export default function HomePage() {
  const router = useRouter()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [testData, setTestData] = useState<any>(null)
  const [subscriptionData, setSubscriptionData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()

  const loadUserData = async () => {
    try {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)

      if (currentUser) {
        await Promise.all([loadTestData(currentUser.id), loadSubscriptionData(currentUser.id)])
      }
    } catch (error) {
      console.error("加载用户数据失败:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUserData()

    // 监听认证状态变化
    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        const currentUser = await authService.getCurrentUser()
        setUser(currentUser)
        if (currentUser) {
          await Promise.all([loadTestData(currentUser.id), loadSubscriptionData(currentUser.id)])
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setTestData(null)
        setSubscriptionData(null)
      }
    })

    // 监听打开登录弹窗事件
    const handleOpenAuthModal = () => {
      setAuthModalOpen(true)
    }
    
    window.addEventListener('openAuthModal', handleOpenAuthModal)
    
    return () => {
      subscription.unsubscribe()
      window.removeEventListener('openAuthModal', handleOpenAuthModal)
    }
  }, [])

  const loadTestData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("addiction_tests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)

      if (data && data.length > 0) {
        setTestData(data[0])
      }
    } catch (error) {
      console.error("加载测试数据异常:", error)
    }
  }

  const loadSubscriptionData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .single()

      if (data && !error) {
        setSubscriptionData(data)
      }
    } catch (error) {
      console.error("加载订阅数据异常:", error)
    }
  }

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById("features-section")
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  // 未登录用户或登录但未完成测试的用户显示完整的营销首页
  if (!user || !testData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Hero Section 重构 */}
        <section className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
          {/* 主标题+火焰 */}
          <div className="flex items-center justify-center mb-4">
            <h1 className="text-6xl md:text-7xl font-extrabold bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent leading-tight tracking-wide">
              Awaken
            </h1>
          </div>
          {/* Hero Section 文案（中英文分支） */}
          {t("lang") === 'zh' ? (
            <div className="max-w-2xl mx-auto text-center mb-8 space-y-1">
              <div className="text-lg md:text-xl font-semibold text-white">{t("home.hero_slogan")}</div>
              <div className="text-2xl md:text-3xl font-bold text-white">{t("home.hero_value1")}</div>
              <div className="text-base md:text-xl font-medium text-orange-200">{t("home.hero_value2")}</div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-lg md:text-2xl font-semibold text-white/90">{t("home.hero_line1")}</span>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                <span className="bg-gradient-to-r from-orange-400 via-orange-300 to-yellow-300 bg-clip-text text-transparent">{t("home.hero_line2")}</span>
              </div>
              <div className="text-base md:text-xl font-medium text-gray-200">{t("home.hero_line3")}</div>
            </div>
          )}
          {/* 标签 - 多彩风格 */}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <div className="bg-blue-600/15 border border-blue-600/25 rounded-full px-3 py-1.5">
              <span className="text-blue-400 text-xs font-medium">{t("home.tag_video_checkin")}</span>
            </div>
            <div className="bg-purple-600/15 border border-purple-600/25 rounded-full px-3 py-1.5">
              <span className="text-purple-400 text-xs font-medium">{t("home.tag_free_use")}</span>
            </div>
            <div className="bg-yellow-600/15 border border-yellow-600/25 rounded-full px-3 py-1.5">
              <span className="text-yellow-400 text-xs font-medium">{t("home.tag_buddhist")}</span>
            </div>
            <div className="bg-red-600/15 border border-red-600/25 rounded-full px-3 py-1.5">
              <span className="text-red-400 text-xs font-medium">{t("home.tag_gpt")}</span>
            </div>
          </div>
        </section>

        {/* 登录引导区 */}
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-2xl p-8 backdrop-blur-sm">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  {t("home.login_guide_title")}
                </h2>
              </div>
              <div className="flex justify-center">
                <Button
                  size="lg"
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                  onClick={() => router.push("/addiction-test")}
                >
                  <Target className="w-5 h-5 mr-2" />
                  {t("home.start_test_button")}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* 特别活动专区 - 30天打卡挑战 */}
        <section className="container mx-auto px-4 py-16">
          <div className="relative overflow-hidden">
            {/* 背景装饰 */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-orange-600/20 rounded-3xl"></div>
            <div className="absolute top-0 left-1/4 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-pink-400/10 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-blue-400/10 rounded-full blur-2xl"></div>
            
            {/* 主要内容 */}
            <div className="relative bg-gradient-to-br from-slate-900/90 via-purple-900/90 to-slate-900/90 backdrop-blur-sm border border-purple-500/30 rounded-3xl p-8 md:p-12">
              {/* 活动标签 */}
              <div className="flex justify-center mb-6">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-yellow-900 px-4 py-2 rounded-full text-sm font-bold animate-pulse">
                  <Flame className="w-4 h-4" />
                  🔥 {t("challenge.limited_event")}
                </div>
              </div>
              
              {/* 主标题 */}
              <div className="text-center mb-8">
                <h2 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text text-transparent mb-4">
                  {t("challenge.title")}
                </h2>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                  {t("challenge.subtitle")}
                </p>
              </div>
              
              {/* 挑战数据 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400 mb-2">30</div>
                  <p className="text-gray-400">{t("challenge.days")}</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">50K+</div>
                  <p className="text-gray-400">{t("challenge.participants")}</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-2">85%</div>
                  <p className="text-gray-400">{t("challenge.success_rate")}</p>
                </div>
              </div>
              
              {/* 挑战特色 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{t("challenge.daily_checkin_title")}</h3>
                    <p className="text-gray-400 text-sm">{t("challenge.daily_checkin_desc")}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{t("challenge.community_title")}</h3>
                    <p className="text-gray-400 text-sm">{t("challenge.community_desc")}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{t("challenge.achievement_title")}</h3>
                    <p className="text-gray-400 text-sm">{t("challenge.achievement_desc")}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{t("challenge.ai_guidance_title")}</h3>
                    <p className="text-gray-400 text-sm">{t("challenge.ai_guidance_desc")}</p>
                  </div>
                </div>
              </div>
              
              {/* 行动按钮 */}
              <div className="text-center">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-yellow-900 font-bold px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  onClick={() => router.push("/checkin")}
                >
                  <Flame className="w-6 h-6 mr-2" />
                  {t("challenge.start_button")}
                </Button>
                <p className="text-gray-400 text-sm mt-4">
                  {t("challenge.reward_note")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 功能展示区 */}
        <section id="features-section" className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t("home.features_title")}</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">{t("home.features_subtitle")}</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mx-auto">
                  <Flame className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">{t("home.feature_daily_checkin_title")}</h3>
                <p className="text-gray-400 text-sm">
                  {t("home.feature_daily_checkin_desc")}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">{t("home.feature_test_title")}</h3>
                <p className="text-gray-400 text-sm">
                  {t("home.feature_test_desc")}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">{t("home.feature_plans_title")}</h3>
                <p className="text-gray-400 text-sm">
                  {t("home.feature_plans_desc")}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">{t("home.feature_leaderboard_title")}</h3>
                <p className="text-gray-400 text-sm">
                  {t("home.feature_leaderboard_desc")}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <FeedbackSection />

        <footer className="container mx-auto px-4 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-black font-bold text-sm">A</span>
                </div>
                <span className="text-xl font-bold text-white">{t("home.awaken_title")}</span>
              </div>
              <p className="text-gray-400 text-sm max-w-md">{t("home.about_desc")}</p>
            </div>

            <div className="space-y-4">
              <h4 className="text-white font-medium">{t("footer.about")}</h4>
              <div className="space-y-2">
                <button
                  onClick={scrollToFeatures}
                  className="block text-gray-400 hover:text-white text-sm transition-colors text-left"
                >
                  {t("footer.features")}
                </button>
                <a href="/pricing" className="block text-gray-400 hover:text-white text-sm transition-colors">
                  {t("footer.pricing")}
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-white font-medium">{t("footer.tools")}</h4>
              <div className="space-y-2">
                <a href="/test" className="block text-gray-400 hover:text-white text-sm transition-colors">
                  {t("footer.test")}
                </a>
                <a href="/checkin" className="block text-gray-400 hover:text-white text-sm transition-colors">
                  {t("footer.checkin")}
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">{t("home.copyright")}</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <PrivacyPolicyModal />
            </div>
          </div>
        </footer>

        <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      </div>
    )
  }

  // 登录且完成测试的用户显示简化版首页
  const isVipUser = subscriptionData?.status === 'active'

  // 在登录且完成测试的用户分支，动态计算每日任务数量
  const todayTasks = testData ? generateTasksByAddictionLevel(testData.addiction_level) : []

  // 在 Dependency Level 渲染处，使用如下映射：
  const dependencyLevelText = (() => {
    if (!testData?.addiction_level) return "-"
    const val = testData.addiction_level.toLowerCase()
    if (val.includes("轻度") || val.includes("mild")) return t("plans.level.mild")
    if (val.includes("中度") || val.includes("moderate")) return t("plans.level.moderate")
    if (val.includes("重度") || val.includes("severe")) return t("plans.level.severe")
    return testData.addiction_level
  })()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 英雄区 - 登录用户版本 */}
      <section className="container mx-auto px-4 pt-28 pb-20 flex flex-col items-center justify-center text-center">
        {/* 主标题 */}
        <h1 className="text-5xl md:text-6xl font-extrabold text-gradient-coral tracking-wide mb-4 drop-shadow-lg">
          Awaken
        </h1>
        {/* 副标题 */}
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
          {t("home.world_first")}
          <span className="font-extrabold text-yellow-300 drop-shadow-sm mx-1">{t("home.buddhist")}</span>
          {t("home.nofap_site")}
        </h2>
        {/* 描述 */}
        <div className="text-lg md:text-xl font-medium text-yellow-200 mb-4">
          {t("home.traditional_method")}
        </div>
        {/* 口号 */}
        <div className="text-lg md:text-xl font-semibold text-white mb-2">
          <span className="mr-2">✨</span>
          {t("home.awaken_slogan")}
          <span className="ml-2">✨</span>
        </div>
      </section>

      {/* 测试结果概览 */}
      <section className="container mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-900 rounded-xl p-8 mb-8 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="text-2xl font-bold text-white flex items-center">
              <Target className="w-7 h-7 mr-2 text-yellow-300" />
              {t("home.test_overview_title")}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 font-bold rounded-full px-6 py-2 border-0 shadow-none hover:from-yellow-500 hover:to-yellow-600 hover:text-yellow-100 transition"
              onClick={() => router.push("/test")}
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              {t("home.retest_button")}
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="text-3xl font-extrabold text-yellow-300 mb-2">{testData.test_score}/80</div>
              <p className="text-white/80">{t("home.test_score")}</p>
            </div>
            <div className="text-center">
              <span className="inline-block text-lg px-4 py-2 bg-yellow-500/20 text-yellow-200 font-bold rounded-full mb-2">
                {dependencyLevelText}
              </span>
              <p className="text-white/80 mt-2">{t("home.dependency_level")}</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold text-green-300 mb-2">{todayTasks.length}</div>
              <p className="text-white/80">{t("home.daily_tasks")}</p>
            </div>
          </div>
          {/* 会员提示或计划入口（合并进卡片内部） */}
          <div className="text-center">
            {isVipUser ? (
              <>
                <div className="text-2xl font-bold text-white mb-4">{t("home.start_exclusive_plan")}</div>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 font-bold rounded-full px-8 py-3 text-lg shadow-none hover:from-yellow-500 hover:to-yellow-600 hover:text-yellow-100 transition"
                  onClick={() => router.push("/plans")}
                >
                  {t("home.enter_nofap_plan")}
                </Button>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-white mb-2">{t("home.join_premium_suggestion")}</div>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 font-bold rounded-full px-8 py-3 text-lg shadow-none hover:from-yellow-500 hover:to-yellow-600 hover:text-yellow-100 transition"
                  onClick={() => router.push("/pricing")}
                >
                  {t("home.learn_membership_details")}
                </Button>
              </>
            )}
          </div>
        </div>
        {/* 每日推送 */}
        <DailyPushSection />
      </section>

      {/* 特别活动专区 - 30天打卡挑战 */}
      <section className="container mx-auto px-4 py-16">
        <div className="relative overflow-hidden">
          {/* 背景装饰 */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-orange-600/20 rounded-3xl"></div>
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-pink-400/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-blue-400/10 rounded-full blur-2xl"></div>
          
          {/* 主要内容 */}
          <div className="relative bg-gradient-to-br from-slate-900/90 via-purple-900/90 to-slate-900/90 backdrop-blur-sm border border-purple-500/30 rounded-3xl p-8 md:p-12">
            {/* 活动标签 */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-yellow-900 px-4 py-2 rounded-full text-sm font-bold animate-pulse">
                <Flame className="w-4 h-4" />
                🔥 限时活动
              </div>
            </div>
            
            {/* 主标题 */}
            <div className="text-center mb-8">
              <h2 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text text-transparent mb-4">
                30天打卡挑战
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                加入我们的30天戒色打卡挑战，与数万名用户一起，用坚持的力量重塑自我！
              </p>
            </div>
            
            {/* 挑战数据 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">30</div>
                <p className="text-gray-400">挑战天数</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">50K+</div>
                <p className="text-gray-400">参与用户</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">85%</div>
                <p className="text-gray-400">成功率</p>
              </div>
            </div>
            
            {/* 挑战特色 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">每日打卡</h3>
                  <p className="text-gray-400 text-sm">记录每日状态，培养良好习惯，建立戒色信心</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">社区支持</h3>
                  <p className="text-gray-400 text-sm">与志同道合的朋友一起努力，互相激励成长</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">成就系统</h3>
                  <p className="text-gray-400 text-sm">解锁专属徽章，记录你的成长历程</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">AI指导</h3>
                  <p className="text-gray-400 text-sm">智能AI助教提供个性化建议和鼓励</p>
                </div>
              </div>
            </div>
            
            {/* 行动按钮 */}
            <div className="text-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-yellow-900 font-bold px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                onClick={() => router.push("/checkin")}
              >
                <Flame className="w-6 h-6 mr-2" />
                立即开始挑战
              </Button>
              <p className="text-gray-400 text-sm mt-4">
                🎁 完成挑战可获得专属会员体验券
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 功能展示区 */}
      <section id="features-section" className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t("home.features_title")}</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">{t("home.features_subtitle")}</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mx-auto">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">{t("home.feature_daily_checkin_title")}</h3>
              <p className="text-gray-400 text-sm">
                {t("home.feature_daily_checkin_desc")}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">{t("home.feature_test_title")}</h3>
              <p className="text-gray-400 text-sm">
                {t("home.feature_test_desc")}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">{t("home.feature_plans_title")}</h3>
              <p className="text-gray-400 text-sm">
                {t("home.feature_plans_desc")}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">{t("home.feature_leaderboard_title")}</h3>
              <p className="text-gray-400 text-sm">
                {t("home.feature_leaderboard_desc")}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <FeedbackSection />

      <footer className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-sm">A</span>
              </div>
              <span className="text-xl font-bold text-white">{t("home.awaken_title")}</span>
            </div>
            <p className="text-gray-400 text-sm max-w-md">{t("home.about_desc")}</p>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-medium">{t("footer.about")}</h4>
            <div className="space-y-2">
              <button
                onClick={scrollToFeatures}
                className="block text-gray-400 hover:text-white text-sm transition-colors text-left"
              >
                {t("footer.features")}
              </button>
              <a href="/pricing" className="block text-gray-400 hover:text-white text-sm transition-colors">
                {t("footer.pricing")}
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-medium">{t("footer.tools")}</h4>
            <div className="space-y-2">
              <a href="/test" className="block text-gray-400 hover:text-white text-sm transition-colors">
                {t("footer.test")}
              </a>
              <a href="/checkin" className="block text-gray-400 hover:text-white text-sm transition-colors">
                {t("footer.checkin")}
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">{t("home.copyright")}</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <PrivacyPolicyModal />
          </div>
        </div>
      </footer>
    </div>
  )
}

// 隐私政策弹窗组件
function PrivacyPolicyModal() {
  const [open, setOpen] = useState(false)
  const { t } = useLanguage()

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-gray-400 hover:text-white text-sm transition-colors">
        {t("privacy.title")}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-800 to-purple-900 border border-purple-700/50 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">{t("privacy.title")}</h2>
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 text-gray-300">
                <section>
                  <h3 className="text-lg font-semibold text-white mb-2">{t("privacy.collection.title")}</h3>
                  <p className="text-sm leading-relaxed">
                    {t("privacy.collection.desc")}
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-white mb-2">{t("privacy.usage.title")}</h3>
                  <p className="text-sm leading-relaxed">
                    {t("privacy.usage.desc")}
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-white mb-2">{t("privacy.protection.title")}</h3>
                  <p className="text-sm leading-relaxed">
                    {t("privacy.protection.desc")}
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-white mb-2">{t("privacy.third_party.title")}</h3>
                  <p className="text-sm leading-relaxed">
                    {t("privacy.third_party.desc")}
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-white mb-2">{t("privacy.deletion.title")}</h3>
                  <p className="text-sm leading-relaxed">
                    {t("privacy.deletion.desc")}
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-white mb-2">{t("privacy.contact.title")}</h3>
                  <p className="text-sm leading-relaxed">
                    {t("privacy.contact.desc")}
                  </p>
                </section>
              </div>

              <div className="mt-6 pt-4 border-t border-purple-700/30">
                <p className="text-xs text-gray-400 text-center">{t("privacy.last_updated")}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

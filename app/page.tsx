"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Target, TestTube, Sparkles, RefreshCw, Flame, Users, Calendar, FileText, Video, Headphones, BookOpen, Brain, Heart, Activity } from "lucide-react"
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

    return () => subscription.unsubscribe()
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
            <SolidFlame size={44} className="mr-3 drop-shadow-lg" />
            <h1 className="text-6xl md:text-7xl font-extrabold bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent leading-tight tracking-wide">
              Awaken
            </h1>
          </div>
          {/* 中文三行文案 */}
          {t("lang") === 'zh' ? (
            <div className="max-w-2xl mx-auto text-center mb-8 space-y-1">
              <div className="text-lg md:text-xl font-semibold text-white">{t("home.hero_slogan")}</div>
              <div className="text-2xl md:text-3xl font-bold text-white">{t("home.hero_value1")}</div>
              <div className="text-base md:text-xl font-medium text-orange-200">{t("home.hero_value2")}</div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Video className="w-6 h-6 text-blue-400" />
                <span className="text-lg md:text-2xl font-semibold text-white/90">{t("home.hero_line1")}</span>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                <span className="bg-gradient-to-r from-orange-400 via-orange-300 to-yellow-300 bg-clip-text text-transparent">Awaken</span> your willpower
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

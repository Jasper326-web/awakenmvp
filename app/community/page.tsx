"use client"

import { useState, useEffect } from "react"
import Community from "@/components/community"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Users, 
  MessageSquare, 
  Heart, 
  TrendingUp, 
  Crown, 
  Lock,
  Sparkles,
  Award,
  Star,
  Flame,
  LogIn,
  ArrowUpRight
} from "lucide-react"
import { useLanguage } from '@/lib/lang-context'
import { authService } from "@/lib/auth"
import { supabase } from "@/lib/supabaseClient"
import AuthModal from "@/components/auth-modal"

export default function CommunityPage() {
  const { t } = useLanguage()
  const [user, setUser] = useState<any>(null)
  const [subscriptionData, setSubscriptionData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  // 只保留一次 fetch /api/user-subscription
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const currentUser = await authService.getCurrentUser()
        setUser(currentUser)
        if (currentUser) {
          const response = await fetch("/api/user-subscription", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          })
          if (response.ok) {
            const result = await response.json()
            setSubscriptionData(result.data || null)
          } else if (response.status === 406) {
            // 406视为无会员
            setSubscriptionData(null)
          } else {
            setSubscriptionData(null)
          }
        }
      } catch (error) {
        setSubscriptionData(null)
      } finally {
        setLoading(false)
      }
    }
    loadUserData()
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        loadUserData()
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setSubscriptionData(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const isPremium = subscriptionData?.status === "active"

  // Analytics logging
  useEffect(() => {
    if (!loading) {
      if (!user) {
        console.log("[Community Analytics] User not logged in")
      } else if (!isPremium) {
        console.log("[Community Analytics] User logged in but not premium")
      } else {
        console.log("[Community Analytics] Premium user accessing community")
      }
    }
  }, [user, isPremium, loading])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>{t("common.loading")}</p>
        </div>
      </div>
    )
  }

  // 1. 未登录用户显示登录提示
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {t("community.login_required_title")}
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                {t("community.login_required_desc")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6 text-center">
                  <MessageSquare className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">{t("community.feature_connect")}</h3>
                  <p className="text-gray-400 text-sm">{t("community.feature_connect_desc")}</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6 text-center">
                  <Heart className="w-8 h-8 text-red-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">{t("community.feature_support")}</h3>
                  <p className="text-gray-400 text-sm">{t("community.feature_support_desc")}</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">{t("community.feature_grow")}</h3>
                  <p className="text-gray-400 text-sm">{t("community.feature_grow_desc")}</p>
                </CardContent>
              </Card>
            </div>

            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold px-8 py-3 rounded-xl"
              onClick={() => setAuthModalOpen(true)}
            >
              <LogIn className="w-5 h-5 mr-2" />
              {t("community.login_to_join")}
            </Button>
          </div>
        </div>

        <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      </div>
    )
  }

  // 2. 非会员用户显示会员引导，不渲染内容区
  if (!isPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* 置顶的升级按钮 */}
        <div className="sticky top-0 z-50 bg-gradient-to-r from-yellow-500/90 to-orange-500/90 backdrop-blur-sm border-b border-yellow-400/30">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Crown className="w-6 h-6 text-white" />
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {t("community.premium_required_title")}
                  </h3>
                  <p className="text-yellow-100 text-sm">
                    {t("community.premium_required_desc")}
                  </p>
                </div>
              </div>
              <Button
                size="lg"
                className="bg-white text-yellow-600 hover:bg-yellow-50 font-semibold px-6 py-2 rounded-xl"
                onClick={() => window.location.href = "/pricing"}
              >
                <ArrowUpRight className="w-5 h-5 mr-2" />
                {t("community.upgrade_to_premium")}
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* 页面标题 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">
                    {t("community.title")}
                  </h1>
                  <p className="text-gray-400">{t("community.subtitle")}</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                <Crown className="w-4 h-4 mr-1" />
                {t("community.premium")}
              </Badge>
            </div>
            <Separator className="bg-slate-700" />
          </div>
        </div>
      </div>
    )
  }

  // 3. 会员用户显示完整社群内容
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {t("community.title")}
                </h1>
                <p className="text-gray-400">{t("community.subtitle")}</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
              <Crown className="w-4 h-4 mr-1" />
              {t("community.premium")}
            </Badge>
          </div>
          
          <Separator className="bg-slate-700" />
        </div>

        {/* 社群内容 */}
        <Community />
      </div>
    </div>
  )
}

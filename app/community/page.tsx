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
  const [loading, setLoading] = useState(true)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  // 社群功能已对所有用户开放，简化用户数据获取
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const currentUser = await authService.getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error("获取用户数据失败:", error)
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
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  // Analytics logging - 简化日志
  useEffect(() => {
    if (!loading) {
      if (!user) {
        console.log("[Community Analytics] User not logged in")
      } else {
        console.log("[Community Analytics] User accessing community (open to all users)")
      }
    }
  }, [user, loading])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white border-t-transparent mx-auto mb-4"></div>
          <p>{t("common.loading")}</p>
        </div>
      </div>
    )
  }



  // 所有用户（包括未登录）都可以访问社区内容
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
            {/* Premium徽章已移除，社群功能对所有用户开放 */}
          </div>
          
          <Separator className="bg-slate-700" />
        </div>

        {/* 社群内容 */}
        <Community />
      </div>
    </div>
  )
}

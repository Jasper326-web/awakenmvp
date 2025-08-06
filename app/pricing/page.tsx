"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Check, X, Star, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { authService } from "@/lib/auth"
import { supabase } from "@/lib/supabaseClient"
import Image from "next/image"
import { useLanguage } from '@/lib/lang-context'
import AuthModal from '@/components/auth-modal'

export default function PricingPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [user, setUser] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
    }
    
    // 初始检查
    checkAuth()
    
    // 监听认证状态变化
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      console.log("[Pricing] 认证状态变化:", event, session?.user?.email)
      if (event === "SIGNED_IN" && session) {
        setUser(session.user)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      }
    })
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleFreeTrial = () => {
    // 无论是否登录都跳转到首页
    router.push("/")
  }

  const handleJoinMembership = () => {
    // 打开收款码弹窗
    setIsDialogOpen(true)
  }

  // 权益key数组
  const freeFeatures = [
    t("pricing.benefit.free.status"),
    t("pricing.benefit.free.journal"),
    t("pricing.benefit.free.video"),
    t("pricing.benefit.free.ai"),
    t("pricing.benefit.free.professional_test"),
    t("pricing.benefit.free.professional_analysis"),
    t("pricing.benefit.free.community")
  ]
  const premiumFeatures = [
    t("pricing.benefit.premium.all_free"),
    t("pricing.benefit.premium.daily_push"),
    t("pricing.benefit.premium.video"),
    t("pricing.benefit.premium.ai"),
    t("pricing.benefit.premium.plan"),
    t("pricing.benefit.premium.analytics")
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white mb-4">{t("pricing.title")}</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">{t("pricing.subtitle")}</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <Card className="relative border-2 border-gray-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl font-bold text-white">{t("pricing.free_plan")}</CardTitle>
              <CardDescription className="text-gray-300 mt-2">{t("pricing.free_desc")}</CardDescription>
              <div className="mt-6">
                <span className="text-4xl font-bold text-white">$0</span>
                <span className="text-gray-300 ml-2">{t("pricing.forever")}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {freeFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <Check className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
              <Button
                onClick={handleFreeTrial}
                className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
              >
                {t("pricing.free_trial")}
              </Button>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="relative border-2 border-orange-500 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 bg-slate-800/50 backdrop-blur-sm">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-orange-500 text-white px-6 py-2 rounded-full text-sm font-medium flex items-center">
                <Star className="w-4 h-4 mr-1 text-yellow-300 drop-shadow" />
                {t("pricing.recommended")}
              </div>
            </div>
            <CardHeader className="text-center pb-8 pt-8">
              <CardTitle className="text-2xl font-extrabold text-yellow-300 drop-shadow">{t("pricing.premium_plan")}</CardTitle>
              <CardDescription className="text-yellow-100 mt-2 font-medium">{t("pricing.premium_desc")}</CardDescription>
              <div className="mt-6">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl text-gray-400 line-through">$9.99</span>
                  <span className="text-4xl font-bold text-orange-500 drop-shadow flex items-end">$5.99
                    <span className="text-base font-medium text-yellow-200 ml-2 pb-1">{t("pricing.per_month")}</span>
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-4">
                {premiumFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="w-5 h-5 text-yellow-400 mr-3 flex-shrink-0 drop-shadow" />
                    <span className="text-yellow-100 font-medium drop-shadow">{feature}</span>
                  </li>
                ))}
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-yellow-400 mr-3 flex-shrink-0 drop-shadow" />
                  <span className="text-yellow-100 font-medium drop-shadow">{t("pricing.continuous_update")}</span>
                </li>
              </ul>
              <Button
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-lg shadow-lg transition-colors"
                onClick={async () => {
                  // Plausible Analytics: 追踪订阅购买事件
                  if (typeof window !== 'undefined' && window.plausible) {
                    window.plausible('subscribe_click')
                  }
                  
                  // 重新检查用户状态
                  const currentUser = await authService.getCurrentUser()
                  if (!currentUser) {
                    setAuthModalOpen(true);
                    return;
                  }
                  
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session?.access_token) {
                      console.error("无法获取用户认证token");
                      alert(t("pricing.payment_error"));
                      return;
                    }
                    
                    const res = await fetch("/api/create-creem-session", { 
                      method: "POST",
                      headers: {
                        "Authorization": `Bearer ${session.access_token}`,
                        "Content-Type": "application/json"
                      }
                    });
                    
                    if (!res.ok) {
                      const errorData = await res.json();
                      console.error("创建支付会话失败:", errorData);
                      alert(t("pricing.payment_error"));
                      return;
                    }
                    
                    const { checkout_url } = await res.json();
                    if (checkout_url) {
                      window.location.href = checkout_url;
                    } else {
                      alert(t("pricing.payment_error"));
                    }
                  } catch (error) {
                    console.error("支付流程错误:", error);
                    alert(t("pricing.payment_error"));
                  }
                }}
              >
                {t("pricing.subscribe_monthly")}
              </Button>
              <div className="text-center text-yellow-200 text-xs mt-4">
                {t("pricing.payment_success")}<br />
                {t("pricing.member_access")}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ or Additional Info */}
        <div className="text-center mt-16">
          <p className="text-gray-400 max-w-2xl mx-auto">
            {t("pricing.cancel_info")}
            <br />
            {t("pricing.contact_support")}
          </p>
        </div>
      </div>



      {/* 登录弹窗 */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  )
}

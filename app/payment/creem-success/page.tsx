"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2, Crown, Users, Brain, BookOpen } from "lucide-react"
import { useLanguage } from '@/lib/lang-context'

export default function CreemPaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 检查URL参数
    const checkoutId = searchParams.get("checkout_id")
    const status = searchParams.get("status")
    
    if (status === "completed" && checkoutId) {
      // 支付成功，等待webhook处理
      setTimeout(() => {
        setSuccess(true)
        setLoading(false)
      }, 2000) // 给webhook一些时间处理
    } else {
      setError("支付状态异常")
      setLoading(false)
    }
  }, [searchParams])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full mx-auto text-center">
          <Loader2 className="w-20 h-20 text-blue-400 mx-auto mb-6 animate-spin" />
          <h2 className="text-2xl font-semibold text-white mb-3">{t("payment.verifying_payment")}</h2>
          <p className="text-gray-300 text-lg">{t("payment.please_wait")}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full mx-auto text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-red-400 text-3xl">✕</span>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3">{t("payment.verification_failed")}</h2>
          <p className="text-gray-300 mb-8 text-lg">{error}</p>
          <div className="space-y-3">
            <Button onClick={() => router.push("/pricing")} className="w-full text-lg py-3">
              {t("payment.back_to_pricing")}
            </Button>
            <Button onClick={() => router.push("/")} variant="outline" className="w-full text-lg py-3">
              {t("payment.back_to_home")}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full mx-auto text-center">
          <div className="w-32 h-32 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Crown className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-4xl text-white mb-4">{t("payment.welcome_premium")}</h1>
          
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-3 text-green-400 text-xl">
                <CheckCircle className="w-6 h-6" />
                <span>{t("payment.payment_successful")}</span>
              </div>
              <div className="flex items-center justify-center space-x-3 text-yellow-400 text-xl">
                <Crown className="w-6 h-6" />
                <span>{t("payment.premium_activated")}</span>
              </div>
            </div>

            <div className="bg-white/5 p-8 rounded-xl border border-white/10">
              <h3 className="font-semibold text-white mb-6 text-2xl">{t("payment.you_can_now_enjoy")}</h3>
              <div className="grid md:grid-cols-2 gap-6 text-left">
                <div className="flex items-center space-x-3">
                  <Brain className="w-6 h-6 text-blue-400" />
                  <span className="text-gray-300 text-lg">{t("payment.unlimited_ai")}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <BookOpen className="w-6 h-6 text-green-400" />
                  <span className="text-gray-300 text-lg">{t("payment.all_resources")}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="w-6 h-6 text-purple-400" />
                  <span className="text-gray-300 text-lg">{t("payment.exclusive_community")}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Crown className="w-6 h-6 text-yellow-400" />
                  <span className="text-gray-300 text-lg">{t("payment.complete_plan")}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => router.push("/plans")}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-xl py-4"
              >
                {t("payment.experience_complete_plan")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
} 
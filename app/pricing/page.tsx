"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Check, X, Star } from "lucide-react"
import { useRouter } from "next/navigation"
import { authService } from "@/lib/auth"
import Image from "next/image"
import { useLanguage } from '@/lib/lang-context'

export default function PricingPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [user, setUser] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
    }
    checkAuth()
  }, [])

  const handleFreeTrial = () => {
    // 无论是否登录都跳转到首页
    router.push("/")
  }

  const handleJoinMembership = () => {
    // 打开收款码弹窗
    setIsDialogOpen(true)
  }

  const freeFeatures = t("pricing.free_features")
  const premiumFeatures = t("pricing.premium_features")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t("pricing.title")}</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{t("pricing.subtitle")}</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <Card className="relative border-2 border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl font-bold text-gray-900">{t("pricing.free_plan")}</CardTitle>
              <CardDescription className="text-gray-600 mt-2">{t("pricing.free_desc")}</CardDescription>
              <div className="mt-6">
                <span className="text-4xl font-bold text-gray-900">¥0</span>
                <span className="text-gray-600 ml-2">{t("pricing.forever")}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {freeFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3" />
                    <span className="text-gray-600">{feature}</span>
                  </div>
                ))}
                {premiumFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <X className="w-5 h-5 text-red-500 mr-3" />
                    <span className="text-gray-400 line-through">{feature}</span>
                  </div>
                ))}
              </div>
              <Button
                onClick={handleFreeTrial}
                className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-colors"
              >
                {t("pricing.free_trial")}
              </Button>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="relative border-2 border-red-500 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-red-50">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-red-500 text-white px-6 py-2 rounded-full text-sm font-medium flex items-center">
                <Star className="w-4 h-4 mr-1" />
                {t("pricing.recommended")}
              </div>
            </div>
            <CardHeader className="text-center pb-8 pt-8">
              <CardTitle className="text-2xl font-bold text-gray-900">{t("pricing.premium_plan")}</CardTitle>
              <CardDescription className="text-gray-600 mt-2">{t("pricing.premium_desc")}</CardDescription>
              <div className="mt-6">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl text-gray-400 line-through">$20</span>
                  <span className="text-4xl font-bold text-red-600">$10</span>
                </div>
                <span className="text-gray-600 text-sm mt-2 block">{t("pricing.per_month")}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-4">
                {premiumFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-900">{feature}</span>
                  </li>
                ))}
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-900">{t("pricing.continuous_update")}</span>
                </li>
              </ul>
              <Button
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
                onClick={async () => {
                  const res = await fetch("/api/create-creem-session", { method: "POST" });
                  const { checkout_url } = await res.json();
                  if (checkout_url) {
                    window.location.href = checkout_url;
                  } else {
                    alert(t("pricing.payment_error"));
                  }
                }}
              >
                {t("pricing.join_membership")}
              </Button>
              <div className="text-center text-gray-500 text-xs mt-4">
                {t("pricing.payment_success")}<br />
                {t("pricing.member_access")}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ or Additional Info */}
        <div className="text-center mt-16">
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t("pricing.cancel_info")}
            <br />
            {t("pricing.contact_support")}
          </p>
        </div>
      </div>
    </div>
  )
}

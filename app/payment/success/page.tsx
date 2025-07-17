"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2, Crown } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { authService } from "@/lib/auth"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (sessionId) {
      verifyPayment(sessionId)
    } else {
      setError("缺少支付会话ID")
      setLoading(false)
    }
  }, [sessionId])

  const verifyPayment = async (sessionId: string) => {
    try {
      // 验证支付状态
      const response = await fetch("/api/verify-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      })

      const result = await response.json()

      if (result.success) {
        // 支付成功，更新用户订阅状态
        const user = await authService.getCurrentUser()
        if (user) {
          const { error: updateError } = await supabase.from("user_subscriptions").upsert({
            user_id: user.id,
            subscription_type: "premium",
            status: "active",
            stripe_session_id: sessionId,
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1年后过期
          })

          if (updateError) {
            console.error("更新订阅状态失败:", updateError)
            setError("支付成功但更新订阅状态失败，请联系客服")
          } else {
            setSuccess(true)
          }
        }
      } else {
        setError("支付验证失败")
      }
    } catch (error) {
      console.error("支付验证错误:", error)
      setError("支付验证过程中发生错误")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-8">
            <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">验证支付状态</h2>
            <p className="text-gray-600">请稍候，我们正在确认您的支付...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">✕</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">支付验证失败</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-2">
              <Button onClick={() => router.push("/pricing")} className="w-full">
                返回定价页面
              </Button>
              <Button onClick={() => router.push("/")} variant="outline" className="w-full">
                返回首页
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl text-gray-900">欢迎成为VIP会员！</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span>支付成功</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-blue-600">
                <Crown className="w-5 h-5" />
                <span>VIP权限已激活</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">您现在可以享受：</h3>
              <ul className="text-sm text-gray-700 space-y-1 text-left">
                <li>• 完整的个性化戒色方案</li>
                <li>• 所有PDF和音频资源</li>
                <li>• 无限制AI助教对话</li>
                <li>• 高级打卡功能</li>
                <li>• 专属会员社区</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Button
                onClick={() => router.push("/plans")}
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
              >
                立即体验完整方案
              </Button>
              <Button onClick={() => router.push("/")} variant="outline" className="w-full">
                返回首页
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}

"use client"

import { useLanguage } from "@/lib/lang-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Star, Heart, Zap } from "lucide-react"
import Link from "next/link"

export default function ThankYouPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <CheckCircle className="w-16 h-16 text-green-400" />
                <div className="absolute -top-1 -right-1">
                  <Star className="w-6 h-6 text-yellow-400 fill-current" />
                </div>
              </div>
            </div>
            <CardTitle className="text-3xl font-bold mb-2">
              {t("thankyou.title")}
            </CardTitle>
            <CardDescription className="text-lg text-gray-200">
              {t("thankyou.subtitle")}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* 会员权益 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                <Zap className="w-6 h-6 text-yellow-400" />
                <div>
                  <h4 className="font-semibold">
                    {t("thankyou.feature_ai_coaching")}
                  </h4>
                  <p className="text-sm text-gray-300">
                    {t("thankyou.feature_ai_coaching_desc")}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                <Heart className="w-6 h-6 text-red-400" />
                <div>
                  <h4 className="font-semibold">
                    {t("thankyou.feature_plans")}
                  </h4>
                  <p className="text-sm text-gray-300">
                    {t("thankyou.feature_plans_desc")}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                <Star className="w-6 h-6 text-blue-400" />
                <div>
                  <h4 className="font-semibold">
                    {t("thankyou.feature_audio")}
                  </h4>
                  <p className="text-sm text-gray-300">
                    {t("thankyou.feature_audio_desc")}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <div>
                  <h4 className="font-semibold">
                    {t("thankyou.feature_video")}
                  </h4>
                  <p className="text-sm text-gray-300">
                    {t("thankyou.feature_video_desc")}
                  </p>
                </div>
              </div>
            </div>

            {/* 下一步行动 */}
            <div className="text-center space-y-4">
              <h3 className="text-xl font-semibold">
                {t("thankyou.next_title")}
              </h3>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/plans">
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    {t("thankyou.start_plan")}
                  </Button>
                </Link>
                <Link href="/checkin">
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    {t("thankyou.checkin_now")}
                  </Button>
                </Link>
              </div>
            </div>

            {/* 温馨提示 */}
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-4 rounded-lg border border-white/10">
              <h4 className="font-semibold mb-2">
                {t("thankyou.tips_title")}
              </h4>
              <ul className="text-sm text-gray-200 space-y-1">
                <li>{t("thankyou.tip_1")}</li>
                <li>{t("thankyou.tip_2")}</li>
                <li>{t("thankyou.tip_3")}</li>
              </ul>
            </div>

            {/* 开启戒色之旅按钮 */}
            <div className="text-center pt-6">
              <Link href="/plans">
                <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-4 px-8 text-lg shadow-lg">
                  {t("thankyou.start_journey")}
                </Button>
              </Link>
            </div>

            {/* 返回首页 */}
            <div className="text-center pt-4">
              <Link href="/">
                <Button variant="ghost" className="text-gray-300 hover:text-white">
                  {t("thankyou.back_home")}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
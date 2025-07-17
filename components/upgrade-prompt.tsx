"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Crown, Star, Zap, ArrowRight, Check } from "lucide-react"

interface UpgradePromptProps {
  feature?: string
  title?: string
  description?: string
  size?: "sm" | "md" | "lg"
  variant?: "card" | "banner" | "modal"
}

export default function UpgradePrompt({
  feature = "此功能",
  title = "升级到 Pro 会员",
  description = "解锁更多高级功能，提升您的戒色体验",
  size = "md",
  variant = "card",
}: UpgradePromptProps) {
  const proFeatures = ["无限制每日打卡", "自定义提醒设置", "完整排行榜查看", "高级数据筛选", "专属会员标识"]

  const premiumFeatures = ["冥想课程解锁", "一对一指导", "高级数据分析", "优先客服支持", "独家内容访问"]

  if (variant === "banner") {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Crown className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">{feature}需要 Pro 会员</h3>
              <p className="text-sm text-muted-foreground">升级解锁更多功能</p>
            </div>
          </div>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            立即升级
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Card className="card-minimal border border-border">
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-xl text-foreground">{title}</CardTitle>
        <p className="text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pro 会员方案 */}
        <div className="border border-border rounded-lg p-6 relative">
          <Badge className="absolute -top-3 left-4 bg-blue-600 text-white">推荐</Badge>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Pro 会员</h3>
                <p className="text-sm text-muted-foreground">适合日常使用</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-foreground">¥29</div>
              <div className="text-sm text-muted-foreground">/月</div>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {proFeatures.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>

          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">升级到 Pro</Button>
        </div>

        {/* Premium 会员方案 */}
        <div className="border border-border rounded-lg p-6 relative opacity-75">
          <Badge className="absolute -top-3 left-4 bg-purple-600 text-white">即将推出</Badge>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Star className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Premium 会员</h3>
                <p className="text-sm text-muted-foreground">专业深度体验</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-foreground">¥99</div>
              <div className="text-sm text-muted-foreground">/月</div>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="text-xs text-muted-foreground mb-2">包含 Pro 所有功能，plus:</div>
            {premiumFeatures.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>

          <Button disabled className="w-full bg-gray-200 text-gray-500 cursor-not-allowed">
            即将推出
          </Button>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">7天无理由退款 • 随时可取消 • 安全支付保障</p>
        </div>
      </CardContent>
    </Card>
  )
}

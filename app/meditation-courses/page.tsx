"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Brain, Lock, Crown, Star, Clock, Users, CheckCircle } from "lucide-react"
import { useSubscription } from "@/hooks/use-subscription"
import UpgradePrompt from "@/components/upgrade-prompt"

export default function MeditationCoursesPage() {
  const router = useRouter()
  const { subscription, isPro, isPremium } = useSubscription()
  const [showUpgrade, setShowUpgrade] = useState(false)

  const courses = [
    {
      id: 1,
      title: "正念冥想基础课程",
      description: "学习正念冥想的基本技巧，培养专注力和觉察力",
      duration: "30分钟",
      lessons: 8,
      level: "初级",
      requiredPlan: "pro",
      image: "/placeholder.svg?height=200&width=300",
      features: ["呼吸觉察", "身体扫描", "情绪观察", "日常正念"],
    },
    {
      id: 2,
      title: "戒色专项冥想",
      description: "专门针对戒色设计的冥想练习，帮助控制冲动",
      duration: "25分钟",
      lessons: 6,
      level: "中级",
      requiredPlan: "pro",
      image: "/placeholder.svg?height=200&width=300",
      features: ["冲动控制", "意志力训练", "自我觉察", "情绪调节"],
    },
    {
      id: 3,
      title: "高级禅修课程",
      description: "深度禅修练习，达到更高的精神境界",
      duration: "45分钟",
      lessons: 12,
      level: "高级",
      requiredPlan: "premium",
      image: "/placeholder.svg?height=200&width=300",
      features: ["深度禅定", "内观智慧", "慈悲修习", "无我体验"],
    },
    {
      id: 4,
      title: "睡前放松冥想",
      description: "帮助改善睡眠质量的放松冥想练习",
      duration: "20分钟",
      lessons: 5,
      level: "初级",
      requiredPlan: "pro",
      image: "/placeholder.svg?height=200&width=300",
      features: ["身体放松", "思维平静", "睡眠引导", "梦境净化"],
    },
  ]

  const canAccessCourse = (requiredPlan: string) => {
    if (requiredPlan === "premium") return isPremium
    if (requiredPlan === "pro") return isPro || isPremium
    return true
  }

  const getPlanBadge = (requiredPlan: string) => {
    if (requiredPlan === "premium") {
      return (
        <Badge className="bg-purple-100 text-purple-800">
          <Star className="w-3 h-3 mr-1" />
          Premium
        </Badge>
      )
    }
    return (
      <Badge className="bg-blue-100 text-blue-800">
        <Crown className="w-3 h-3 mr-1" />
        Pro
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-6xl mx-auto px-6">
        {/* 头部 */}
        <div className="flex items-center space-x-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">冥想课程</h1>
            <p className="text-muted-foreground">通过专业冥想课程，提升内在力量</p>
          </div>
        </div>

        {/* 功能介绍 */}
        <Card className="card-minimal border border-border mb-8">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">专业冥想指导</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  我们的冥想课程由专业导师设计，结合现代心理学和传统冥想智慧， 帮助您在戒色路上获得内在的平静与力量。
                </p>
              </div>

              {!isPro && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 font-medium">升级到 Pro 会员解锁所有冥想课程，开始您的内在成长之旅</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 课程列表 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const hasAccess = canAccessCourse(course.requiredPlan)

            return (
              <Card
                key={course.id}
                className={`card-minimal border ${hasAccess ? "border-border" : "border-border opacity-75"}`}
              >
                <div className="relative">
                  <img
                    src={course.image || "/placeholder.svg"}
                    alt={course.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-3 left-3">{getPlanBadge(course.requiredPlan)}</div>
                  {!hasAccess && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Lock className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm font-medium">
                          需要{course.requiredPlan === "premium" ? "Premium" : "Pro"}会员
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg text-foreground">{course.title}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {course.level}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{course.description}</p>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{course.lessons}节课</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground">课程内容：</h4>
                    <div className="grid grid-cols-2 gap-1">
                      {course.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span className="text-xs text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    disabled={!hasAccess}
                    onClick={() => (hasAccess ? null : setShowUpgrade(true))}
                  >
                    {hasAccess ? "开始学习" : "升级解锁"}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* 即将推出的功能 */}
        <Card className="card-minimal border border-border mt-8">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-bold text-foreground">更多功能即将推出</h3>
              <div className="grid md:grid-cols-3 gap-6 mt-6">
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-medium text-foreground">群体冥想</h4>
                  <p className="text-sm text-muted-foreground">与其他用户一起进行在线冥想</p>
                </div>
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                    <Brain className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="font-medium text-foreground">AI 冥想助手</h4>
                  <p className="text-sm text-muted-foreground">个性化冥想指导和建议</p>
                </div>
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <Star className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="font-medium text-foreground">进度追踪</h4>
                  <p className="text-sm text-muted-foreground">详细的冥想数据分析</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 升级提示弹窗 */}
        {showUpgrade && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="max-w-md w-full">
              <UpgradePrompt title="解锁冥想课程" description="升级到 Pro 会员，获得专业冥想指导" />
              <div className="text-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowUpgrade(false)}
                  className="border-border hover:bg-accent"
                >
                  稍后再说
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

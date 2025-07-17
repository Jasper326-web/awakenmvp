"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function ResultPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [score, setScore] = useState<number | null>(null)
  const [level, setLevel] = useState<string>("")

  useEffect(() => {
    const scoreParam = searchParams.get("score")
    if (scoreParam) {
      const scoreValue = Number.parseInt(scoreParam)
      setScore(scoreValue)

      // 根据分数确定等级
      if (scoreValue <= 10) {
        setLevel("轻度")
      } else if (scoreValue <= 20) {
        setLevel("中度")
      } else {
        setLevel("重度")
      }
    }
  }, [searchParams])

  const getLevelColor = (level: string) => {
    switch (level) {
      case "轻度":
        return "bg-green-100 text-green-800"
      case "中度":
        return "bg-yellow-100 text-yellow-800"
      case "重度":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (score === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto"></div>
          <p className="text-white/70 text-lg">加载结果中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl text-foreground">测试结果</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="text-6xl font-bold text-primary">{score}</div>
            <Badge className={getLevelColor(level)} variant="secondary">
              {level}依赖程度
            </Badge>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">建议</h3>
            <div className="text-muted-foreground">
              {level === "轻度" && <p>您的依赖程度较轻，建议保持警惕，培养健康的生活习惯。</p>}
              {level === "中度" && <p>您存在中度依赖，建议寻求专业帮助，制定戒除计划。</p>}
              {level === "重度" && <p>您的依赖程度较重，强烈建议寻求专业心理咨询师的帮助。</p>}
            </div>
          </div>

          <div className="flex space-x-4">
            <Button onClick={() => router.push("/")} className="flex-1">
              返回首页
            </Button>
            <Button onClick={() => router.push("/plans")} variant="outline" className="flex-1">
              查看戒色方案
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

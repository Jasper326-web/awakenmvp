"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy } from "lucide-react"

export default function AchievementsCard() {
  // 移除所有与 achievements 表相关的逻辑
  // 改为显示静态的成就展示或引导用户完成任务

  const staticAchievements = [
    {
      name: "新手上路",
      description: "完成首次打卡",
      icon: "🎯",
      unlocked: true,
    },
    {
      name: "坚持一周",
      description: "连续打卡7天",
      icon: "🔥",
      unlocked: false,
    },
    {
      name: "戒色达人",
      description: "连续打卡30天",
      icon: "👑",
      unlocked: false,
    },
  ]

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          成就系统
        </CardTitle>
        <CardDescription>通过坚持打卡解锁更多成就</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {staticAchievements.map((achievement, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                achievement.unlocked
                  ? "bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800"
                  : "bg-muted/50 border-muted"
              }`}
            >
              <div className="text-2xl">{achievement.icon}</div>
              <div className="flex-1">
                <h4 className="font-semibold">{achievement.name}</h4>
                <p className="text-sm text-muted-foreground">{achievement.description}</p>
              </div>
              <Badge className={achievement.unlocked ? "bg-green-500" : "bg-gray-500"}>
                {achievement.unlocked ? "已解锁" : "未解锁"}
              </Badge>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">继续坚持打卡，解锁更多成就！</p>
        </div>
      </CardContent>
    </Card>
  )
}

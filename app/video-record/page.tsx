"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import VideoRecorder from "@/components/video-recorder"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, RotateCcw, Save, FileText, Crown, Lock } from "lucide-react"
import { toast } from "sonner"
import { supabase, getCurrentUser } from "@/lib/supabaseClient"
import { useSubscription } from "@/hooks/use-subscription"

export default function VideoRecordPage() {
  const router = useRouter()
  const { isPremium, isPro } = useSubscription()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [notes, setNotes] = useState("")
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [existingData, setExistingData] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [isResetting, setIsResetting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    checkUser()
    loadExistingData()
  }, [selectedDate])

  const checkUser = async () => {
    const { user } = await getCurrentUser()
    if (!user) {
      toast.error("请先登录")
      router.push("/auth/signin")
      return
    }
    setUser(user)
  }

  const loadExistingData = async () => {
    if (!user) return

    try {
      // 获取当天的打卡记录
      const { data: checkinData } = await supabase
        .from("daily_checkins")
        .select("notes, video_url, status")
        .eq("user_id", user.id)
        .eq("date", selectedDate)
        .maybeSingle()

      if (checkinData) {
        setExistingData(checkinData)
        setNotes(checkinData.notes || "")
        setVideoUrl(checkinData.video_url || null)
      } else {
        setExistingData(null)
        setNotes("")
        setVideoUrl(null)
      }
    } catch (error) {
      console.error("加载现有数据失败:", error)
    }
  }

  const handleReset = async () => {
    try {
      setIsResetting(true)
      console.log("[视频页面] 开始重新填写，清除现有数据")

      // 清除现有数据
      setNotes("")
      setVideoUrl(null)

      // 如果有现有数据，从数据库中删除
      if (existingData) {
        const { error } = await supabase
          .from("daily_checkins")
          .delete()
          .eq("user_id", user.id)
          .eq("date", selectedDate)

        if (error) {
          console.error("[视频页面] 删除现有记录失败:", error)
          toast.error("重置失败: " + error.message)
          return
        }

        console.log("[视频页面] 成功删除现有记录")
        setExistingData(null)
        toast.success("已清除现有记录，可以重新填写")
      }
    } catch (error) {
      console.error("[视频页面] 重置失败:", error)
      toast.error("重置失败")
    } finally {
      setIsResetting(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      console.log("[视频页面] 开始保存数据")

      if (!user) {
        toast.error("用户未登录")
        return
      }

      const saveData = {
        user_id: user.id,
        date: selectedDate,
        notes: notes.trim() || null,
        video_url: videoUrl,
        status: 'success', // 默认为守戒成功
        updated_at: new Date().toISOString(),
      }

      console.log("[视频页面] 准备保存的数据:", saveData)

      const { error } = await supabase
        .from("daily_checkins")
        .upsert(saveData, {
          onConflict: "user_id,date",
        })

      if (error) {
        console.error("[视频页面] 保存失败:", error)
        toast.error("保存失败: " + error.message)
        return
      }

      console.log("[视频页面] 保存成功")
      toast.success("保存成功！")
      
      // 重新加载数据
      loadExistingData()
    } catch (error) {
      console.error("[视频页面] 保存时出错:", error)
      toast.error("保存失败")
    } finally {
      setIsSaving(false)
    }
  }

  const handleVideoSaved = (url: string) => {
    setVideoUrl(url)
    toast.success("视频上传成功！")
  }

  const hasExistingData = existingData && (existingData.notes || existingData.video_url)

  // 会员权限检查
  if (!isPremium && !isPro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 页面头部 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">视频记录</h1>
                <p className="text-gray-300">记录每日总结视频</p>
              </div>
            </div>
          </div>

          {/* 会员权限提示 */}
          <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-sm border-purple-500/30">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">会员专享功能</h2>
                <p className="text-gray-300 mb-6">视频打卡是会员专享功能，升级为会员即可使用</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <Lock className="w-4 h-4" />
                  <span>视频录制与上传</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <Lock className="w-4 h-4" />
                  <span>视频存储与管理</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <Lock className="w-4 h-4" />
                  <span>视频分享与回顾</span>
                </div>
              </div>

              <Button
                onClick={() => router.push("/pricing")}
                className="mt-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3"
              >
                升级为会员
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 页面头部 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">视频记录</h1>
              <p className="text-gray-300">记录每日总结视频</p>
            </div>
          </div>
          {hasExistingData && (
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isResetting || isSaving}
              className="text-gray-400 hover:text-white border-gray-600"
              title="重新填写"
            >
              <RotateCcw className={`h-4 w-4 mr-2 ${isResetting ? 'animate-spin' : ''}`} />
              重新填写
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 视频录制区域 */}
          <Card className="bg-gray-900/50 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-white">视频录制</CardTitle>
            </CardHeader>
            <CardContent>
              <VideoRecorder
                onVideoSaved={handleVideoSaved}
                existingVideoUrl={videoUrl || undefined}
                date={selectedDate}
                userId={user?.id}
              />
            </CardContent>
          </Card>

          {/* 备注区域 */}
          <Card className="bg-gray-900/50 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5" />
                今日感悟
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="记录今天的心情、感悟或遇到的挑战..."
                className="bg-gray-800/50 border-white/20 text-white placeholder:text-gray-400 min-h-[200px]"
              />
              
              {/* 简约保存按钮 */}
              <Button
                onClick={handleSave}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                disabled={isSaving || isResetting}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "保存中..." : isResetting ? "重置中..." : "保存记录"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 使用提示 */}
        <Card className="bg-gray-900/50 backdrop-blur-sm border-white/10">
          <CardContent className="p-4">
            <div className="text-center space-y-2">
              <h4 className="font-medium text-white text-sm">录制建议</h4>
              <div className="text-xs text-gray-400 space-y-1">
                <p>• 选择安静的环境，确保音质清晰</p>
                <p>• 真实表达今日的感受和收获</p>
                <p>• 建议录制时长控制在2-5分钟</p>
                <p>• 可以分享戒色心得或遇到的挑战</p>
                <p>• 点击右上角"重新填写"可以清除现有记录</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

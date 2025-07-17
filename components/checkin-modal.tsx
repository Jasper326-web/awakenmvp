"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, CheckCircle, XCircle, FileText, Video, Upload, RotateCcw, Save } from "lucide-react"
import { toast } from "sonner"
import { supabase, getCurrentUser } from "@/lib/supabaseClient"
import VideoRecorder from "./video-recorder"
import { useLanguage } from "@/lib/lang-context"

interface CheckinModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: string
  existingData?: {
    status: "success" | "failed" | "pending"
    hasJournal: boolean
    hasVideo: boolean
    journalContent?: string
    videoUrl?: string
  }
  onSave: (data: {
    status: "success" | "failed"
    journalContent?: string
    videoUrl?: string
  }) => void
  userId?: string
  onVideoSaved?: (videoUrl: string) => void
  onReset?: (date: string) => void
}

export default function CheckinModal({
  isOpen,
  onClose,
  selectedDate,
  existingData,
  onSave,
  userId,
  onVideoSaved,
  onReset,
}: CheckinModalProps) {
  const { t } = useLanguage()
  const [status, setStatus] = useState<"success" | "failed">("success")
  const [journalContent, setJournalContent] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [activeTab, setActiveTab] = useState("status")

  useEffect(() => {
    if (existingData) {
      setStatus(existingData.status === "pending" ? "success" : existingData.status)
      setJournalContent(existingData.journalContent || "")
      setVideoUrl(existingData.videoUrl || "")
    } else {
      // 重置为默认值
      setStatus("success")
      setJournalContent("")
      setVideoUrl("")
    }
  }, [existingData, selectedDate])

  const handleVideoSaved = (url: string) => {
    setVideoUrl(url)
    toast.success(t("checkinModal.videoUploadSuccess"))
    if (typeof onVideoSaved === 'function') onVideoSaved(url)
  }

  const handleReset = async () => {
    try {
      setIsResetting(true)
      console.log("[打卡弹窗] 开始重新填写，清除现有数据")

      // 清除现有数据
      setStatus("success")
      setJournalContent("")
      setVideoUrl("")

      // 如果有现有数据，从数据库中删除
      const { user } = await getCurrentUser()
      if (!user) {
        toast.error(t("checkinModal.userNotLoggedIn"))
        return
      }

      // 删除当天的打卡记录
      const { error } = await supabase
        .from("daily_checkins")
        .delete()
        .eq("user_id", user.id)
        .eq("date", selectedDate)

      if (error) {
        console.error("[打卡弹窗] 删除现有记录失败:", error)
        toast.error(t("checkinModal.resetFailed") + ": " + error.message)
        return
      }

      console.log("[打卡弹窗] 成功删除现有记录")
      toast.success(t("checkinModal.existingRecordCleared"))
      if (typeof onReset === 'function') onReset(selectedDate)
    } catch (error) {
      console.error("[打卡弹窗] 重置失败:", error)
      toast.error(t("checkinModal.resetFailed"))
    } finally {
      setIsResetting(false)
    }
  }

  const handleSave = async () => {
    try {
      console.log("[打卡弹窗] 开始保存打卡数据")
      setIsSaving(true)

      // 确认用户登录状态
      const { user } = await getCurrentUser()
      if (!user) {
        toast.error(t("checkinModal.userNotLoggedIn"))
        return
      }

      const saveData = {
        status,
        journalContent: journalContent.trim() || undefined,
        videoUrl: videoUrl || undefined,
      }

      console.log("[打卡弹窗] 准备保存的数据:", saveData)

      await onSave(saveData)
      onClose()
    } catch (error) {
      console.error("[打卡弹窗] 保存失败:", error)
      toast.error(t("checkinModal.saveFailed"))
    } finally {
      setIsSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    // 直接使用日期字符串，不进行时区转换
    const date = new Date(dateString)
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long", 
      day: "numeric",
      weekday: "long"
    })
  }

  const hasExistingData = existingData && (existingData.status !== "pending" || existingData.hasJournal || existingData.hasVideo)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-gray-900/95 backdrop-blur-sm border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {formatDate(selectedDate)} {t("checkinModal.checkin")}
            </div>
            {hasExistingData && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={isResetting || isSaving || isUploading}
                className="text-gray-400 hover:text-white hover:bg-white/10"
                title={t("checkinModal.reset")}
              >
                <RotateCcw className={`h-4 w-4 ${isResetting ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* 导航标签 */}
          <TabsList className="grid w-full grid-cols-2 bg-gray-800/50 border-white/10">
            <TabsTrigger 
              value="status" 
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-300"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {t("checkinModal.statusAndLog")}
            </TabsTrigger>
            <TabsTrigger 
              value="video" 
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-300"
            >
              <Video className="h-4 w-4 mr-2" />
              {t("checkinModal.video")}
            </TabsTrigger>
          </TabsList>

          {/* 状态和日志标签页 */}
          <TabsContent value="status" className="space-y-6 mt-4">
            {/* 状态选择 */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300">{t("checkinModal.todayStatus")}</label>
              <div className="flex gap-3">
                <Button
                  variant={status === "success" ? "default" : "outline"}
                  onClick={() => setStatus("success")}
                  className={`flex-1 ${
                    status === "success"
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t("checkinModal.success")}
                </Button>
                <Button
                  variant={status === "failed" ? "default" : "outline"}
                  onClick={() => setStatus("failed")}
                  className={`flex-1 ${
                    status === "failed"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {t("checkinModal.failed")}
                </Button>
              </div>
            </div>

            {/* 日志记录 */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t("checkinModal.todayReflection")}
              </label>
              <Textarea
                value={journalContent}
                onChange={(e) => setJournalContent(e.target.value)}
                placeholder={t("checkinModal.reflectionPlaceholder")}
                className="bg-gray-800/50 border-white/20 text-white placeholder:text-gray-400 min-h-[150px]"
              />
            </div>
          </TabsContent>

          {/* 视频标签页 */}
          <TabsContent value="video" className="space-y-4 mt-4">
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Video className="h-4 w-4" />
                {t("checkinModal.videoRecord")}
              </label>
              
              {videoUrl ? (
                <div className="space-y-2">
                  <Badge variant="secondary" className="bg-green-600/20 text-green-400">
                    {t("checkinModal.videoUploaded")}
                  </Badge>
                  <video src={videoUrl} controls className="w-full rounded-lg bg-gray-800" style={{ 
                    maxHeight: "320px",
                    minHeight: "240px"
                  }} />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setVideoUrl("")}
                    className="bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-white"
                  >
                    {t("checkinModal.reRecord")}
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-white/20 rounded-lg p-4">
                  <div className="max-w-full">
                    <VideoRecorder
                      onVideoSaved={handleVideoSaved}
                      existingVideoUrl={videoUrl || undefined}
                      date={selectedDate}
                      userId={userId}
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* 简约保存按钮 */}
        <div className="pt-4">
          <Button
            onClick={handleSave}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            disabled={isSaving || isUploading || isResetting}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? t("checkinModal.saving") : isUploading ? t("checkinModal.uploading") : isResetting ? t("checkinModal.resetting") : t("checkinModal.saveCheckin")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

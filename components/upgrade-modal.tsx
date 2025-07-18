"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Crown, Star, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/lang-context"

interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  message?: string
  feature?: string
}

export default function UpgradeModal({ 
  open, 
  onOpenChange, 
  title = "升级为会员", 
  message = "您本月的免费打卡次数已用完，升级为会员享受无限次打卡。",
  feature 
}: UpgradeModalProps) {
  const router = useRouter()
  const { t } = useLanguage()

  const handleUpgrade = () => {
    onOpenChange(false)
    router.push("/pricing")
  }

  const handleLogin = () => {
    onOpenChange(false)
    // 触发登录弹窗
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("showAuthModal"))
    }
  }

  const getFeatureIcon = () => {
    switch (feature) {
      case "video_checkin":
        return <CheckCircle className="w-6 h-6 text-blue-500" />
      default:
        return <Crown className="w-6 h-6 text-yellow-500" />
    }
  }

  const getFeatureTitle = () => {
    switch (feature) {
      case "video_checkin":
        return "视频打卡功能"
      default:
        return "会员专属功能"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-br from-slate-800 to-purple-900 border border-purple-700/50 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {getFeatureIcon()}
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-gray-300 leading-relaxed">
            {message}
          </p>
          
          <div className="bg-white/10 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-yellow-300 flex items-center gap-2">
              <Star className="w-4 h-4" />
              会员专享权益
            </h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                无限次视频打卡
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                无限次AI助教对话
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                专属冥想课程
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                个性化戒色计划
              </li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleUpgrade}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
            >
              <Crown className="w-4 h-4 mr-2" />
              立即升级
            </Button>
            <Button
              variant="outline"
              onClick={handleLogin}
              className="border-white/30 text-white bg-transparent hover:bg-white/10"
            >
              先登录
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
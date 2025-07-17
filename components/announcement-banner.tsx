"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { useLanguage } from '@/lib/lang-context'

export default function AnnouncementBanner() {
  const { t } = useLanguage()
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  const content = t("announcement.motd")

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200 relative overflow-hidden">
      <div className="relative">
        {/* 滚动文字 */}
        <div className="w-full flex items-center justify-center py-1">
          <marquee className="text-gradient-coral font-semibold text-sm whitespace-nowrap" scrollamount="6">
            {content}
          </marquee>
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
          aria-label="关闭公告"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* CSS动画样式 */}
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}

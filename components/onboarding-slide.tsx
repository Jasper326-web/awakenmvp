"use client"

import { useState, useEffect } from "react"
import { ChevronRight, ChevronLeft } from "lucide-react"
import dynamic from "next/dynamic"
import { useLanguage } from "@/lib/lang-context"

// 动态导入Lottie组件，优化加载
const LottiePlayer = dynamic(() => import("@/components/lottie-player"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-t-transparent border-white/50 rounded-full animate-spin"></div>
    </div>
  ),
})

interface OnboardingSlideProps {
  title: string
  description: string
  animationSrc: string
  backgroundColor: string
  textColor: string
  currentIndex: number
  totalSlides: number
  onNext: () => void
  onPrev?: () => void
  isTransitioning?: boolean
  transitionDirection?: "left" | "right"
}

export default function OnboardingSlide({
  title,
  description,
  animationSrc,
  backgroundColor,
  textColor,
  currentIndex,
  totalSlides,
  onNext,
  onPrev,
  isTransitioning = false,
  transitionDirection = "left",
}: OnboardingSlideProps) {
  const { t } = useLanguage()
  const [isAnimationLoaded, setIsAnimationLoaded] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(currentIndex)

  useEffect(() => {
    // 重置状态
    setIsAnimationLoaded(false)
    setShowContent(false)
    setCurrentSlide(currentIndex)

    // 更快的内容显示
    const timer = setTimeout(() => {
      setShowContent(true)
    }, 50)

    return () => clearTimeout(timer)
  }, [currentIndex])

  const isLastSlide = currentIndex === totalSlides - 1
  const isFirstSlide = currentIndex === 0

  // 计算滑动变换
  const getTransform = () => {
    if (!isTransitioning) return "translateX(0)"
    return transitionDirection === "left" ? "translateX(-100%)" : "translateX(100%)"
  }

  return (
    <div
      className="h-screen flex flex-col relative overflow-hidden transition-transform duration-300 ease-out"
      style={{
        backgroundColor: 'transparent', // Make slide background transparent
        color: textColor,
        transform: getTransform(),
      }}
    >
      {/* 主要内容区域 - 左右布局，整体上移并压缩底部空间 */}
      <div className="flex-1 flex items-center justify-center px-4 pt-16 pb-20">
        <div
          className={`flex items-center justify-center w-full max-w-7xl mx-auto gap-8 transition-all duration-300 ${showContent ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}
        >
          {/* 动画区域 - 调整大小 */}
          <div className="flex-shrink-0 w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 flex items-center justify-center">
            <LottiePlayer
              src={animationSrc}
              onLoad={() => setIsAnimationLoaded(true)}
              className={`w-full h-full transition-opacity duration-200 ${isAnimationLoaded ? "opacity-100" : "opacity-0"}`}
            />
          </div>

          {/* 文字内容区域 - 大幅放大，右侧 */}
          <div className="flex-1 text-left max-w-2xl">
            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-6 lg:mb-8">{title}</h1>
            <div className="text-2xl leading-relaxed" dangerouslySetInnerHTML={{ __html: description }} />
          </div>
        </div>
      </div>

      {/* 底部固定导航区域 - 大幅上移 */}
      <div className="absolute bottom-0 left-0 right-0 pb-4 pt-4">
        <div className="w-full max-w-4xl mx-auto px-8 space-y-4">
          {/* 导航按钮区域 */} {/* 移除了进度条 */}
          <div className="flex items-center justify-between">
            {/* 上一步按钮 */}
            {!isFirstSlide && onPrev ? (
              <button
                onClick={onPrev}
                className="flex items-center space-x-2 px-4 py-3 text-white/80 hover:text-white transition-all duration-200 hover:bg-white/10 rounded-lg group"
              >
                <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                <span className="text-sm font-medium">{t("onboarding.prev")}</span>
              </button>
            ) : (
              <div className="w-20" />
            )}

            {/* 下一步按钮 */}
            <button
              onClick={onNext}
              className="flex items-center space-x-3 px-8 py-4 bg-white/90 hover:bg-white text-gray-900 rounded-xl font-semibold text-lg transition-all duration-200 hover:scale-105 hover:shadow-lg group"
            >
              <span>{isLastSlide ? t("onboarding.start_using") : t("onboarding.next")}</span>
              <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>

            {/* 右侧占位 */}
            <div className="w-20" />
          </div>

          {/* 额外信息区域 */}
          {isLastSlide && (
            <div className="text-center">
              <p className="text-white/70 text-sm">
                {t("onboarding.community").replace("{count}", "50,000")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

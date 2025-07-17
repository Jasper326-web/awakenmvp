"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, ChevronLeft } from "lucide-react"
import dynamic from "next/dynamic"
import { useLanguage } from '@/lib/lang-context'

// 动态导入Lottie组件
const LottiePlayer = dynamic(() => import("@/components/lottie-player"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-t-transparent border-white/50 rounded-full animate-spin"></div>
    </div>
  ),
})

const introSlides = [
  {
    title: t("intro.welcome"),
    description: t("intro.start_journey"),
    animationSrc: "https://tcokifhplpdippdntsya.supabase.co/storage/v1/object/public/animations/welcome.lottie",
    backgroundColor: "#6366f1",
    textColor: "#ffffff",
  },
  {
    title: t("intro.truth"),
    description: t("intro.porn_harm"),
    animationSrc: "https://tcokifhplpdippdntsya.supabase.co/storage/v1/object/public/animations/brain.lottie",
    backgroundColor: "#dc2626",
    textColor: "#ffffff",
  },
  {
    title: t("intro.damage"),
    description: t("intro.anxiety_depression"),
    animationSrc: "https://tcokifhplpdippdntsya.supabase.co/storage/v1/object/public/animations/unhappy.lottie",
    backgroundColor: "#7c2d12",
    textColor: "#ffffff",
  },
  {
    title: t("intro.heartbreak"),
    description: t("intro.heartbreak_description"),
    animationSrc: "https://tcokifhplpdippdntsya.supabase.co/storage/v1/object/public/animations/heartbreak.lottie",
    backgroundColor: "#991b1b",
    textColor: "#ffffff",
  },
  {
    title: t("intro.rebirth"),
    description: t("intro.rebirth_description"),
    animationSrc: "https://tcokifhplpdippdntsya.supabase.co/storage/v1/object/public/animations/motivation.lottie",
    backgroundColor: "#059669",
    textColor: "#ffffff",
  },
  {
    title: t("intro.strong_body"),
    description: t("intro.strong_body_description"),
    animationSrc: "https://tcokifhplpdippdntsya.supabase.co/storage/v1/object/public/animations/muscle.lottie",
    backgroundColor: "#0d9488",
    textColor: "#ffffff",
  },
  {
    title: t("intro.happy_life"),
    description: t("intro.happy_life_description"),
    animationSrc: "https://tcokifhplpdippdntsya.supabase.co/storage/v1/object/public/animations/happy.lottie",
    backgroundColor: "#0891b2",
    textColor: "#ffffff",
  },
  {
    title: t("intro.set_goal"),
    description: t("intro.set_goal_description"),
    animationSrc: "https://tcokifhplpdippdntsya.supabase.co/storage/v1/object/public/animations/goal.lottie",
    backgroundColor: "#7c3aed",
    textColor: "#ffffff",
  },
  {
    title: t("intro.continuous_growth"),
    description: t("intro.continuous_growth_description"),
    animationSrc: "https://tcokifhplpdippdntsya.supabase.co/storage/v1/object/public/animations/plant.lottie",
    backgroundColor: "#16a34a",
    textColor: "#ffffff",
  },
  {
    title: t("intro.data_tracking"),
    description: t("intro.data_tracking_description"),
    animationSrc: "https://tcokifhplpdippdntsya.supabase.co/storage/v1/object/public/animations/chart.lottie",
    backgroundColor: "#0f172a",
    textColor: "#ffffff",
  },
  {
    title: t("intro.start_change"),
    description: t("intro.start_change_description"),
    animationSrc: "https://tcokifhplpdippdntsya.supabase.co/storage/v1/object/public/animations/celebration.lottie",
    backgroundColor: "#fbbf24",
    textColor: "#1f2937",
  },
]

export default function IntroPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [direction, setDirection] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const isIntroActive = useRef(true)

  // 确保引导页在整个过程中保持活跃状态
  useEffect(() => {
    isIntroActive.current = true

    // 防止浏览器后退按钮
    const handlePopState = (e: PopStateEvent) => {
      if (isIntroActive.current) {
        e.preventDefault()
        window.history.pushState(null, "", "/intro")
      }
    }

    window.history.pushState(null, "", "/intro")
    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [])

  const handleNext = () => {
    if (isTransitioning) return

    if (currentSlide < introSlides.length - 1) {
      setIsTransitioning(true)
      setDirection(1)

      setTimeout(() => {
        setCurrentSlide(currentSlide + 1)
        setIsTransitioning(false)
      }, 20)
    } else {
      isIntroActive.current = false
      localStorage.setItem("hasSeenIntro", "true")
      router.replace("/")
    }
  }

  const handlePrev = () => {
    if (isTransitioning) return

    if (currentSlide > 0) {
      setIsTransitioning(true)
      setDirection(-1)

      setTimeout(() => {
        setCurrentSlide(currentSlide - 1)
        setIsTransitioning(false)
      }, 20)
    }
  }

  const handleSkip = () => {
    isIntroActive.current = false
    localStorage.setItem("hasSeenIntro", "true")
    router.replace("/")
  }

  const currentSlideData = introSlides[currentSlide]
  const isLastSlide = currentSlide === introSlides.length - 1
  const isFirstSlide = currentSlide === 0

  // 优化的滑动动画变体
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? "-100%" : "100%",
      opacity: 0,
      scale: 0.98,
    }),
  }

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {/* 跳过按钮 */}
      <button
        onClick={handleSkip}
        disabled={isTransitioning}
        className="absolute top-8 right-8 z-50 text-white/80 hover:text-white transition-colors duration-200 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium disabled:opacity-50"
      >
        {t("intro.skip")}
      </button>

      {/* 滑动容器 */}
      <div className="relative w-full h-full isolate">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={`slide-${currentSlide}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: {
                type: "spring",
                stiffness: 500,
                damping: 50,
                mass: 0.8,
              },
              opacity: { duration: 0.15 },
              scale: { duration: 0.15 },
            }}
            className="absolute inset-0 h-screen flex flex-col overflow-hidden"
            style={{
              backgroundColor: currentSlideData.backgroundColor,
              color: currentSlideData.textColor,
            }}
            onAnimationStart={() => setIsTransitioning(true)}
            onAnimationComplete={() => setIsTransitioning(false)}
          >
            {/* 主要内容区域 - 统一布局 */}
            <div className="flex-1 flex items-center justify-center px-4 pt-12 pb-32">
              <div className="flex items-center justify-center w-full max-w-7xl mx-auto gap-12">
                {/* 动画区域 - 统一尺寸 */}
                <div className="flex-shrink-0 flex items-center justify-center w-96 h-96 lg:w-[500px] lg:h-[500px] xl:w-[600px] xl:h-[600px]">
                  <LottiePlayer
                    key={`lottie-${currentSlide}`}
                    src={currentSlideData.animationSrc}
                    className="w-full h-full"
                  />
                </div>

                {/* 文字内容区域 - 统一布局 */}
                <div className="flex-1 text-left max-w-2xl">
                  <motion.h1
                    className="text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-6 lg:mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                  >
                    {currentSlideData.title}
                  </motion.h1>
                  <motion.div
                    className="text-2xl leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: currentSlideData.description }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.3 }}
                  />
                </div>
              </div>
            </div>

            {/* 底部导航区域 */}
            <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black/30 via-black/10 to-transparent">
              <div className="w-full max-w-4xl mx-auto px-8 h-full flex flex-col justify-center space-y-4">
                {/* 进度条 */}
                <div className="w-full max-w-md mx-auto h-1 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentSlide + 1) / introSlides.length) * 100}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>

                {/* 导航按钮 */}
                <div className="flex items-center justify-between">
                  {/* 上一步按钮 */}
                  {!isFirstSlide ? (
                    <button
                      onClick={handlePrev}
                      disabled={isTransitioning}
                      className="flex items-center space-x-2 px-4 py-3 text-white/80 hover:text-white transition-all duration-200 hover:bg-white/10 rounded-lg group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                      <span className="text-sm font-medium">{t("intro.prev_step")}</span>
                    </button>
                  ) : (
                    <div className="w-20" />
                  )}

                  {/* 下一步按钮 */}
                  <button
                    onClick={handleNext}
                    disabled={isTransitioning}
                    className="flex items-center space-x-3 px-8 py-4 bg-white/90 hover:bg-white text-gray-900 rounded-xl font-semibold text-lg transition-all duration-200 hover:scale-105 hover:shadow-lg group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, ChevronLeft } from "lucide-react"
import dynamic from "next/dynamic"

// 动态导入Lottie组件
const LottiePlayer = dynamic(() => import("@/components/lottie-player"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-t-transparent border-white/50 rounded-full animate-spin"></div>
    </div>
  ),
})

const introSlides = [
  {
    title: "欢迎来到Awaken",
    description:
      "开始您的<strong>重生之旅</strong><br/>重新掌控自己的人生<br/><small>基于科学研究的戒色康复方法</small>",
    animationSrc: "https://tcokifhplpdippdntsya.supabase.co/storage/v1/object/public/animations/welcome.lottie",
    backgroundColor: "#6366f1",
    textColor: "#ffffff",
  },
  {
    title: "认识真相",
    description:
      "色情内容正在<strong>悄悄伤害</strong>您的大脑<br/>影响专注力、记忆力和决策能力<br/><small>神经科学研究：长期观看会降低大脑灰质密度</small>",
    animationSrc: "https://tcokifhplpdippdntsya.supabase.co/storage/v1/object/public/animations/brain.lottie",
    backgroundColor: "#dc2626",
    textColor: "#ffffff",
  },
  {
    title: "身心受损",
    description:
      "长期观看会导致<strong>焦虑抑郁</strong><br/>影响人际关系和自信心<br/><small>心理学研究显示：与社交焦虑症状密切相关</small>",
    animationSrc: "https://tcokifhplpdippdntsya.supabase.co/storage/v1/object/public/animations/unhappy.lottie",
    backgroundColor: "#7c2d12",
    textColor: "#ffffff",
  },
  {
    title: "关系破裂",
    description:
      "色情成瘾会<strong>破坏亲密关系</strong><br/>让您失去真正的爱与连接<br/><small>临床研究：对伴侣关系产生负面影响</small>",
    animationSrc: "https://tcokifhplpdippdntsya.supabase.co/storage/v1/object/public/animations/heartbreak.lottie",
    backgroundColor: "#991b1b",
    textColor: "#ffffff",
  },
  {
    title: "重获新生",
    description:
      "<strong>戒色成功你将获得：</strong><br/>清晰的思维和前所未有的专注力<br/><small>认知功能研究：戒除后专注力显著提升</small>",
    animationSrc: "https://tcokifhplpdippdntsya.supabase.co/storage/v1/object/public/animations/motivation.lottie",
    backgroundColor: "#059669",
    textColor: "#ffffff",
  },
  {
    title: "强健体魄",
    description:
      "<strong>戒色成功你将获得：</strong><br/>充沛的精力和健康的身体状态<br/><small>健康研究：改善睡眠质量和整体体能</small>",
    animationSrc: "https://tcokifhplpdippdntsya.supabase.co/storage/v1/object/public/animations/muscle.lottie",
    backgroundColor: "#0d9488",
    textColor: "#ffffff",
  },
  {
    title: "快乐人生",
    description:
      "<strong>戒色成功你将获得：</strong><br/>内心的平静与喜悦，重建自信和自尊<br/><small>心理健康研究：情绪状态明显改善</small>",
    animationSrc: "https://tcokifhplpdippdntsya.supabase.co/storage/v1/object/public/animations/happy.lottie",
    backgroundColor: "#0891b2",
    textColor: "#ffffff",
  },
  {
    title: "设定目标",
    description:
      "<strong>Awaken为您提供：</strong><br/>个性化康复计划和目标设定系统<br/><small>基于行为心理学的科学戒色方法</small>",
    animationSrc: "https://tcokifhplpdippdntsya.supabase.co/storage/v1/object/public/animations/goal.lottie",
    backgroundColor: "#7c3aed",
    textColor: "#ffffff",
  },
  {
    title: "持续成长",
    description:
      "<strong>Awaken帮您：</strong><br/>像植物一样每天进步，见证蜕变<br/><small>渐进式康复：每一天都是新的开始</small>",
    animationSrc: "https://tcokifhplpdippdntsya.supabase.co/storage/v1/object/public/animations/plant.lottie",
    backgroundColor: "#16a34a",
    textColor: "#ffffff",
  },
  {
    title: "数据追踪",
    description:
      "<strong>Awaken数据分析：</strong><br/>科学的进步追踪，清楚看到成长轨迹<br/><small>量化自我：用数据见证您的改变</small>",
    animationSrc: "https://tcokifhplpdippdntsya.supabase.co/storage/v1/object/public/animations/chart.lottie",
    backgroundColor: "#0f172a",
    textColor: "#ffffff",
  },
  {
    title: "开始改变",
    description:
      "<strong>准备好开始了吗？</strong><br/>每个小胜利都值得庆祝，您已准备好了！<br/><small>您的康复之旅从今天开始</small>",
    animationSrc: "https://tcokifhplpdippdntsya.supabase.co/storage/v1/object/public/animations/celebration.lottie",
    backgroundColor: "#fbbf24",
    textColor: "#1f2937",
  },
]

export default function IntroPage() {
  const router = useRouter()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [direction, setDirection] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const isIntroActive = useRef(true)

  // 确保引导页在整个过程中保持活跃状态
  useEffect(() => {
    isIntroActive.current = true

    // 防止浏览器后退按钮
    const handlePopState = (e: PopStateEvent) => {
      if (isIntroActive.current) {
        e.preventDefault()
        window.history.pushState(null, "", "/intro")
      }
    }

    window.history.pushState(null, "", "/intro")
    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [])

  const handleNext = () => {
    if (isTransitioning) return

    if (currentSlide < introSlides.length - 1) {
      setIsTransitioning(true)
      setDirection(1)

      setTimeout(() => {
        setCurrentSlide(currentSlide + 1)
        setIsTransitioning(false)
      }, 20)
    } else {
      isIntroActive.current = false
      localStorage.setItem("hasSeenIntro", "true")
      router.replace("/")
    }
  }

  const handlePrev = () => {
    if (isTransitioning) return

    if (currentSlide > 0) {
      setIsTransitioning(true)
      setDirection(-1)

      setTimeout(() => {
        setCurrentSlide(currentSlide - 1)
        setIsTransitioning(false)
      }, 20)
    }
  }

  const handleSkip = () => {
    isIntroActive.current = false
    localStorage.setItem("hasSeenIntro", "true")
    router.replace("/")
  }

  const currentSlideData = introSlides[currentSlide]
  const isLastSlide = currentSlide === introSlides.length - 1
  const isFirstSlide = currentSlide === 0

  // 优化的滑动动画变体
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? "-100%" : "100%",
      opacity: 0,
      scale: 0.98,
    }),
  }

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {/* 跳过按钮 */}
      <button
        onClick={handleSkip}
        disabled={isTransitioning}
        className="absolute top-8 right-8 z-50 text-white/80 hover:text-white transition-colors duration-200 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium disabled:opacity-50"
      >
        跳过
      </button>

      {/* 滑动容器 */}
      <div className="relative w-full h-full isolate">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={`slide-${currentSlide}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: {
                type: "spring",
                stiffness: 500,
                damping: 50,
                mass: 0.8,
              },
              opacity: { duration: 0.15 },
              scale: { duration: 0.15 },
            }}
            className="absolute inset-0 h-screen flex flex-col overflow-hidden"
            style={{
              backgroundColor: currentSlideData.backgroundColor,
              color: currentSlideData.textColor,
            }}
            onAnimationStart={() => setIsTransitioning(true)}
            onAnimationComplete={() => setIsTransitioning(false)}
          >
            {/* 主要内容区域 - 统一布局 */}
            <div className="flex-1 flex items-center justify-center px-4 pt-12 pb-32">
              <div className="flex items-center justify-center w-full max-w-7xl mx-auto gap-12">
                {/* 动画区域 - 统一尺寸 */}
                <div className="flex-shrink-0 flex items-center justify-center w-96 h-96 lg:w-[500px] lg:h-[500px] xl:w-[600px] xl:h-[600px]">
                  <LottiePlayer
                    key={`lottie-${currentSlide}`}
                    src={currentSlideData.animationSrc}
                    className="w-full h-full"
                  />
                </div>

                {/* 文字内容区域 - 统一布局 */}
                <div className="flex-1 text-left max-w-2xl">
                  <motion.h1
                    className="text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-6 lg:mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                  >
                    {currentSlideData.title}
                  </motion.h1>
                  <motion.div
                    className="text-2xl leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: currentSlideData.description }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.3 }}
                  />
                </div>
              </div>
            </div>

            {/* 底部导航区域 */}
            <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black/30 via-black/10 to-transparent">
              <div className="w-full max-w-4xl mx-auto px-8 h-full flex flex-col justify-center space-y-4">
                {/* 进度条 */}
                <div className="w-full max-w-md mx-auto h-1 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentSlide + 1) / introSlides.length) * 100}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>

                {/* 导航按钮 */}
                <div className="flex items-center justify-between">
                  {/* 上一步按钮 */}
                  {!isFirstSlide ? (
                    <button
                      onClick={handlePrev}
                      disabled={isTransitioning}
                      className="flex items-center space-x-2 px-4 py-3 text-white/80 hover:text-white transition-all duration-200 hover:bg-white/10 rounded-lg group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                      <span className="text-sm font-medium">上一步</span>
                    </button>
                  ) : (
                    <div className="w-20" />
                  )}

                  {/* 下一步按钮 */}
                  <button
                    onClick={handleNext}
                    disabled={isTransitioning}
                    className="flex items-center space-x-3 px-8 py-4 bg-white/90 hover:bg-white text-gray-900 rounded-xl font-semibold text-lg transition-all duration-200 hover:scale-105 hover:shadow-lg group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <span>{isLastSlide ? "开始使用 Awaken" : "下一步"}</span>
                    <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </button>

                  <div className="w-20" />
                </div>

                {/* 额外信息 */}
                {isLastSlide && (
                  <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                  >
                    <p className="text-white/70 text-sm">
                      基于 <strong className="text-white">科学研究</strong> 的专业戒色方法
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

"use client"

import type { ReactNode } from "react"
import { Inter } from "next/font/google"
import Navigation from "@/components/navigation"
import { LanguageProvider } from "@/lib/lang-context"
import ChatWidget from "@/components/ChatWidget"
import DailyPushModal from "@/components/DailyPushModal"
import AnnouncementBar from "@/components/AnnouncementBar";
import { AnimatePresence, motion } from "framer-motion"
import { usePathname } from "next/navigation"
import { memo } from "react"

const inter = Inter({ subsets: ["latin"] })

// 扩展 Window 接口
declare global {
  interface Window {
    __AWAKEN_CHUNK_HANDLER__?: boolean
  }
}

// --- Chunk load error auto-recovery ---
function addChunkErrorHandler() {
  if (typeof window === "undefined") return

  let retries = Number(sessionStorage.getItem("chunk_reload_count") ?? "0")

  const MAX_RETRIES = 2

  function hardReload() {
    if (retries >= MAX_RETRIES) return // 避免死循环
    retries += 1
    sessionStorage.setItem("chunk_reload_count", String(retries))
    window.location.reload()
  }

  // ① 捕获 `<script src=".../_next/static/...">` 加载失败
  window.addEventListener("error", (e) => {
    const target = e.target as HTMLElement | null
    if (target?.tagName === "SCRIPT" && (target as HTMLScriptElement).src.includes("/_next/static/chunks/")) {
      hardReload()
    }
  })

  // ② 捕获 dynamic import promise 的 ChunkLoadError
  window.addEventListener("unhandledrejection", (event) => {
    // Webpack & Next.js 抛出的错误名称通常为 ChunkLoadError 或 SyntaxError(Unexpected token '<')
    const message = (event.reason?.message || "") as string
    if (message.includes("Loading chunk") || message.includes("ChunkLoadError")) {
      hardReload()
    }
  })
}

// 在模块初始化即执行一次（保证仅注册一次）
if (typeof window !== "undefined") {
  // 只在第一次挂载时注册
  if (!window.__AWAKEN_CHUNK_HANDLER__) {
    addChunkErrorHandler()
    window.__AWAKEN_CHUNK_HANDLER__ = true
  }
}

// Memoize the layout to prevent unnecessary re-renders
const MemoizedNavigation = memo(Navigation)
const MemoizedChatWidget = memo(ChatWidget)
const MemoizedDailyPushModal = memo(DailyPushModal)

/**
 * Client-side root layout.
 * All interactive hooks (usePathname, framer-motion, etc.) stay here.
 * No `metadata` export - that lives in the server layout.
 */
export default function RootLayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <LanguageProvider>
      {pathname !== "/intro" && <MemoizedNavigation />}
      <AnnouncementBar />
      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          initial={{ opacity: 0, x: 0 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, duration: 0.3 }}
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <MemoizedChatWidget />
      <MemoizedDailyPushModal />
    </LanguageProvider>
  )
}

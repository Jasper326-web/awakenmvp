"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type Language = "zh" | "en"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const translations = {
  zh: {
    "nav.home": "首页",
    "nav.test": "测试",
    "nav.checkin": "打卡",
    "nav.leaderboard": "排行榜",
    "nav.plans": "戒色方案",
    "nav.pricing": "定价",
    "nav.profile": "我的",
    "nav.signin": "登录",
    "nav.signup": "注册",
    "nav.signout": "登出",
    "announcement.motd": "🚀 这是Awaken的MVP版本，我们在持续打磨和完善功能。你的反馈对我们非常重要，将直接帮助平台成长。如果遇到问题或有建议，欢迎随时反馈。感谢你的支持与耐心！",
    "home.hero_line1": "🌏 全球首个支持视频打卡的自律平台",
    "home.hero_line2": "💡 唤醒意志力，点燃自我成长之火",
    "home.hero_line3": "🌿 以东方智慧，见证你的每一次改变",
    "home.please_login": "请先登录以使用此功能",
    // ... 其他唯一key ...
  },
  en: {
    "nav.home": "Home",
    "nav.test": "Test",
    "nav.checkin": "Check-in",
    "nav.leaderboard": "Leaderboard",
    "nav.plans": "NoFap Plans",
    "nav.pricing": "Pricing",
    "nav.profile": "Profile",
    "nav.signin": "Log in",
    "nav.signup": "Sign up",
    "nav.signout": "Sign out",
    "announcement.motd": "🚀 This is the MVP version of Awaken. We are continuously refining and improving features. Your feedback is incredibly valuable and will directly help us grow. If you encounter any issues or have suggestions, please don't hesitate to reach out. Thank you for your patience and support!",
    "home.hero_line1": "🌏 The world's first NoFap platform with video check-ins",
    "home.hero_line2": "💡 Awaken your willpower ignite the fire of self-growth",
    "home.hero_line3": "🌿 Witness every change in you with wisdom from Eastern traditions",
    "home.please_login": "Please log in to use this feature",
    // ... other unique keys ...
  }
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language
    if (savedLanguage && (savedLanguage === "zh" || savedLanguage === "en")) {
      setLanguage(savedLanguage)
    }
  }, [])

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem("language", lang)
  }

  const t = (key: string): string => {
    return translations[language][key as keyof (typeof translations)[typeof language]] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  console.log("useLanguage context value:", context)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

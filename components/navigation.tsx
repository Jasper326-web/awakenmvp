"use client"

import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { authService } from "@/lib/auth"
import type { User } from "@supabase/supabase-js"
import { LogOut, Flame, UserIcon, Home, CheckCircle, BookOpen, Trophy, CreditCard } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAvatarStore } from "@/lib/avatar-store"
import { supabase } from "@/lib/supabaseClient"
import { subscriptionService } from "@/lib/database"
import AuthModal from "@/components/auth-modal"
import { useLanguage } from '@/lib/lang-context';

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<any>(null)
  const [subscriptionData, setSubscriptionData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const { avatarUrl: globalAvatarUrl } = useAvatarStore()
  const { t, language, setLanguage } = useLanguage();

  useEffect(() => {
    console.log("[Navigation] 开始初始化")

    // Get initial user
    const initializeUser = async () => {
      try {
        console.log("[Navigation] 获取初始用户信息")
        const currentUser = await authService.getCurrentUser()
        console.log("[Navigation] 初始用户:", currentUser ? currentUser.email : "无用户")

        setUser(currentUser)
        if (currentUser) {
          await Promise.all([fetchUserData(currentUser.id), fetchSubscriptionData(currentUser.id)])
        }
      } catch (error) {
        console.error("[Navigation] 获取初始用户失败:", error)
      } finally {
        setLoading(false)
      }
    }

    initializeUser()

    // Listen for auth changes
    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (event, session) => {
      console.log("[Navigation] 认证状态变化:", event)
      const newUser = session?.user ?? null
      setUser(newUser)

      if (newUser) {
        console.log("[Navigation] 新用户登录:", newUser.email)
        await Promise.all([fetchUserData(newUser.id), fetchSubscriptionData(newUser.id)])
      } else {
        console.log("[Navigation] 用户已退出")
        setUserData(null)
        setSubscriptionData(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserData = async (userId: string) => {
    try {
      console.log("[Navigation] 获取用户数据:", userId)
      const { data, error } = await supabase.from("users").select("username, avatar_url").eq("id", userId).single()

      if (data && !error) {
        console.log("[Navigation] 用户数据获取成功:", data.username)
        setUserData(data)
      } else {
        console.log("[Navigation] 数据库中无用户数据，使用metadata")
        // 如果数据库中没有用户名，尝试从user_metadata获取
        const user = await authService.getCurrentUser()
        if (user?.user_metadata?.username) {
          setUserData({
            username: user.user_metadata.username,
            avatar_url: user.user_metadata.avatar_url,
          })
        }
      }
    } catch (error) {
      console.error("[Navigation] 获取用户数据失败:", error)
    }
  }

  const fetchSubscriptionData = async (userId: string) => {
    try {
      console.log("[Navigation] 获取订阅数据:", userId)
      const subscription = await subscriptionService.getUserSubscription(userId)
      setSubscriptionData(subscription)
    } catch (error) {
      console.error("[Navigation] 获取订阅数据失败:", error)
    }
  }

  const handleSignOut = async () => {
    console.log("[Navigation] 开始退出登录")
    await authService.signOut()
    // authService.signOut() 内部已经处理了页面刷新
  }

  const handleNavClick = (href: string, requireAuth: boolean) => {
    if (requireAuth && !user) {
      console.log("[Navigation] 需要登录，打开登录弹窗")
      setAuthModalOpen(true)
      return
    }
    router.push(href)
  }

  // 更新navItems配置，添加定价页面
  const navItems = [
    { href: "/", label: t("nav.home"), icon: Home, requireAuth: false },
    { href: "/checkin", label: t("nav.checkin"), icon: CheckCircle, requireAuth: false },
    { href: "/leaderboard", label: t("nav.leaderboard"), icon: Trophy, requireAuth: false },
    { href: "/plans", label: t("nav.plans"), icon: BookOpen, requireAuth: false },
    { href: "/pricing", label: t("nav.pricing"), icon: CreditCard, requireAuth: false },
    { href: "/profile", label: t("nav.profile"), icon: UserIcon, requireAuth: false },
  ]

  // 获取用户名首字母作为头像
  const getUserInitials = (email: string) => {
    return email.charAt(0).toUpperCase()
  }

  // 确定要显示的头像URL
  const getAvatarUrl = () => {
    // 优先使用全局状态中的头像URL
    if (globalAvatarUrl) return globalAvatarUrl

    // 其次使用从数据库获取的头像URL
    if (userData?.avatar_url) return userData.avatar_url

    // 最后使用用户元数据中的头像URL
    return user?.user_metadata?.avatar_url || null
  }

  // 检查是否为VIP用户
  const isVipUser = subscriptionData?.is_premium || subscriptionData?.subscription_type === "premium"

  console.log("[Navigation] 当前状态 - loading:", loading, "user:", user ? user.email : "无用户")

  return (
    <>
      <nav className="bg-gradient-to-r from-slate-900/90 via-purple-900/90 to-slate-900/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 z-10 relative">
              <Flame className="w-5 h-5 text-red-500" />
              <span className="text-lg font-bold text-white">AWAKEN</span>
            </Link>

            {/* Navigation Items - 紧凑间距 */}
            <div className="flex items-center space-x-6 z-10 relative">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                const IconComponent = item.icon

                return (
                  <button
                    key={item.href}
                    onClick={() => handleNavClick(item.href, item.requireAuth)}
                    className={`text-xs font-medium transition-all duration-200 flex items-center space-x-1.5 px-3 py-1.5 rounded-md hover:bg-white/10 hover:text-white ${
                      isActive ? "text-white bg-white/10" : "text-slate-300"
                    }`}
                    style={{ pointerEvents: "auto" }}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Auth Section */}
            <div className="flex items-center space-x-3 z-10 relative">
              {/* 语言切换按钮 */}
              <button
                className={`px-2 py-1 rounded text-xs font-semibold border border-white/20 text-white bg-white/5 hover:bg-white/10 transition ${language === 'en' ? 'ring-2 ring-yellow-400' : ''}`}
                onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
                title={language === 'en' ? '切换为中文' : 'Switch to English'}
              >
                {language === 'en' ? 'EN' : '中'}
              </button>
              {loading ? (
                <div className="w-7 h-7 bg-slate-600 rounded-full animate-pulse" />
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-7 w-7 rounded-full hover:bg-white/10">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={getAvatarUrl() || "/placeholder.svg"} alt={user.email || ""} />
                        <AvatarFallback className="bg-red-600 text-white text-xs">
                          {getUserInitials(user.email || "U")}
                        </AvatarFallback>
                      </Avatar>
                      {/* VIP标识 */}
                      {isVipUser && (
                        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white">V</span>
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-52 bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-lg text-white"
                    align="end"
                    forceMount
                  >
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium text-xs text-white flex items-center">
                          {userData?.username ? `你好，${userData.username}` : user.email}
                          {isVipUser && (
                            <span className="ml-2 px-1.5 py-0.5 bg-yellow-500 text-black text-[10px] rounded-full font-bold">
                              VIP
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator className="bg-slate-700" />
                    <DropdownMenuItem
                      onClick={() => router.push("/profile")}
                      className="cursor-pointer text-slate-300 hover:text-white hover:bg-slate-700 text-xs"
                    >
                      <UserIcon className="mr-2 h-3.5 w-3.5" />
                      <span>{t("nav.profile")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push("/pricing")}
                      className="cursor-pointer text-slate-300 hover:text-white hover:bg-slate-700 text-xs"
                    >
                      <CreditCard className="mr-2 h-3.5 w-3.5" />
                      <span>{t("nav.pricing")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-700" />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="cursor-pointer text-slate-300 hover:text-white hover:bg-slate-700 text-xs"
                    >
                      <LogOut className="mr-2 h-3.5 w-3.5" />
                      <span>{t("nav.signout")}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 h-auto"
                  onClick={() => setAuthModalOpen(true)}
                >
                  {t("nav.signin")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </>
  )
}

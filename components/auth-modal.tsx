"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import { authService } from "@/lib/auth"
import { useLanguage } from "@/lib/lang-context"
import { Flame, Mail, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/lib/supabaseClient";

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [registerLoading, setRegisterLoading] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [registerError, setRegisterError] = useState('')
  const [loginError, setLoginError] = useState('')
  const [registerSuccess, setRegisterSuccess] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [codeTimer, setCodeTimer] = useState(0)
  const [codeLoading, setCodeLoading] = useState(false)
  const [guestLoading, setGuestLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setLoading("google")
    setError("")
    const { error: authError } = await authService.signInWithGoogle()
    if (authError) {
      setError(authError.message)
      setLoading(null)
    } else {
      onOpenChange(false) // Close modal on success
      router.push('/') // Redirect to homepage
      router.refresh() // Refresh page to reflect login state
    }
  }

  const handleGitHubSignIn = async () => {
    setLoading("github")
    setError("")
    const { error: authError } = await authService.signInWithGitHub()
    if (authError) {
      setError(authError.message)
      setLoading(null)
    } else {
      onOpenChange(false) // Close modal on success
      router.push('/') // Redirect to homepage
      router.refresh()
    }
  }

  // Email sign-in will redirect to a new page, so we just close the modal before redirecting.
  const handleEmailSignInClick = () => {
    onOpenChange(false);
    router.push('/auth/email');
  }

  // 发送验证码
  const handleSendCode = async () => {
    setRegisterError('')
    setRegisterSuccess('')
    if (!email.match(/^[^@]+@[^@]+\.[^@]+$/)) {
      setRegisterError('请输入有效的邮箱地址')
      return
    }
    setCodeLoading(true)
    // 假设有API /api/send-register-code
    const res = await fetch('/api/send-register-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
    setCodeLoading(false)
    if (res.ok) {
      setCodeSent(true)
      setRegisterSuccess('验证码已发送到邮箱，请查收')
      setCodeTimer(60)
      const timer = setInterval(() => {
        setCodeTimer(t => {
          if (t <= 1) { clearInterval(timer); return 0 }
          return t - 1
        })
      }, 1000)
    } else {
      setRegisterError('验证码发送失败，请稍后重试')
    }
  }

  // 注册
  const handleRegister = async () => {
    setRegisterError('')
    setRegisterSuccess('')
    if (!email.match(/^[^@]+@[^@]+\.[^@]+$/)) {
      setRegisterError('请输入有效的邮箱地址')
      return
    }
    if (password.length < 6) {
      setRegisterError('密码至少6位')
      return
    }
    if (password !== confirmPassword) {
      setRegisterError('两次输入的密码不一致')
      return
    }
    if (!code) {
      setRegisterError('请输入验证码')
      return
    }
    setRegisterLoading(true)
    // 假设有API /api/register
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, code })
    })
    setRegisterLoading(false)
    if (res.ok) {
      setRegisterSuccess('注册成功！请前往邮箱点击激活链接后再登录。')
      setMode('login')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setCode('')
      setCodeSent(false)
    } else {
      const data = await res.json().catch(() => ({}))
      setRegisterError(data.error || '注册失败，请重试')
    }
  }

  // 登录
  const handleLogin = async () => {
    setLoginError('')
    if (!email.match(/^[^@]+@[^@]+\.[^@]+$/)) {
      setLoginError('请输入有效的邮箱地址')
      return
    }
    if (!password) {
      setLoginError('请输入密码')
      return
    }
    setLoginLoading(true)
    const result = await authService.signIn(email, password)
    setLoginLoading(false)
    if (result.error) {
      if (result.error.message && result.error.message.toLowerCase().includes('email not confirmed')) {
        setLoginError('请先前往邮箱点击激活链接后再登录')
      } else {
        setLoginError(result.error.message || '登录失败')
      }
    } else {
      onOpenChange(false)
      window.location.reload()
    }
  }

  // 游客登录逻辑
  const handleGuestLogin = async () => {
    setGuestLoading(true)
    setError("")
    // 检查当前是否已登录
    const currentUser = await authService.getCurrentUser()
    if (currentUser) {
      setGuestLoading(false)
      return
    }
    // 尝试 Supabase 匿名登录
    let guestResult
    if (supabase.auth.signInAnonymously) {
      guestResult = await supabase.auth.signInAnonymously()
    } else {
      // 兼容无 signInAnonymously 的 supabase-js 版本，自动注册随机邮箱
      const guestId = uuidv4()
      const guestEmail = `guest_${guestId}@guest.awaken`
      const guestPassword = uuidv4().slice(0, 12)
      guestResult = await authService.signUp(guestEmail, guestPassword)
    }
    setGuestLoading(false)
    if (guestResult.error) {
      setError(guestResult.error.message || 'Guest login failed')
      return
    }
    // 标记 guest
    if (guestResult.data?.user) {
      guestResult.data.user.isGuest = true
    }
    onOpenChange(false)
    router.push('/')
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-background border-border">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Flame className="w-5 h-5 text-primary" />
              <span className="text-xl font-bold text-foreground">{t("auth.login_title")}</span>
            </DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
          <DialogDescription className="pt-2 text-muted-foreground">
            {t("auth.login_description")}
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-4">
          {/* 只保留第三方登录，不显示账号密码表单 */}
          {error && <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md">{error}</div>}
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading !== null}
            className="w-full bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 h-11 flex items-center justify-center space-x-3 font-medium shadow-sm hover:shadow-md transition-all duration-150"
          >
            {loading === "google" ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>{t("auth.google_login")}</span>
              </>
            )}
          </Button>
          <Button
            onClick={handleGitHubSignIn}
            disabled={loading !== null}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white border border-gray-700 h-11 flex items-center justify-center space-x-3 font-medium shadow-sm hover:shadow-md transition-all duration-150"
          >
            {loading === "github" ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <span>{t("auth.github_login")}</span>
              </>
            )}
          </Button>
          <Button
            onClick={handleGuestLogin}
            disabled={guestLoading}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300 h-11 flex items-center justify-center space-x-3 font-medium shadow-sm hover:shadow-md transition-all duration-150 mt-2"
          >
            {guestLoading ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>{t("auth.continue_as_guest")}</span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

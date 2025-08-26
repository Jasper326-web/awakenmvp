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
  const [emailVerificationMode, setEmailVerificationMode] = useState<'login' | 'register'>('login')
  const [emailVerificationLoading, setEmailVerificationLoading] = useState(false)
  const [emailVerificationError, setEmailVerificationError] = useState('')
  const [emailVerificationSuccess, setEmailVerificationSuccess] = useState('')

  const handleGoogleSignIn = async () => {
    if (typeof window !== 'undefined' && (window as any).plausible) {
      (window as any).plausible('login_click')
    }
    setLoading("google")
    setError("")
    const { error: authError } = await authService.signInWithGoogle()
    if (authError) {
      setError(authError.message)
      setLoading(null)
    } else {
      onOpenChange(false)
      router.push('/')
      router.refresh()
    }
  }

  // Email OTP
  const handleSendEmailVerificationCode = async () => {
    setEmailVerificationError('')
    setEmailVerificationSuccess('')
    if (!email.match(/^[^@]+@[^@]+\.[^@]+$/)) {
      setEmailVerificationError('请输入有效的邮箱地址')
      return
    }
    setCodeLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) {
        setEmailVerificationError(error.message)
      } else {
        setCodeSent(true)
        setEmailVerificationSuccess('验证码已发送到邮箱，请查收')
        setCodeTimer(60)
        const timer = setInterval(() => {
          setCodeTimer((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      }
    } catch (error) {
      setEmailVerificationError('发送验证码失败，请稍后重试')
    } finally {
      setCodeLoading(false)
    }
  }

  // Password register using Supabase
  const handleRegister = async () => {
    setRegisterError('')
    setRegisterSuccess('')
    if (!email || !password || !confirmPassword) {
      setRegisterError('请填写所有必填字段')
      return
    }
    if (!email.match(/^[^@]+@[^@]+\.[^@]+$/)) {
      setRegisterError('请输入有效的邮箱地址')
      return
    }
    if (password !== confirmPassword) {
      setRegisterError('两次输入的密码不一致')
      return
    }
    if (password.length < 6) {
      setRegisterError('密码长度至少6位')
      return
    }
    setRegisterLoading(true)
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (signUpError) {
        setRegisterError(signUpError.message)
      } else {
        setRegisterSuccess('注册成功！请前往邮箱完成验证')
        setMode('login')
      }
    } finally {
      setRegisterLoading(false)
    }
  }

  // Password login using Supabase
  const handleLogin = async () => {
    setLoginError('')
    if (!email || !password) {
      setLoginError('请填写邮箱和密码')
      return
    }
    setLoginLoading(true)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setLoginLoading(false)
    if (authError) {
      setLoginError(authError.message)
    } else {
      onOpenChange(false)
      router.push('/')
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-background border-border">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center space-x-2">
            <Flame className="w-5 h-5 text-primary" />
            <span className="text-xl font-bold text-foreground">{t("auth.login_title")}</span>
          </DialogTitle>
          <DialogDescription className="pt-2 text-muted-foreground">
            {t("auth.login_description")}
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-6">
          {/* 邮箱验证登录 - 最上面 */}
          <div className="space-y-3">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">{t("auth.email_verification_title")}</h3>
              <p className="text-sm text-muted-foreground">{t("auth.email_verification_desc")}</p>
            </div>

            {emailVerificationError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md">
                {emailVerificationError}
              </div>
            )}

            {emailVerificationSuccess && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-600 text-sm rounded-md">
                {emailVerificationSuccess}
              </div>
            )}

            <div className="space-y-3">
              <Input
                type="email"
                placeholder={t("auth.email_placeholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={codeSent}
                className="h-11"
              />

              {!codeSent ? (
                <Button
                  onClick={handleSendEmailVerificationCode}
                  disabled={codeLoading || !email}
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {codeLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      {t("auth.send_code")}
                    </>
                  )}
                </Button>
              ) : (
                <div className="text-center text-sm text-muted-foreground">
                  {codeTimer > 0 
                    ? t("auth.code_sent_timer").replace("{timer}", codeTimer.toString())
                    : t("auth.code_sent")
                  }
                </div>
              )}
            </div>
          </div>

          {/* 分割线 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">{t("auth.or")}</span>
            </div>
          </div>

          {/* 邮箱+密码 登录/注册 */}
          <div className="space-y-3">
            <div className="flex items-center justify-center space-x-3">
              <Button variant={mode === 'login' ? 'default' : 'outline'} size="sm" onClick={() => setMode('login')}>账号登录</Button>
              <Button variant={mode === 'register' ? 'default' : 'outline'} size="sm" onClick={() => setMode('register')}>创建账号</Button>
            </div>

            {mode === 'login' ? (
              <div className="space-y-3">
                <Input
                  type="email"
                  placeholder="邮箱"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                />
                <Input
                  type="password"
                  placeholder="密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                />
                {loginError && <div className="p-2 text-sm text-destructive bg-destructive/10 rounded border border-destructive/20">{loginError}</div>}
                <Button onClick={handleLogin} disabled={loginLoading} className="w-full h-11">
                  {loginLoading ? '登录中...' : '登录'}
                </Button>
                <Button variant="ghost" className="w-full h-10" onClick={() => router.push('/auth/reset')}>忘记密码？</Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Input
                  type="email"
                  placeholder="邮箱"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                />
                <Input
                  type="password"
                  placeholder="密码（至少6位）"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                />
                <Input
                  type="password"
                  placeholder="确认密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11"
                />
                {registerError && <div className="p-2 text-sm text-destructive bg-destructive/10 rounded border border-destructive/20">{registerError}</div>}
                {registerSuccess && <div className="p-2 text-sm text-green-600 bg-green-500/10 rounded border border-green-500/20">{registerSuccess}</div>}
                <Button onClick={handleRegister} disabled={registerLoading} className="w-full h-11">
                  {registerLoading ? '创建中...' : '创建账号'}
                </Button>
              </div>
            )}
          </div>

          {/* Google 登录 */}
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
        </div>
      </DialogContent>
    </Dialog>
  )
}

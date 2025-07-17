"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authService } from "@/lib/auth"
import { useLanguage } from "@/lib/lang-context"
import { ArrowRight, ArrowLeft, Flame, CheckCircle, Mail } from "lucide-react"

export default function EmailAuthPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (password.length < 6) {
      setError("密码长度至少为6位")
      setLoading(false)
      return
    }

    // 先尝试登录
    const { data: signInData, error: signInError } = await authService.signIn(email, password)

    if (signInData?.user) {
      // 登录成功
      router.push("/profile")
    } else if (signInError?.message.includes("Invalid login credentials")) {
      // 用户不存在，尝试注册
      const { data: signUpData, error: signUpError } = await authService.signUp(email, password)

      if (signUpError) {
        setError(signUpError.message)
      } else {
        setSuccess(true)
      }
    } else {
      // 其他登录错误
      setError(signInError?.message || "登录失败")
    }

    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-full max-w-md px-8">
          <Card className="card-minimal border border-border text-center">
            <CardContent className="p-12">
              <div className="space-y-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div className="space-y-4">
                  <h2 className="heading-md text-foreground">账户创建成功！</h2>
                  <p className="text-body text-muted-foreground">
                    我们已向您的邮箱发送了确认邮件，请查收并点击确认链接激活账户。
                  </p>
                </div>
                <Button onClick={() => router.push("/auth/signin")} className="btn-minimal">
                  返回登录
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-md px-8">
        <div className="space-y-16">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center space-x-3">
              <Flame className="w-6 h-6 text-primary" />
              <span className="text-2xl font-bold text-foreground">A.</span>
            </div>
            <div className="flex items-center justify-center space-x-4">
              <Link href="/auth/signin">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <h1 className="heading-md text-foreground">邮箱登录</h1>
              </div>
            </div>
            <p className="text-body text-muted-foreground">输入邮箱和密码，新用户将自动创建账户</p>
          </div>

          <Card className="card-minimal border border-border">
            <CardContent className="p-12">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">
                    邮箱地址
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="请输入您的邮箱"
                    className="border-border bg-background rounded-none h-12"
                    required
                  />
                </div>

                <div className="space-y-4">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    密码
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码（至少6位）"
                    className="border-border bg-background rounded-none h-12"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0 h-12 font-medium"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Mail className="w-4 h-4 mr-2" />
                  )}
                  {loading ? "处理中..." : "登录 / 注册"}
                  {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-sm text-muted-foreground">
                  系统将自动检测账户状态：
                  <br />
                  已有账户将直接登录，新用户将自动创建账户
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

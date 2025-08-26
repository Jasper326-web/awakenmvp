"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // 获取 URL 参数
        const urlSearchParams = new URLSearchParams(window.location.search)
        const params: any = {}
        for (const [key, value] of urlSearchParams.entries()) {
          params[key] = value
        }

        // 获取 URL 中的认证信息
        const { data, error } = await supabase.auth.getSession()

        setDebugInfo({
          url: window.location.href,
          urlParams: params,
          hasSession: !!data.session,
          hasUser: !!data.session?.user,
          sessionUser: data.session?.user ? {
            id: data.session.user.id,
            email: data.session.user.email,
            email_confirmed_at: data.session.user.email_confirmed_at,
            created_at: data.session.user.created_at,
            last_sign_in_at: data.session.user.last_sign_in_at
          } : null,
          error: error?.message,
          timestamp: new Date().toISOString(),
        })

        if (error) {
          console.error("Auth callback error:", error)
          setStatus("error")
          setMessage(`认证失败: ${error.message}`)
          return
        }

        if (data.session && data.session.user) {
          // 检查用户是否已存在于我们的数据库中
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("id", data.session.user.id)
            .single()

          if (userError && userError.code === "PGRST116") {
            // 用户不存在，创建新用户
            const { error: insertError } = await supabase.from("users").insert({
              id: data.session.user.id,
              email: data.session.user.email,
              username: data.session.user.user_metadata?.full_name || data.session.user.email?.split("@")[0],
              current_streak: 0,
              total_days: 0,
            })

            if (insertError) {
              console.error("Error creating user:", insertError)
              setStatus("error")
              setMessage(`创建用户失败: ${insertError.message}`)
              return
            }
          }

          setStatus("success")
          setMessage("登录成功！正在跳转...")

          // 延迟跳转，让用户看到成功消息
          setTimeout(() => {
            router.push("/") // 修改为跳转到首页
          }, 2000)
        } else {
          setStatus("error")
          setMessage("未获取到用户信息，请重试")
        }
      } catch (err) {
        console.error("Unexpected error:", err)
        setStatus("error")
        setMessage("发生未知错误，请重试")
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-6">
          {status === "loading" && (
            <>
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <div>
                <h2 className="text-xl font-semibold mb-2">正在处理登录...</h2>
                <p className="text-muted-foreground">请稍候，我们正在验证您的身份</p>
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="w-8 h-8 mx-auto text-green-500" />
              <div>
                <h2 className="text-xl font-semibold mb-2 text-green-600">登录成功！</h2>
                <p className="text-muted-foreground">{message}</p>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="w-8 h-8 mx-auto text-red-500" />
              <div>
                <h2 className="text-xl font-semibold mb-2 text-red-600">登录失败</h2>
                <p className="text-muted-foreground mb-4">{message}</p>
                <div className="space-y-2">
                  <Button onClick={() => router.push("/auth/signin")} className="w-full">
                    重新登录
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/auth/test")} className="w-full">
                    查看调试信息
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* 调试信息 (仅在开发环境显示) */}
          {process.env.NODE_ENV === "development" && debugInfo && (
            <details className="text-left text-xs bg-gray-50 p-4 rounded">
              <summary className="cursor-pointer font-medium">调试信息</summary>
              <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

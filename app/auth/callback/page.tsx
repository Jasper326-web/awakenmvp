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
        // 收集 URL 参数与 hash 参数
        const searchParams = new URLSearchParams(window.location.search)
        const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash
        const hashParams = new URLSearchParams(hash)
        const params: Record<string, string> = {}
        searchParams.forEach((v, k) => (params[k] = v))
        hashParams.forEach((v, k) => (params[k] = v))

        // 先尝试获取现有会话
        let { data: sessionData } = await supabase.auth.getSession()

        // 若没有会话且hash里有token，显式恢复会话
        if (!sessionData.session && hashParams.get("access_token") && hashParams.get("refresh_token")) {
          const access_token = hashParams.get("access_token") as string
          const refresh_token = hashParams.get("refresh_token") as string
          const { data: setData, error: setErr } = await supabase.auth.setSession({ access_token, refresh_token })
          if (setErr) {
            setStatus("error")
            setMessage(`设置会话失败: ${setErr.message}`)
            setDebugInfo({ step: "setSession", params, error: setErr.message })
            return
          }
          sessionData = setData
        }

        // 若依然没有会话，但有 code（PKCE 场景），尝试交换 code
        if (!sessionData.session && searchParams.get("code")) {
          const code = searchParams.get("code") as string
          const { data: exData, error: exErr } = await supabase.auth.exchangeCodeForSession(code)
          if (exErr) {
            setStatus("error")
            setMessage(`交换授权码失败: ${exErr.message}`)
            setDebugInfo({ step: "exchangeCodeForSession", params, error: exErr.message })
            return
          }
          sessionData = exData as any
        }

        // 记录调试信息
        setDebugInfo({
          url: window.location.href,
          urlParams: params,
          hasSession: !!sessionData.session,
          hasUser: !!sessionData.session?.user,
          sessionUser: sessionData.session?.user
            ? {
                id: sessionData.session.user.id,
                email: sessionData.session.user.email,
                email_confirmed_at: sessionData.session.user.email_confirmed_at,
                created_at: sessionData.session.user.created_at,
                last_sign_in_at: sessionData.session.user.last_sign_in_at,
              }
            : null,
          timestamp: new Date().toISOString(),
        })

        // 会话校验与后续初始化
        if (sessionData.session && sessionData.session.user) {
          // 写入 users 表（若不存在）
          const { error: userError } = await supabase
            .from("users")
            .upsert(
              {
                id: sessionData.session.user.id,
                email: sessionData.session.user.email,
                username:
                  (sessionData.session.user as any)?.user_metadata?.full_name ||
                  sessionData.session.user.email?.split("@")[0],
                current_streak: 0,
                total_days: 0,
              },
              { onConflict: "id" }
            )
          if (userError && userError.code !== "23505") {
            setStatus("error")
            setMessage(`创建/更新用户失败: ${userError.message}`)
            return
          }

          setStatus("success")
          setMessage("登录成功！正在跳转...")
          setTimeout(() => {
            router.push("/")
          }, 1500)
        } else {
          setStatus("error")
          setMessage("未获取到会话，请重试或检查回调URL配置")
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
                  <Button onClick={() => router.push("/auth/test")} className="w-full">
                    打开认证测试
                  </Button>
                  <Button onClick={() => router.push("/auth/debug")} variant="outline" className="w-full">
                    查看调试信息
                  </Button>
                </div>
              </div>
            </>
          )}

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

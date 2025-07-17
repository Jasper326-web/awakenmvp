"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabaseClient"
import { authService } from "@/lib/auth"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"

export default function AuthTestPage() {
  const [connectionStatus, setConnectionStatus] = useState<"loading" | "success" | "error">("loading")
  const [authStatus, setAuthStatus] = useState<any>(null)
  const [testResults, setTestResults] = useState<any[]>([])
  const [origin, setOrigin] = useState<string>("")

  useEffect(() => {
    // 在客户端设置 origin
    setOrigin(window.location.origin)
    testConnection()
  }, [])

  const testConnection = async () => {
    const results = []

    try {
      // 测试 Supabase 连接
      const { data, error } = await supabase.from("users").select("count").limit(1)
      if (error) {
        results.push({
          test: "Supabase 连接",
          status: "error",
          message: error.message,
        })
        setConnectionStatus("error")
      } else {
        results.push({
          test: "Supabase 连接",
          status: "success",
          message: "连接成功",
        })
        setConnectionStatus("success")
      }
    } catch (err) {
      results.push({
        test: "Supabase 连接",
        status: "error",
        message: "连接失败",
      })
      setConnectionStatus("error")
    }

    // 测试认证状态
    try {
      const session = await authService.getSession()
      const user = await authService.getCurrentUser()

      results.push({
        test: "认证服务",
        status: "success",
        message: `当前用户: ${user ? user.email : "未登录"}`,
      })

      setAuthStatus({ session, user })
    } catch (err) {
      results.push({
        test: "认证服务",
        status: "error",
        message: "认证服务异常",
      })
    }

    setTestResults(results)
  }

  const testGoogleAuth = async () => {
    try {
      const { error } = await authService.signInWithGoogle()
      if (error) {
        alert(`Google 登录失败: ${error.message}`)
      }
    } catch (err) {
      alert("Google 登录测试失败")
    }
  }

  const testGitHubAuth = async () => {
    try {
      const { error } = await authService.signInWithGitHub()
      if (error) {
        alert(`GitHub 登录失败: ${error.message}`)
      }
    } catch (err) {
      alert("GitHub 登录测试失败")
    }
  }

  const signOut = async () => {
    await authService.signOut()
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">认证系统测试</h1>
          <p className="text-muted-foreground">检查 Supabase 连接和认证配置</p>
        </div>

        {/* 连接状态 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {connectionStatus === "loading" && <AlertCircle className="w-5 h-5 text-yellow-500" />}
              {connectionStatus === "success" && <CheckCircle className="w-5 h-5 text-green-500" />}
              {connectionStatus === "error" && <XCircle className="w-5 h-5 text-red-500" />}
              <span>系统状态</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-3">
                    {result.status === "success" && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {result.status === "error" && <XCircle className="w-4 h-4 text-red-500" />}
                    <span className="font-medium">{result.test}</span>
                  </div>
                  <span className={`text-sm ${result.status === "success" ? "text-green-600" : "text-red-600"}`}>
                    {result.message}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 当前用户信息 */}
        {authStatus && (
          <Card>
            <CardHeader>
              <CardTitle>当前用户信息</CardTitle>
            </CardHeader>
            <CardContent>
              {authStatus.user ? (
                <div className="space-y-2">
                  <p>
                    <strong>邮箱:</strong> {authStatus.user.email}
                  </p>
                  <p>
                    <strong>用户ID:</strong> {authStatus.user.id}
                  </p>
                  <p>
                    <strong>登录方式:</strong> {authStatus.user.app_metadata?.provider || "未知"}
                  </p>
                  <p>
                    <strong>创建时间:</strong> {new Date(authStatus.user.created_at).toLocaleString()}
                  </p>
                  <Button onClick={signOut} variant="outline" className="mt-4">
                    退出登录
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground">当前未登录</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* 登录测试 */}
        <Card>
          <CardHeader>
            <CardTitle>登录功能测试</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button onClick={testGoogleAuth} className="h-12">
                测试 Google 登录
              </Button>
              <Button onClick={testGitHubAuth} className="h-12">
                测试 GitHub 登录
              </Button>
            </div>
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                <strong>注意:</strong> 在测试 OAuth 登录之前，请确保在 Supabase 控制台中正确配置了 OAuth 提供商。
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 配置指南 */}
        <Card>
          <CardHeader>
            <CardTitle>配置指南</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">1. Supabase 项目设置</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>确保项目 URL 和 API Key 正确</li>
                  <li>检查数据库表是否已创建</li>
                  <li>验证 RLS 策略是否正确设置</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">2. OAuth 配置</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>在 Supabase 控制台 → Authentication → Providers 中启用 Google 和 GitHub</li>
                  <li>配置回调 URL: {origin}/auth/callback</li>
                  <li>设置正确的 Client ID 和 Client Secret</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">3. 域名配置</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>在 Authentication → URL Configuration 中添加站点 URL</li>
                  <li>添加重定向 URL: {origin}/auth/callback</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

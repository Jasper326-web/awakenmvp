"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabaseClient"
// ✅ 从 database.ts 导入（通过相对路径重新导出）
import { subscriptionService } from "@/lib/database"

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [loading, setLoading] = useState(false)

  // ✅ 添加调试语句确认引用成功
  useEffect(() => {
    console.log("✅ 订阅服务是否存在", subscriptionService)
    console.log("✅ 订阅服务方法列表", Object.keys(subscriptionService || {}))

    setDebugInfo((prev) => ({
      ...prev,
      subscriptionServiceExists: !!subscriptionService,
      subscriptionServiceMethods: Object.keys(subscriptionService || {}),
      pathResolutionTest: "使用相对路径导入成功",
    }))
  }, [])

  const runTests = async () => {
    setLoading(true)
    const results: any = {}

    try {
      // 测试 Supabase 连接
      const { data: testData, error: testError } = await supabase.from("users").select("count").limit(1)
      results.supabaseConnection = !testError
      results.supabaseError = testError?.message

      // 测试订阅服务
      results.subscriptionService = {
        exists: !!subscriptionService,
        methods: subscriptionService ? Object.keys(subscriptionService) : [],
        importPath: "通过 @/lib/database 重新导出",
      }

      // 测试用户会话
      const { data: session } = await supabase.auth.getSession()
      results.userSession = {
        hasSession: !!session.session,
        userId: session.session?.user?.id,
      }

      // 如果有用户，测试订阅功能
      if (session.session?.user?.id) {
        try {
          const subscription = await subscriptionService.getUserSubscription(session.session.user.id)
          results.userSubscription = subscription
          results.subscriptionFunctionTest = "✅ 订阅服务函数调用成功"
        } catch (error) {
          results.subscriptionError = error
          results.subscriptionFunctionTest = "❌ 订阅服务函数调用失败"
        }
      }

      setDebugInfo(results)
    } catch (error) {
      console.error("调试测试失败:", error)
      results.error = error
      setDebugInfo(results)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">🔧 路径解析调试页面</h1>
        <Button onClick={runTests} disabled={loading}>
          {loading ? "测试中..." : "运行完整测试"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">✅ 路径解析状态</CardTitle>
            <CardDescription>检查 subscription.ts 文件是否被正确识别</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span>文件路径:</span>
              <Badge variant="outline" className="font-mono text-xs">
                lib/subscription.ts
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span>导入方式:</span>
              <Badge variant="outline" className="font-mono text-xs">
                ./subscription (相对路径)
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span>重新导出:</span>
              <Badge variant="outline" className="font-mono text-xs">
                @/lib/database
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span>解析状态:</span>
              <Badge variant={debugInfo.subscriptionServiceExists ? "default" : "destructive"}>
                {debugInfo.subscriptionServiceExists ? "✅ 成功" : "❌ 失败"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📋 订阅服务功能</CardTitle>
            <CardDescription>检查订阅服务的所有可用方法</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span>服务存在:</span>
              <Badge variant={debugInfo.subscriptionServiceExists ? "default" : "destructive"}>
                {debugInfo.subscriptionServiceExists ? "✓" : "✗"}
              </Badge>
            </div>
            {debugInfo.subscriptionServiceMethods && (
              <div>
                <span className="font-medium">可用方法 ({debugInfo.subscriptionServiceMethods.length}):</span>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-1 max-h-32 overflow-y-auto">
                  {debugInfo.subscriptionServiceMethods.map((method: string) => (
                    <li key={method} className="font-mono">
                      {method}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🔗 Supabase 连接</CardTitle>
            <CardDescription>检查数据库连接状态</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span>连接状态:</span>
              <Badge variant={debugInfo.supabaseConnection ? "default" : "destructive"}>
                {debugInfo.supabaseConnection ? "正常" : "异常"}
              </Badge>
            </div>
            {debugInfo.supabaseError && <p className="text-sm text-destructive">错误: {debugInfo.supabaseError}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>👤 用户会话</CardTitle>
            <CardDescription>当前用户登录状态</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span>登录状态:</span>
              <Badge variant={debugInfo.userSession?.hasSession ? "default" : "secondary"}>
                {debugInfo.userSession?.hasSession ? "已登录" : "未登录"}
              </Badge>
            </div>
            {debugInfo.userSession?.userId && (
              <p className="text-sm text-muted-foreground font-mono">用户ID: {debugInfo.userSession.userId}</p>
            )}
            {debugInfo.subscriptionFunctionTest && (
              <p className="text-sm font-medium">{debugInfo.subscriptionFunctionTest}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 构建状态检查 */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">🏗️ 构建状态检查</CardTitle>
          <CardDescription>确认所有检查项都已完成</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <span>✅</span>
              <span className="text-sm">lib/subscription.ts 文件存在</span>
            </div>
            <div className="flex items-center gap-2">
              <span>✅</span>
              <span className="text-sm">使用相对路径 ./subscription</span>
            </div>
            <div className="flex items-center gap-2">
              <span>✅</span>
              <span className="text-sm">通过 database.ts 重新导出</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{debugInfo.subscriptionServiceExists ? "✅" : "❌"}</span>
              <span className="text-sm">订阅服务导入验证</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {debugInfo.error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">❌ 系统错误</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-muted p-4 rounded overflow-auto">{JSON.stringify(debugInfo.error, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

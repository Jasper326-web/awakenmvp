"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function AuthDebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [urlParams, setUrlParams] = useState<any>({})

  useEffect(() => {
    const collectDebugInfo = async () => {
      try {
        // 收集URL参数
        const urlSearchParams = new URLSearchParams(window.location.search)
        const params: any = {}
        for (const [key, value] of urlSearchParams.entries()) {
          params[key] = value
        }
        setUrlParams(params)

        // 获取认证状态
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        const { data: userData, error: userError } = await supabase.auth.getUser()

        // 检查数据库连接
        const { data: dbTest, error: dbError } = await supabase
          .from('users')
          .select('count')
          .limit(1)

        setDebugInfo({
          timestamp: new Date().toISOString(),
          url: window.location.href,
          urlParams: params,
          session: {
            exists: !!sessionData.session,
            user: sessionData.session?.user ? {
              id: sessionData.session.user.id,
              email: sessionData.session.user.email,
              email_confirmed_at: sessionData.session.user.email_confirmed_at,
              created_at: sessionData.session.user.created_at,
              last_sign_in_at: sessionData.session.user.last_sign_in_at,
              user_metadata: sessionData.session.user.user_metadata,
              app_metadata: sessionData.session.user.app_metadata
            } : null,
            error: sessionError?.message
          },
          user: {
            exists: !!userData.user,
            user: userData.user ? {
              id: userData.user.id,
              email: userData.user.email,
              email_confirmed_at: userData.user.email_confirmed_at,
              created_at: userData.user.created_at,
              last_sign_in_at: userData.user.last_sign_in_at
            } : null,
            error: userError?.message
          },
          database: {
            connected: !dbError,
            error: dbError?.message
          },
          environment: {
            nodeEnv: process.env.NODE_ENV,
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY
          }
        })
      } catch (error) {
        setDebugInfo({
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })
      } finally {
        setLoading(false)
      }
    }

    collectDebugInfo()
  }, [])

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      window.location.reload()
    }, 100)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">正在收集调试信息...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">认证调试页面</h1>
          <div className="space-x-2">
            <Button onClick={handleRefresh} variant="outline">刷新</Button>
            <Button onClick={handleSignOut} variant="destructive">退出登录</Button>
          </div>
        </div>

        {/* 状态概览 */}
        <Card>
          <CardHeader>
            <CardTitle>状态概览</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <span>会话状态:</span>
                <Badge variant={debugInfo?.session?.exists ? "default" : "destructive"}>
                  {debugInfo?.session?.exists ? "已登录" : "未登录"}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <span>用户状态:</span>
                <Badge variant={debugInfo?.user?.exists ? "default" : "destructive"}>
                  {debugInfo?.user?.exists ? "有效" : "无效"}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <span>数据库:</span>
                <Badge variant={debugInfo?.database?.connected ? "default" : "destructive"}>
                  {debugInfo?.database?.connected ? "连接正常" : "连接失败"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* URL参数 */}
        {Object.keys(urlParams).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>URL参数</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
                {JSON.stringify(urlParams, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* 会话信息 */}
        <Card>
          <CardHeader>
            <CardTitle>会话信息</CardTitle>
          </CardHeader>
          <CardContent>
            {debugInfo?.session?.error ? (
              <div className="text-destructive">
                <strong>错误:</strong> {debugInfo.session.error}
              </div>
            ) : (
              <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
                {JSON.stringify(debugInfo?.session, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        {/* 用户信息 */}
        <Card>
          <CardHeader>
            <CardTitle>用户信息</CardTitle>
          </CardHeader>
          <CardContent>
            {debugInfo?.user?.error ? (
              <div className="text-destructive">
                <strong>错误:</strong> {debugInfo.user.error}
              </div>
            ) : (
              <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
                {JSON.stringify(debugInfo?.user, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        {/* 数据库状态 */}
        <Card>
          <CardHeader>
            <CardTitle>数据库状态</CardTitle>
          </CardHeader>
          <CardContent>
            {debugInfo?.database?.error ? (
              <div className="text-destructive">
                <strong>错误:</strong> {debugInfo.database.error}
              </div>
            ) : (
              <div className="text-green-600">
                <strong>状态:</strong> 数据库连接正常
              </div>
            )}
          </CardContent>
        </Card>

        {/* 环境信息 */}
        <Card>
          <CardHeader>
            <CardTitle>环境信息</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
              {JSON.stringify(debugInfo?.environment, null, 2)}
            </pre>
          </CardContent>
        </Card>

        {/* 完整调试信息 */}
        <Card>
          <CardHeader>
            <CardTitle>完整调试信息</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded text-sm overflow-x-auto max-h-96">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

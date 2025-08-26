"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function AuthTestPage() {
  const [authState, setAuthState] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        const { data: userData, error: userError } = await supabase.auth.getUser()

        setAuthState({
          session: {
            exists: !!sessionData.session,
            user: sessionData.session?.user ? {
              id: sessionData.session.user.id,
              email: sessionData.session.user.email,
              email_confirmed_at: sessionData.session.user.email_confirmed_at
            } : null,
            error: sessionError?.message
          },
          user: {
            exists: !!userData.user,
            user: userData.user ? {
              id: userData.user.id,
              email: userData.user.email,
              email_confirmed_at: userData.user.email_confirmed_at
            } : null,
            error: userError?.message
          },
          url: window.location.href,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        setAuthState({
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">检查认证状态...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">认证状态测试</h1>
          <Button onClick={handleSignOut} variant="destructive">退出登录</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>当前状态</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <span>会话状态:</span>
              <Badge variant={authState?.session?.exists ? "default" : "destructive"}>
                {authState?.session?.exists ? "已登录" : "未登录"}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <span>用户状态:</span>
              <Badge variant={authState?.user?.exists ? "default" : "destructive"}>
                {authState?.user?.exists ? "有效" : "无效"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>详细信息</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
              {JSON.stringify(authState, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={() => window.location.href = '/auth/debug'} 
              className="w-full"
              variant="outline"
            >
              查看详细调试信息
            </Button>
            <Button 
              onClick={() => window.location.href = '/auth/callback'} 
              className="w-full"
              variant="outline"
            >
              重新测试认证回调
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

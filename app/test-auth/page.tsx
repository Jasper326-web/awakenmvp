"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function TestAuth() {
  const [authStatus, setAuthStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("开始检查认证状态...")
        
        // 检查环境变量
        console.log("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)
        console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + "...")

        // 获取会话
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        console.log("会话数据:", sessionData)
        console.log("会话错误:", sessionError)

        // 获取用户
        const { data: userData, error: userError } = await supabase.auth.getUser()
        console.log("用户数据:", userData)
        console.log("用户错误:", userError)

        // 测试API调用
        const testResponse = await fetch('/api/community/posts')
        const testData = await testResponse.json()
        console.log("API测试结果:", testData)

        setAuthStatus({
          session: sessionData.session,
          user: userData.user,
          sessionError,
          userError,
          apiTest: testData,
          envVars: {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL,
            key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + "..."
          }
        })
      } catch (error) {
        console.error("认证检查错误:", error)
        setAuthStatus({ error })
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (loading) {
    return <div>检查认证状态中...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">认证状态测试</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(authStatus, null, 2)}
      </pre>
    </div>
  )
} 
"use client"

import { useState, useEffect } from "react"
import { authService } from "@/lib/auth"

export default function TestSubscription() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const testSubscription = async () => {
      const testResults: any = {}

      try {
        // 测试用户认证
        const user = await authService.getCurrentUser()
        testResults.user = {
          authenticated: !!user,
          userId: user?.id || null
        }

        if (user) {
          // 测试订阅API
          const response = await fetch("/api/user-subscription", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          })

          testResults.subscriptionApi = {
            status: response.status,
            ok: response.ok,
            data: await response.json()
          }

          // 测试视频限制API
          const videoResponse = await fetch("/api/check-video-limit", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId: user.id }),
          })

          testResults.videoLimitApi = {
            status: videoResponse.status,
            ok: videoResponse.ok,
            data: await videoResponse.json()
          }
        }

      } catch (error) {
        console.error("测试失败:", error)
        testResults.error = error
      } finally {
        setResults(testResults)
        setLoading(false)
      }
    }

    testSubscription()
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">订阅API测试</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">订阅API测试结果</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(results, null, 2)}
      </pre>
    </div>
  )
} 
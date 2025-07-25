"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function TestDB() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const testTables = async () => {
      const testResults: any = {}

      try {
        // 测试user_subscriptions表
        const { data: subscriptions, error: subError } = await supabase
          .from("user_subscriptions")
          .select("count")
          .limit(1)

        testResults.user_subscriptions = {
          exists: !subError,
          error: subError?.message,
          data: subscriptions
        }

        // 测试users表
        const { data: users, error: usersError } = await supabase
          .from("users")
          .select("count")
          .limit(1)

        testResults.users = {
          exists: !usersError,
          error: usersError?.message,
          data: users
        }

        // 测试addiction_tests表
        const { data: tests, error: testsError } = await supabase
          .from("addiction_tests")
          .select("count")
          .limit(1)

        testResults.addiction_tests = {
          exists: !testsError,
          error: testsError?.message,
          data: tests
        }

        // 测试daily_checkins表
        const { data: checkins, error: checkinsError } = await supabase
          .from("daily_checkins")
          .select("count")
          .limit(1)

        testResults.daily_checkins = {
          exists: !checkinsError,
          error: checkinsError?.message,
          data: checkins
        }

      } catch (error) {
        console.error("数据库测试失败:", error)
        testResults.error = error
      } finally {
        setResults(testResults)
        setLoading(false)
      }
    }

    testTables()
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">数据库测试</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">数据库表测试结果</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(results, null, 2)}
      </pre>
    </div>
  )
} 
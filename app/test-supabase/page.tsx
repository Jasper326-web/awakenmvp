"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase, testConnection } from "@/lib/supabaseClient"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function TestSupabasePage() {
  const [connectionStatus, setConnectionStatus] = useState<"testing" | "success" | "error">("testing")
  const [userData, setUserData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // 页面加载时测试连接
    handleTestConnection()
  }, [])

  const handleTestConnection = async () => {
    setConnectionStatus("testing")
    const result = await testConnection()
    setConnectionStatus(result.success ? "success" : "error")
  }

  const handleFetchUsers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("users").select("*").limit(5)

      if (error) {
        console.error("获取用户数据失败:", error)
        alert("获取数据失败: " + error.message)
      } else {
        setUserData(data || [])
        console.log("获取到的用户数据:", data)
      }
    } catch (error) {
      console.error("请求失败:", error)
      alert("请求失败: " + error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTestUser = async () => {
    setLoading(true)
    try {
      const testUser = {
        username: `测试用户_${Date.now()}`,
        level: 1,
        current_streak: 0,
        total_days: 0,
      }

      const { data, error } = await supabase.from("users").insert([testUser]).select()

      if (error) {
        console.error("创建用户失败:", error)
        alert("创建用户失败: " + error.message)
      } else {
        console.log("创建用户成功:", data)
        alert("创建用户成功!")
        // 重新获取用户列表
        handleFetchUsers()
      }
    } catch (error) {
      console.error("创建用户请求失败:", error)
      alert("创建用户请求失败: " + error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Supabase 连接测试</h1>
          <p className="text-gray-400">测试v0中的Supabase集成</p>
        </div>

        {/* 连接状态 */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {connectionStatus === "testing" && <Loader2 className="w-5 h-5 animate-spin text-blue-400" />}
              {connectionStatus === "success" && <CheckCircle className="w-5 h-5 text-green-400" />}
              {connectionStatus === "error" && <XCircle className="w-5 h-5 text-red-400" />}
              <span>连接状态</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span
                className={`
                ${connectionStatus === "success" ? "text-green-400" : ""}
                ${connectionStatus === "error" ? "text-red-400" : ""}
                ${connectionStatus === "testing" ? "text-blue-400" : ""}
              `}
              >
                {connectionStatus === "testing" && "正在测试连接..."}
                {connectionStatus === "success" && "✅ 连接成功"}
                {connectionStatus === "error" && "❌ 连接失败"}
              </span>
              <Button onClick={handleTestConnection} variant="outline" className="border-gray-600 text-gray-300">
                重新测试
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={handleFetchUsers}
            disabled={loading || connectionStatus !== "success"}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            获取用户数据
          </Button>
          <Button
            onClick={handleCreateTestUser}
            disabled={loading || connectionStatus !== "success"}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            创建测试用户
          </Button>
        </div>

        {/* 用户数据展示 */}
        {userData.length > 0 && (
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>用户数据 ({userData.length} 条)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userData.map((user, index) => (
                  <div key={user.id || index} className="bg-gray-800 p-3 rounded-lg">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-400">用户名:</span> {user.username}
                      </div>
                      <div>
                        <span className="text-gray-400">等级:</span> {user.level}
                      </div>
                      <div>
                        <span className="text-gray-400">连续天数:</span> {user.current_streak}
                      </div>
                      <div>
                        <span className="text-gray-400">总天数:</span> {user.total_days}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 说明信息 */}
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">📝 使用说明</h3>
            <div className="text-sm text-gray-400 space-y-1">
              <p>• v0自动从import语句推断npm依赖</p>
              <p>• 无需手动添加package.json文件</p>
              <p>• 直接使用 import {`{ supabase }`} from "@/lib/supabaseClient"</p>
              <p>• 确保先在Supabase中创建了相应的表结构</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

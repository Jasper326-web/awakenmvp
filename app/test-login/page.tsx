"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function TestLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("登录中...")

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setStatus(`登录失败: ${error.message}`)
      } else {
        setStatus(`登录成功: ${data.user?.email}`)
      }
    } catch (error) {
      setStatus(`登录异常: ${error}`)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setStatus("已退出登录")
    } catch (error) {
      setStatus(`退出失败: ${error}`)
    }
  }

  const handleQuickLogin = async () => {
    setStatus("快速登录中...")
    try {
      // 使用已知的测试用户
      const { data, error } = await supabase.auth.signInWithPassword({
        email: "test1@example.com",
        password: "password123" // 假设密码
      })

      if (error) {
        setStatus(`快速登录失败: ${error.message}`)
      } else {
        setStatus(`快速登录成功: ${data.user?.email}`)
      }
    } catch (error) {
      setStatus(`快速登录异常: ${error}`)
    }
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">登录测试</h1>
      
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">邮箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          登录
        </button>
      </form>
      
      <button
        onClick={handleQuickLogin}
        className="w-full mt-4 bg-green-500 text-white p-2 rounded hover:bg-green-600"
      >
        快速登录 (test1@example.com)
      </button>
      
      <button
        onClick={handleLogout}
        className="w-full mt-4 bg-red-500 text-white p-2 rounded hover:bg-red-600"
      >
        退出登录
      </button>
      
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <strong>状态:</strong> {status}
      </div>
    </div>
  )
} 
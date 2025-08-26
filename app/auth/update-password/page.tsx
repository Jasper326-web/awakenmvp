"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const prepare = async () => {
      // 邮件重置回调一般会自动带上短期session，SDK会自动处理
      const { data, error } = await supabase.auth.getSession()
      setLoading(false)
      if (error) setError(error.message)
    }
    prepare()
  }, [])

  const handleUpdate = async () => {
    setError("")
    setSuccess("")
    if (!password || password.length < 6) {
      setError("密码至少6位")
      return
    }
    if (password !== confirm) {
      setError("两次输入的密码不一致")
      return
    }
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
    } else {
      setSuccess("密码已更新，正在跳转...")
      setTimeout(() => router.push("/"), 1200)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        加载中...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>设置新密码</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="password"
            placeholder="新密码（至少6位）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11"
          />
          <Input
            type="password"
            placeholder="确认新密码"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="h-11"
          />
          {error && <div className="p-2 text-sm text-destructive bg-destructive/10 rounded border border-destructive/20">{error}</div>}
          {success && <div className="p-2 text-sm text-green-600 bg-green-500/10 rounded border border-green-500/20">{success}</div>}
          <Button className="w-full h-11" onClick={handleUpdate}>更新密码</Button>
        </CardContent>
      </Card>
    </div>
  )
}

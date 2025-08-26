"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSendReset = async () => {
    setError("")
    setSuccess("")
    if (!email.match(/^[^@]+@[^@]+\.[^@]+$/)) {
      setError("请输入有效的邮箱地址")
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSuccess("重置邮件已发送，请前往邮箱继续操作")
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>重置密码</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="email"
            placeholder="请输入注册邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11"
          />
          {error && <div className="p-2 text-sm text-destructive bg-destructive/10 rounded border border-destructive/20">{error}</div>}
          {success && <div className="p-2 text-sm text-green-600 bg-green-500/10 rounded border border-green-500/20">{success}</div>}
          <Button className="w-full h-11" onClick={handleSendReset} disabled={loading}>
            {loading ? "发送中..." : "发送重置邮件"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

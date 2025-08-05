"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestWebhookPage() {
  const [result, setResult] = useState<string>("")

  const testWebhook = async () => {
    try {
      const testData = {
        event: "checkout.completed",
        data: {
          id: "test_checkout_id",
          status: "completed",
          metadata: {
            user_id: "b32f3ae7-14a2-4a23-890e-cf8b20f8bfd7",
            user_email: "shouxian2hao@sohu.com"
          }
        }
      }

      const response = await fetch("/api/creem/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(testData)
      })

      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setResult("测试失败: " + error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-2xl text-white">Webhook 测试</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button onClick={testWebhook} className="w-full">
            测试 Webhook
          </Button>
          
          {result && (
            <div className="bg-black/50 p-4 rounded-lg">
              <h3 className="text-white mb-2">测试结果:</h3>
              <pre className="text-green-400 text-sm overflow-auto">{result}</pre>
            </div>
          )}
          
          <div className="text-gray-300 text-sm">
            <p>这个页面用于测试 Creem webhook 是否正常工作。</p>
            <p>点击按钮会发送一个模拟的支付成功事件到 webhook。</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
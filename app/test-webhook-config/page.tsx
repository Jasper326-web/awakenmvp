"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from '@/lib/lang-context'

export default function TestWebhookConfig() {
  const { t } = useLanguage()
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testWebhook = async (eventType: string) => {
    setLoading(true)
    try {
      const testData = {
        eventType,
        object: {
          status: "completed",
          metadata: {
            user_id: "b32f3ae7-14a2-4a23-890e-cf8b20f8bfd7"
          },
          customer: {
            email: "shouxian2hao@sohu.com"
          },
          current_period_end_date: "2025-09-03T22:59:32.484Z"
        }
      }

      const response = await fetch('/api/creem/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-creem-signature': 'test-signature'
        },
        body: JSON.stringify(testData)
      })

      const result = await response.json()
      setTestResult({ eventType, status: response.status, data: result })
    } catch (error) {
      setTestResult({ eventType, error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  const eventTypes = [
    "checkout.completed",
    "subscription.paid", 
    "subscription.active",
    "subscription.canceled",
    "subscription.expired",
    "subscription.update",
    "subscription.trialing"
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Webhook 配置测试</h1>
          <p className="text-gray-300">测试各种webhook事件的处理</p>
        </div>

        <div className="grid gap-6">
          {/* 测试按钮 */}
          <Card className="bg-slate-800/50 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white">测试Webhook事件</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {eventTypes.map((eventType) => (
                  <Button
                    key={eventType}
                    onClick={() => testWebhook(eventType)}
                    disabled={loading}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {loading ? "测试中..." : eventType}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 测试结果 */}
          {testResult && (
            <Card className="bg-slate-800/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white">测试结果</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <strong className="text-orange-400">事件类型:</strong> {testResult.eventType}
                  </div>
                  {testResult.status && (
                    <div>
                      <strong className="text-orange-400">状态码:</strong> {testResult.status}
                    </div>
                  )}
                  {testResult.data && (
                    <div>
                      <strong className="text-orange-400">响应数据:</strong>
                      <pre className="mt-2 p-3 bg-gray-900 rounded text-sm text-green-400 overflow-auto">
                        {JSON.stringify(testResult.data, null, 2)}
                      </pre>
                    </div>
                  )}
                  {testResult.error && (
                    <div>
                      <strong className="text-red-400">错误:</strong>
                      <pre className="mt-2 p-3 bg-gray-900 rounded text-sm text-red-400 overflow-auto">
                        {testResult.error}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 配置信息 */}
          <Card className="bg-slate-800/50 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white">Webhook 配置信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-gray-300">
                <div><strong>本地测试URL:</strong> http://localhost:3000/api/creem/webhook</div>
                <div><strong>生产环境URL:</strong> https://awakenhub.org/api/creem/webhook</div>
                <div><strong>签名密钥:</strong> whsec_3woVhVYxiJieKtLjxfS77K</div>
                <div><strong>支持的事件:</strong> checkout.completed, subscription.paid, subscription.active, subscription.canceled, subscription.expired, subscription.update, subscription.trialing</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 
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
      // 根据Creem官方文档的结构
      const testData = {
        id: "evt_test_" + Date.now(),
        eventType,
        created_at: Date.now(),
        object: {
          id: eventType === "checkout.completed" ? "ch_test_" + Date.now() : "sub_test_" + Date.now(),
          object: eventType === "checkout.completed" ? "checkout" : "subscription",
          status: "completed",
          metadata: {
            internal_customer_id: "25936bb6-f478-4651-a102-0edbf02adcf8", // 实际用户ID
            user_email: "jdfz13zqy@gmail.com"
          },
          customer: {
            id: "cust_test_" + Date.now(),
            object: "customer",
            email: "jdfz13zqy@gmail.com",
            name: "Test User",
            country: "CN",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            mode: "test"
          },
          subscription: {
            id: "sub_2rVxhubJtJN8ZtsF37mWeC", // 实际subscription_id
            object: "subscription",
            status: "active",
            current_period_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            metadata: {
              internal_customer_id: "25936bb6-f478-4651-a102-0edbf02adcf8"
            }
          },
          current_period_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      }

      console.log("[Test Webhook] 发送测试数据:", testData)

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

  const testSimpleWebhook = async () => {
    setLoading(true)
    try {
      // 测试最简单的webhook结构（根据官方文档）
      const testData = {
        id: "evt_simple_test",
        eventType: "checkout.completed",
        created_at: Date.now(),
        object: {
          id: "ch_simple_test",
          object: "checkout",
          status: "completed",
          metadata: {
            internal_customer_id: "25936bb6-f478-4651-a102-0edbf02adcf8",
            user_email: "jdfz13zqy@gmail.com"
          },
          customer: {
            id: "cust_simple_test",
            object: "customer",
            email: "jdfz13zqy@gmail.com",
            name: "Test User",
            country: "CN",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            mode: "test"
          },
          subscription: {
            id: "sub_2rVxhubJtJN8ZtsF37mWeC",
            object: "subscription",
            status: "active",
            current_period_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            metadata: {
              internal_customer_id: "25936bb6-f478-4651-a102-0edbf02adcf8"
            }
          }
        }
      }

      console.log("[Test Simple Webhook] 发送测试数据:", testData)

      const response = await fetch('/api/creem/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-creem-signature': 'test-signature'
        },
        body: JSON.stringify(testData)
      })

      const result = await response.json()
      setTestResult({ eventType: "simple_test", status: response.status, data: result })
    } catch (error) {
      setTestResult({ eventType: "simple_test", error: String(error) })
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Webhook 测试配置</h1>
          <p className="text-gray-300">测试Creem支付webhook的各种事件类型（基于官方文档）</p>
        </div>

        <div className="grid gap-6">
          {/* 简单测试按钮 */}
          <Card className="bg-slate-800/50 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white">简单测试</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={testSimpleWebhook}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? "测试中..." : "测试简单Webhook结构（官方文档格式）"}
              </Button>
            </CardContent>
          </Card>

          {/* 测试按钮 */}
          <Card className="bg-slate-800/50 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white">测试 Webhook 事件</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {eventTypes.map((eventType) => (
                  <Button
                    key={eventType}
                    onClick={() => testWebhook(eventType)}
                    disabled={loading}
                    variant="outline"
                    className="text-sm"
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
                <div className="bg-slate-900 p-4 rounded-lg">
                  <pre className="text-green-400 text-sm overflow-auto">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
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
                <div><strong>测试用户ID:</strong> 25936bb6-f478-4651-a102-0edbf02adcf8</div>
                <div><strong>测试用户邮箱:</strong> jdfz13zqy@gmail.com</div>
                <div><strong>测试订阅ID:</strong> sub_2rVxhubJtJN8ZtsF37mWeC</div>
                <div><strong>文档结构:</strong> {`{ eventType: string, object: any, id: string, created_at: number }`}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 
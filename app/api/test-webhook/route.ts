import { NextRequest, NextResponse } from "next/server"
import { getBaseUrl } from "@/lib/constants"

export async function POST(req: NextRequest) {
  try {
    // 模拟支付成功的webhook数据 - 使用实际的用户ID
    const mockWebhookData = {
      eventType: "checkout.completed",
      object: {
        status: "completed",
        metadata: {
          user_id: "25936bb6-f478-4651-a102-0edbf02adcf8", // 实际用户ID
          user_email: "jdfz13zqy@gmail.com"
        },
        customer: {
          email: "jdfz13zqy@gmail.com"
        },
        subscription: {
          id: "sub_2rVxhubJtJN8ZtsF37mWeC", // 实际subscription_id
          current_period_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      }
    }

    console.log("[Test Webhook] 发送测试数据:", mockWebhookData)

    // 调用webhook处理函数
    const baseUrl = getBaseUrl()
    const webhookResponse = await fetch(`${baseUrl}/api/creem/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-creem-signature': 'test-signature'
      },
      body: JSON.stringify(mockWebhookData)
    })

    const result = await webhookResponse.json()
    
    console.log("[Test Webhook] Webhook响应:", result)
    
    return NextResponse.json({
      success: true,
      webhook_result: result,
      message: "手动触发webhook完成",
      base_url_used: baseUrl,
      test_data: mockWebhookData
    })
  } catch (error) {
    console.error("[Test Webhook] 错误:", error)
    return NextResponse.json({
      error: "手动触发webhook失败",
      details: String(error)
    }, { status: 500 })
  }
} 
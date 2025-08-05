import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    // 模拟支付成功的webhook数据
    const mockWebhookData = {
      eventType: "checkout.completed",
      object: {
        status: "completed",
        metadata: {
          user_id: "b32f3ae7-14a2-4a23-890e-cf8b20f8bfd7", // 你的用户ID
          user_email: "test@example.com"
        },
        customer: {
          email: "test@example.com"
        },
        subscription: {
          id: "sub_49YIUUleygApCneBob0URE", // 你的真实subscription_id
          current_period_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      }
    }

    // 调用webhook处理函数
    const webhookResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/creem/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-creem-signature': 'test-signature'
      },
      body: JSON.stringify(mockWebhookData)
    })

    const result = await webhookResponse.json()
    
    return NextResponse.json({
      success: true,
      webhook_result: result,
      message: "手动触发webhook完成"
    })
  } catch (error) {
    console.error("[Test Webhook] 错误:", error)
    return NextResponse.json({
      error: "手动触发webhook失败",
      details: String(error)
    }, { status: 500 })
  }
} 
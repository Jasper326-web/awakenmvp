import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log("[Webhook Test] 收到webhook请求:", body)
    
    // 记录请求头信息
    console.log("[Webhook Test] 请求头:", {
      'content-type': req.headers.get('content-type'),
      'user-agent': req.headers.get('user-agent'),
      'x-creem-signature': req.headers.get('x-creem-signature')
    })
    
    // 返回200状态码表示成功接收
    return NextResponse.json({ 
      success: true, 
      message: "Webhook received successfully",
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("[Webhook Test] 处理webhook失败:", error)
    return NextResponse.json({ 
      error: "Webhook processing failed", 
      details: String(error) 
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    message: "Webhook test endpoint is working",
    timestamp: new Date().toISOString()
  })
} 
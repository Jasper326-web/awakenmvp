import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const creemApiKey = process.env.CREEM_API_KEY
    if (!creemApiKey) {
      return NextResponse.json({ 
        error: "CREEM_API_KEY 未设置",
        status: "failed"
      }, { status: 500 })
    }

    // 测试Creem API连接 - 获取当前账户信息
    const response = await fetch('https://api.creem.io/v1/account', {
      method: 'GET',
      headers: {
        'x-api-key': creemApiKey,
        'Content-Type': 'application/json'
      }
    })

    console.log("[Test Creem Connection] API响应状态:", response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error("[Test Creem Connection] API调用失败:", errorText)
      return NextResponse.json({ 
        error: "Creem API连接失败",
        status: response.status,
        details: errorText,
        result: "failed"
      }, { status: 500 })
    }

    const data = await response.json()
    return NextResponse.json({ 
      message: "Creem API连接成功",
      status: "success",
      data: data
    })
  } catch (error) {
    console.error("[Test Creem Connection] 异常:", error)
    return NextResponse.json({ 
      error: "测试Creem连接时发生异常",
      details: String(error),
      status: "failed"
    }, { status: 500 })
  }
} 
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const envInfo = {
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "已设置" : "未设置",
      supabase_anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "已设置" : "未设置",
      supabase_service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? "已设置" : "未设置",
      creem_api_key: process.env.CREEM_API_KEY ? "已设置" : "未设置",
      creem_product_id: process.env.CREEM_PRODUCT_ID ? "已设置" : "未设置",
      base_url: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    }

    return NextResponse.json(envInfo)
  } catch (error) {
    return NextResponse.json({ error: "检查环境变量失败", details: String(error) }, { status: 500 })
  }
} 
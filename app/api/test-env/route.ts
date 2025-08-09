import { NextRequest, NextResponse } from "next/server"
import { getBaseUrl } from "@/lib/constants"

export async function GET(req: NextRequest) {
  try {
    const envInfo = {
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "已设置" : "未设置",
      supabase_anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "已设置" : "未设置",
      supabase_service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? "已设置" : "未设置",
      creem_api_key: process.env.CREEM_API_KEY ? "已设置" : "未设置",
      creem_product_id: process.env.CREEM_PRODUCT_ID ? "已设置" : "未设置",
      base_url: getBaseUrl(),
      next_public_site_url: process.env.NEXT_PUBLIC_SITE_URL || "未设置",
      next_public_base_url: process.env.NEXT_PUBLIC_BASE_URL || "未设置",
      node_env: process.env.NODE_ENV || "未设置"
    }

    return NextResponse.json(envInfo)
  } catch (error) {
    return NextResponse.json({ error: "检查环境变量失败", details: String(error) }, { status: 500 })
  }
} 
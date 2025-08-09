import { NextRequest, NextResponse } from "next/server";
import { Creem } from "creem";
import { getBaseUrl } from "@/lib/constants";

console.log("[Creem] 环境变量测试：", process.env.CREEM_API_KEY, process.env.CREEM_PRODUCT_ID);

const creem = new Creem();

import { authService } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    console.log("[Creem] 开始创建支付会话");
    
    // 获取当前用户
    const currentUser = await authService.getCurrentUserFromRequest(req);
    if (!currentUser) {
      console.error("[Creem] 用户未登录");
      return NextResponse.json({ error: "用户未登录" }, { status: 401 });
    }
    
    const productId = process.env.CREEM_PRODUCT_ID || "prod_68101COr0cq1EFgCUGABrp";
    const xApiKey = process.env.CREEM_API_KEY;
    if (!productId || !xApiKey) {
      console.error("[Creem] 缺少产品ID或API Key", { productId, xApiKey });
      return NextResponse.json({ error: "缺少产品ID或API Key" }, { status: 500 });
    }
    
    // 创建支付会话，包含用户信息和成功回调URL
    const baseUrl = getBaseUrl();
    console.log("[Creem] 使用的baseUrl:", baseUrl);
    console.log("[Creem] 环境变量检查:", {
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      NODE_ENV: process.env.NODE_ENV
    });
    
    const successUrl = `${baseUrl}/payment/creem-success?status=completed&checkout_id={checkout_id}`;
    console.log("[Creem] 生成的successUrl:", successUrl);
    
    const checkout = await creem.createCheckout({
      createCheckoutRequest: {
        productId,
        metadata: {
          user_id: currentUser.id,
          user_email: currentUser.email
        },
        successUrl: successUrl
      },
      xApiKey,
    });
    console.log("[Creem] createCheckout返回：", checkout);
    if (!checkout?.checkoutUrl) {
      console.error("[Creem] Creem未返回支付链接", checkout);
      return NextResponse.json({ error: "Creem未返回支付链接" }, { status: 500 });
    }
    return NextResponse.json({ checkout_url: checkout.checkoutUrl });
  } catch (e) {
    console.error("[Creem] 创建支付链接失败", e);
    return NextResponse.json({ error: "创建支付链接失败", details: String(e) }, { status: 500 });
  }
} 
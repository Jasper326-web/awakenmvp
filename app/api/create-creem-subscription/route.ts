import { NextRequest, NextResponse } from "next/server";
import { Creem } from "creem";

console.log("[Creem Subscription] 环境变量测试：", process.env.CREEM_API_KEY, process.env.CREEM_SUBSCRIPTION_PRODUCT_ID);

const creem = new Creem();

import { authService } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    console.log("[Creem Subscription] 开始创建订阅支付会话");
    
    // 获取当前用户
    const currentUser = await authService.getCurrentUserFromRequest(req);
    if (!currentUser) {
      console.error("[Creem Subscription] 用户未登录");
      return NextResponse.json({ error: "用户未登录" }, { status: 401 });
    }
    
    // 使用订阅产品ID（需要在Creem后台创建）
    const subscriptionProductId = process.env.CREEM_SUBSCRIPTION_PRODUCT_ID || "prod_subscription_xxx";
    const xApiKey = process.env.CREEM_API_KEY;
    
    if (!subscriptionProductId || !xApiKey) {
      console.error("[Creem Subscription] 缺少订阅产品ID或API Key", { subscriptionProductId, xApiKey });
      return NextResponse.json({ error: "缺少订阅产品ID或API Key" }, { status: 500 });
    }
    
    // 创建订阅支付会话
    const checkout = await creem.createCheckout({
      createCheckoutRequest: {
        productId: subscriptionProductId,
        metadata: {
          user_id: currentUser.id,
          user_email: currentUser.email
        },
        successUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/creem-success?status=completed&checkout_id={checkout_id}`
      },
      xApiKey,
    });
    
    console.log("[Creem Subscription] createCheckout返回：", checkout);
    
    if (!checkout?.checkoutUrl) {
      console.error("[Creem Subscription] Creem未返回支付链接", checkout);
      return NextResponse.json({ error: "Creem未返回支付链接" }, { status: 500 });
    }
    
    return NextResponse.json({ checkout_url: checkout.checkoutUrl });
  } catch (e) {
    console.error("[Creem Subscription] 创建订阅支付链接失败", e);
    return NextResponse.json({ error: "创建订阅支付链接失败", details: String(e) }, { status: 500 });
  }
} 
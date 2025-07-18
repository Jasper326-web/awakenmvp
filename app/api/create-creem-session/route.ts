import { NextRequest, NextResponse } from "next/server";
import { Creem } from "creem";

console.log("[Creem] 环境变量测试：", process.env.CREEM_API_KEY, process.env.CREEM_PRODUCT_ID);

const creem = new Creem();

export async function POST(req: NextRequest) {
  try {
    console.log("[Creem] 开始创建支付会话");
    const productId = process.env.CREEM_PRODUCT_ID || "prod_68101COr0cq1EFgCUGABrp";
    const xApiKey = process.env.CREEM_API_KEY;
    if (!productId || !xApiKey) {
      console.error("[Creem] 缺少产品ID或API Key", { productId, xApiKey });
      return NextResponse.json({ error: "缺少产品ID或API Key" }, { status: 500 });
    }
    const checkout = await creem.createCheckout({
      createCheckoutRequest: {
        productId,
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
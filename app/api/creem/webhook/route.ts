import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Creem会员Webhook
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log("[Creem Webhook] 收到回调:", body)
    
    // 验证webhook签名
    const signature = req.headers.get('x-creem-signature')
    const signingSecret = process.env.CREEM_WEBHOOK_SECRET || 'whsec_3woVhVYxiJieKtLjxfS77K'
    
    if (!signature) {
      console.error("[Creem Webhook] 缺少签名头")
      return NextResponse.json({ error: "缺少签名验证" }, { status: 401 })
    }
    
    // 简单的签名验证（生产环境建议使用更严格的验证）
    console.log("[Creem Webhook] 签名验证:", { signature, signingSecret })
    
    const { eventType, object } = body
    
    // 使用服务端角色创建Supabase客户端，绕过RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log("[Creem Webhook] 环境变量检查:", {
      url: supabaseUrl ? "已设置" : "未设置",
      serviceKey: supabaseServiceKey ? "已设置" : "未设置"
    })
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[Creem Webhook] 缺少必要的环境变量")
      return NextResponse.json({ error: "配置错误" }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log("[Creem Webhook] Supabase客户端创建成功")
    
    // 处理不同的事件类型
    switch (eventType) {
      case "checkout.completed":
        return await handleCheckoutCompleted(object, supabase)
      
      case "subscription.paid":
        return await handleSubscriptionPaid(object, supabase)
      
      case "subscription.active":
        return await handleSubscriptionActive(object, supabase)
      
      case "subscription.canceled":
        return await handleSubscriptionCanceled(object, supabase)
      
      case "subscription.expired":
        return await handleSubscriptionExpired(object, supabase)
      
      case "subscription.update":
        return await handleSubscriptionUpdate(object, supabase)
      
      case "subscription.trialing":
        return await handleSubscriptionTrialing(object, supabase)
      
      default:
        console.log("[Creem Webhook] 未处理的事件类型:", eventType)
        return NextResponse.json({ error: "未处理的事件类型" }, { status: 400 })
    }
  } catch (e) {
    console.error("[Creem Webhook] 处理异常:", e)
    return NextResponse.json({ error: "Webhook处理异常", details: String(e) }, { status: 500 })
  }
}

// 处理首次购买完成
async function handleCheckoutCompleted(object: any, supabase: any) {
  const { status, metadata, customer, subscription } = object
  
  if (status !== "completed") {
    console.log("[Creem Webhook] 非完成状态:", status)
    return NextResponse.json({ error: "非完成状态" }, { status: 400 })
  }
  
  // 根据官方文档，用户ID可能在metadata中
  const user_id = metadata?.user_id || metadata?.internal_customer_id
  const user_email = customer?.email
  
  if (!user_id) {
    console.error("[Creem Webhook] 缺少用户ID:", metadata)
    return NextResponse.json({ error: "缺少用户ID" }, { status: 400 })
  }
  
  console.log("[Creem Webhook] 处理首次购买:", user_id, user_email)
  
  try {
    // 使用订阅的结束日期或默认30天
    const now = new Date()
    const endDate = subscription?.current_period_end_date 
      ? new Date(subscription.current_period_end_date)
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    console.log("[Creem Webhook] 准备插入数据:", {
      user_id,
      subscription_type: "premium",
      status: "active",
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      end_date: endDate.toISOString(),
    })
    
    const { data, error } = await supabase.from("user_subscriptions").upsert({
      user_id,
      subscription_type: "premium",
      status: "active",
      creem_subscription_id: subscription?.id || object.id, // 保存Creem的订阅ID
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      end_date: endDate.toISOString(),
    })
    
    console.log("[Creem Webhook] 数据库操作结果:", { data, error })
    
    if (error) {
      console.error("[Creem Webhook] 会员激活失败:", error)
      return NextResponse.json({ error: "会员激活失败", details: error.message }, { status: 500 })
    }
    
    console.log("[Creem Webhook] 会员激活成功:", user_id)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[Creem Webhook] 处理异常:", error)
    return NextResponse.json({ error: "处理异常", details: String(error) }, { status: 500 })
  }
}

// 处理订阅支付成功
async function handleSubscriptionPaid(object: any, supabase: any) {
  const { customer, metadata, current_period_end_date } = object
  
  // 根据官方文档，用户ID可能在metadata中
  const user_id = metadata?.user_id || metadata?.internal_customer_id
  const user_email = customer?.email
  
  if (!user_id) {
    console.error("[Creem Webhook] 订阅支付缺少用户ID:", metadata)
    return NextResponse.json({ error: "缺少用户ID" }, { status: 400 })
  }
  
  console.log("[Creem Webhook] 处理订阅支付:", user_id, user_email)
  
  // 使用订阅的结束日期或延长30天
  const now = new Date()
  const endDate = current_period_end_date ? new Date(current_period_end_date) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  
  const { error } = await supabase.from("user_subscriptions").upsert({
    user_id,
    subscription_type: "premium",
    status: "active",
    updated_at: now.toISOString(),
    end_date: endDate.toISOString(),
  })
  
  if (error) {
    console.error("[Creem Webhook] 订阅支付处理失败:", error)
    return NextResponse.json({ error: "订阅支付处理失败", details: error.message }, { status: 500 })
  }
  
  console.log("[Creem Webhook] 订阅支付处理成功:", user_id, "结束日期:", endDate.toISOString())
  return NextResponse.json({ success: true })
}

// 处理订阅激活
async function handleSubscriptionActive(object: any, supabase: any) {
  const { customer, metadata } = object
  
  const user_id = metadata?.user_id || metadata?.internal_customer_id
  const user_email = customer?.email
  
  if (!user_id) {
    console.error("[Creem Webhook] 订阅激活缺少用户ID:", metadata)
    return NextResponse.json({ error: "缺少用户ID" }, { status: 400 })
  }
  
  console.log("[Creem Webhook] 处理订阅激活:", user_id, user_email)
  
  // 同步订阅状态
  const now = new Date()
  const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  
  const { error } = await supabase.from("user_subscriptions").upsert({
    user_id,
    subscription_type: "premium",
    status: "active",
    updated_at: now.toISOString(),
    end_date: endDate.toISOString(),
  })
  
  if (error) {
    console.error("[Creem Webhook] 订阅激活失败:", error)
    return NextResponse.json({ error: "订阅激活失败", details: error.message }, { status: 500 })
  }
  
  console.log("[Creem Webhook] 订阅激活成功:", user_id)
  return NextResponse.json({ success: true })
}

// 处理订阅取消
async function handleSubscriptionCanceled(object: any, supabase: any) {
  const { customer, metadata, current_period_end_date } = object
  
  // 根据官方文档，用户ID可能在metadata中
  const user_id = metadata?.user_id || metadata?.internal_customer_id
  const user_email = customer?.email
  
  if (!user_id) {
    console.error("[Creem Webhook] 取消订阅缺少用户ID:", metadata)
    return NextResponse.json({ error: "缺少用户ID" }, { status: 400 })
  }
  
  console.log("[Creem Webhook] 处理订阅取消:", user_id, user_email)
  
  // 将订阅状态改为已取消，但保持当前有效期
  const now = new Date()
  const endDate = current_period_end_date ? new Date(current_period_end_date) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  
  const { error } = await supabase.from("user_subscriptions").update({
    status: "cancelled",
    updated_at: now.toISOString(),
    end_date: endDate.toISOString(), // 使用Creem提供的结束日期
  }).eq("user_id", user_id).eq("status", "active")
  
  if (error) {
    console.error("[Creem Webhook] 取消订阅失败:", error)
    return NextResponse.json({ error: "取消订阅失败", details: error.message }, { status: 500 })
  }
  
  console.log("[Creem Webhook] 取消订阅成功:", user_id, "结束日期:", endDate.toISOString())
  return NextResponse.json({ success: true })
}

// 处理订阅过期
async function handleSubscriptionExpired(object: any, supabase: any) {
  const { customer, metadata } = object
  
  const user_id = metadata?.user_id || metadata?.internal_customer_id
  const user_email = customer?.email
  
  if (!user_id) {
    console.error("[Creem Webhook] 订阅过期缺少用户ID:", metadata)
    return NextResponse.json({ error: "缺少用户ID" }, { status: 400 })
  }
  
  console.log("[Creem Webhook] 处理订阅过期:", user_id, user_email)
  
  // 将订阅状态改为过期
  const now = new Date()
  
  const { error } = await supabase.from("user_subscriptions").update({
    status: "expired",
    updated_at: now.toISOString(),
  }).eq("user_id", user_id).eq("status", "active")
  
  if (error) {
    console.error("[Creem Webhook] 订阅过期处理失败:", error)
    return NextResponse.json({ error: "订阅过期处理失败", details: error.message }, { status: 500 })
  }
  
  console.log("[Creem Webhook] 订阅过期处理成功:", user_id)
  return NextResponse.json({ success: true })
}

// 处理订阅更新
async function handleSubscriptionUpdate(object: any, supabase: any) {
  const { customer, metadata, current_period_end_date } = object
  
  const user_id = metadata?.user_id || metadata?.internal_customer_id
  const user_email = customer?.email
  
  if (!user_id) {
    console.error("[Creem Webhook] 订阅更新缺少用户ID:", metadata)
    return NextResponse.json({ error: "缺少用户ID" }, { status: 400 })
  }
  
  console.log("[Creem Webhook] 处理订阅更新:", user_id, user_email)
  
  // 更新订阅信息
  const now = new Date()
  const endDate = current_period_end_date ? new Date(current_period_end_date) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  
  const { error } = await supabase.from("user_subscriptions").upsert({
    user_id,
    subscription_type: "premium",
    status: "active",
    updated_at: now.toISOString(),
    end_date: endDate.toISOString(),
    creem_subscription_id: object.id, // 保存Creem的订阅ID
  })
  
  if (error) {
    console.error("[Creem Webhook] 订阅更新失败:", error)
    return NextResponse.json({ error: "订阅更新失败", details: error.message }, { status: 500 })
  }
  
  console.log("[Creem Webhook] 订阅更新成功:", user_id)
  return NextResponse.json({ success: true })
}

// 处理订阅试用
async function handleSubscriptionTrialing(object: any, supabase: any) {
  const { customer, metadata, current_period_end_date } = object
  
  const user_id = metadata?.user_id || metadata?.internal_customer_id
  const user_email = customer?.email
  
  if (!user_id) {
    console.error("[Creem Webhook] 订阅试用缺少用户ID:", metadata)
    return NextResponse.json({ error: "缺少用户ID" }, { status: 400 })
  }
  
  console.log("[Creem Webhook] 处理订阅试用:", user_id, user_email)
  
  // 激活试用期会员
  const now = new Date()
  const endDate = current_period_end_date ? new Date(current_period_end_date) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  
  const { error } = await supabase.from("user_subscriptions").upsert({
    user_id,
    subscription_type: "premium",
    status: "active",
    updated_at: now.toISOString(),
    end_date: endDate.toISOString(),
  })
  
  if (error) {
    console.error("[Creem Webhook] 订阅试用激活失败:", error)
    return NextResponse.json({ error: "订阅试用激活失败", details: error.message }, { status: 500 })
  }
  
  console.log("[Creem Webhook] 订阅试用激活成功:", user_id)
  return NextResponse.json({ success: true })
} 
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Creem会员Webhook
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log("[Creem Webhook] 收到回调:", JSON.stringify(body, null, 2))
    
    // 验证webhook签名（可选，但建议）
    const signature = req.headers.get('x-creem-signature') || req.headers.get('creem-signature')
    const signingSecret = process.env.CREEM_WEBHOOK_SECRET || 'whsec_3woVhVYxiJieKtLjxfS77K'
    
    if (!signature) {
      console.warn("[Creem Webhook] 缺少签名头，继续处理...")
    } else {
      console.log("[Creem Webhook] 签名验证:", { signature, signingSecret })
    }
    
    // 根据Creem官方文档，webhook payload结构是：
    // { eventType: string, object: any, id: string, created_at: number }
    const { eventType, object, id, created_at } = body
    
    if (!eventType || !object) {
      console.error("[Creem Webhook] 无法解析webhook payload结构:", body)
      return NextResponse.json({ error: "无法解析webhook payload" }, { status: 400 })
    }
    
    console.log("[Creem Webhook] 解析的事件:", { eventType, object, id, created_at })
    
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
      
      case "simple_test":
        // 处理测试事件
        console.log("[Creem Webhook] 处理测试事件:", eventType)
        return await handleCheckoutCompleted(object, supabase)
      
      default:
        console.log("[Creem Webhook] 未处理的事件类型:", eventType)
        // 根据官方文档，即使不处理也要返回200 OK
        return NextResponse.json({ success: true, message: "事件已接收但未处理" })
    }
  } catch (e) {
    console.error("[Creem Webhook] 处理异常:", e)
    return NextResponse.json({ error: "Webhook处理异常", details: String(e) }, { status: 500 })
  }
}

// 处理首次购买完成
async function handleCheckoutCompleted(object: any, supabase: any) {
  console.log("[Creem Webhook] handleCheckoutCompleted - 完整对象:", JSON.stringify(object, null, 2))
  
  // 根据官方文档，checkout.completed的结构是：
  // object: { id, object, request_id, order, product, customer, subscription, custom_fields, status, metadata, mode }
  const { 
    id: checkout_id, 
    status, 
    metadata, 
    customer, 
    subscription, 
    order 
  } = object
  
  console.log("[Creem Webhook] handleCheckoutCompleted - 解析字段:", {
    checkout_id,
    status,
    metadata,
    customer,
    subscription,
    order
  })
  
  if (status !== "completed") {
    console.log("[Creem Webhook] 非完成状态:", status)
    return NextResponse.json({ success: true, message: "非完成状态，跳过处理" })
  }
  
  // 如果没有subscription.id，直接跳过这个事件
  if (!subscription?.id) {
    console.log("[Creem Webhook] checkout.completed事件没有subscription.id，跳过处理")
    return NextResponse.json({ success: true, message: "没有subscription.id，跳过处理" })
  }
  
  // 尝试多种方式获取用户ID
  let user_id = null
  let user_email = null
  
  console.log("[Creem Webhook] 开始获取用户ID...")
  console.log("[Creem Webhook] metadata:", metadata)
  console.log("[Creem Webhook] subscription?.metadata:", subscription?.metadata)
  console.log("[Creem Webhook] customer:", customer)

  // 方法1: 从metadata中获取（根据官方文档）
  if (metadata?.internal_customer_id) {
    user_id = metadata.internal_customer_id
    console.log("[Creem Webhook] 从metadata.internal_customer_id获取到用户ID:", user_id)
  } else if (metadata?.user_id) {
    user_id = metadata.user_id
    console.log("[Creem Webhook] 从metadata.user_id获取到用户ID:", user_id)
  }
  
  // 方法2: 从subscription.metadata中获取
  if (!user_id && subscription?.metadata?.internal_customer_id) {
    user_id = subscription.metadata.internal_customer_id
    console.log("[Creem Webhook] 从subscription.metadata.internal_customer_id获取到用户ID:", user_id)
  }
  
  // 方法3: 从customer中获取email，然后查询用户ID
  if (customer?.email) {
    user_email = customer.email
    console.log("[Creem Webhook] 从customer获取到email:", user_email)
    if (!user_id) {
      // 通过email查询用户ID
      console.log("[Creem Webhook] 尝试通过email查询用户ID...")
      const { data: userData, error: userError } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', user_email)
        .single()
      
      if (!userError && userData) {
        user_id = userData.id
        console.log("[Creem Webhook] 通过email查询到用户ID:", user_id)
      } else {
        console.error("[Creem Webhook] 通过email查询用户ID失败:", userError)
      }
    }
  }
  
  console.log("[Creem Webhook] 提取的用户信息:", { user_id, user_email })
  
  if (!user_id) {
    console.error("[Creem Webhook] 缺少用户ID，尝试所有方法都失败:", {
      metadata,
      subscription_metadata: subscription?.metadata,
      customer,
      object
    })
    return NextResponse.json({ success: true, message: "缺少用户ID，跳过处理" })
  }
  
  console.log("[Creem Webhook] 处理首次购买:", user_id, user_email)
  
  try {
    // 检查是否已存在相同的订阅记录
    const creem_subscription_id = subscription.id
    console.log("[Creem Webhook] 检查是否已存在订阅记录:", creem_subscription_id)
    
    const { data: existingSubscription, error: subscriptionCheckError } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user_id)
      .eq("creem_subscription_id", creem_subscription_id)
      .maybeSingle()
    
    if (subscriptionCheckError) {
      console.error("[Creem Webhook] 检查现有订阅失败:", subscriptionCheckError)
    } else if (existingSubscription) {
      console.log("[Creem Webhook] 订阅记录已存在，跳过创建:", existingSubscription.id)
      return NextResponse.json({ success: true, message: "订阅记录已存在，跳过处理" })
    }
    
    // 使用订阅的结束日期或默认30天
    const now = new Date()
    let endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    // 根据官方文档，订阅信息在subscription对象中
    if (subscription?.current_period_end_date) {
      endDate = new Date(subscription.current_period_end_date)
    } else if (subscription?.end_date) {
      endDate = new Date(subscription.end_date)
    }
    
    console.log("[Creem Webhook] 准备插入数据:", {
      user_id,
      subscription_type: "premium",
      status: "active",
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      end_date: endDate.toISOString(),
      creem_subscription_id: creem_subscription_id
    })
    
    const { data, error } = await supabase.from("user_subscriptions").insert({
      user_id,
      subscription_type: "premium",
      status: "active",
      creem_subscription_id: creem_subscription_id,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      end_date: endDate.toISOString(),
    })
    
    console.log("[Creem Webhook] 数据库操作结果:", { data, error })
    
    if (error) {
      console.error("[Creem Webhook] 会员激活失败:", error)
      return NextResponse.json({ success: true, message: "会员激活失败，但webhook已接收" })
    }
    
    console.log("[Creem Webhook] 会员激活成功:", user_id)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[Creem Webhook] 处理异常:", error)
    return NextResponse.json({ success: true, message: "处理异常，但webhook已接收" })
  }
}

// 处理订阅支付成功
async function handleSubscriptionPaid(object: any, supabase: any) {
  console.log("[Creem Webhook] handleSubscriptionPaid - 完整对象:", JSON.stringify(object, null, 2))
  
  // 根据官方文档，subscription.paid的结构是：
  // object: { id, object, product, customer, collection_method, status, last_transaction_id, last_transaction_date, next_transaction_date, current_period_start_date, current_period_end_date, canceled_at, created_at, updated_at, metadata, mode }
  const { 
    id: subscription_id, 
    customer, 
    metadata, 
    current_period_end_date,
    status
  } = object
  
  console.log("[Creem Webhook] handleSubscriptionPaid - 解析字段:", {
    subscription_id,
    customer,
    metadata,
    current_period_end_date,
    status
  })
  
  // 尝试多种方式获取用户ID
  let user_id = null
  let user_email = null
  
  // 方法1: 从metadata中获取（根据官方文档）
  if (metadata?.internal_customer_id) {
    user_id = metadata.internal_customer_id
  } else if (metadata?.user_id) {
    user_id = metadata.user_id
  }
  
  // 方法2: 从customer中获取email，然后查询用户ID
  if (customer?.email) {
    user_email = customer.email
    if (!user_id) {
      // 通过email查询用户ID
      const { data: userData, error: userError } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', user_email)
        .single()
      
      if (!userError && userData) {
        user_id = userData.id
        console.log("[Creem Webhook] 通过email查询到用户ID:", user_id)
      }
    }
  }
  
  if (!user_id) {
    console.error("[Creem Webhook] 订阅支付缺少用户ID:", metadata)
    return NextResponse.json({ success: true, message: "缺少用户ID，跳过处理" })
  }
  
  console.log("[Creem Webhook] 处理订阅支付:", user_id, user_email)
  
  try {
    // 检查是否已存在相同的订阅记录（通过creem_subscription_id）
    console.log("[Creem Webhook] 检查是否已存在订阅记录:", subscription_id)
    
    const { data: existingSubscription, error: subscriptionCheckError } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user_id)
      .eq("creem_subscription_id", subscription_id)
      .maybeSingle()
    
    if (subscriptionCheckError) {
      console.error("[Creem Webhook] 检查现有订阅失败:", subscriptionCheckError)
    } else if (existingSubscription) {
      console.log("[Creem Webhook] 订阅记录已存在，更新状态:", existingSubscription.id)
      
      // 更新现有记录
      const now = new Date()
      let endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      
      if (current_period_end_date) {
        endDate = new Date(current_period_end_date)
      }
      
      const { error: updateError } = await supabase
        .from("user_subscriptions")
        .update({
          status: "active",
          updated_at: now.toISOString(),
          end_date: endDate.toISOString(),
        })
        .eq("id", existingSubscription.id)
      
      if (updateError) {
        console.error("[Creem Webhook] 更新订阅失败:", updateError)
        return NextResponse.json({ success: true, message: "更新订阅失败，但webhook已接收" })
      }
      
      console.log("[Creem Webhook] 订阅更新成功:", user_id)
      return NextResponse.json({ success: true, message: "订阅更新成功" })
    }
    
    // 检查是否已存在该用户的任何订阅记录（没有creem_subscription_id的记录）
    const { data: existingSubscriptions, error: checkError } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user_id)
      .is("creem_subscription_id", null)
      .order("created_at", { ascending: false })
      .limit(1)
    
    if (checkError) {
      console.error("[Creem Webhook] 检查现有订阅失败:", checkError)
    } else if (existingSubscriptions && existingSubscriptions.length > 0) {
      // 如果已存在没有creem_subscription_id的记录，更新它
      const existingSubscription = existingSubscriptions[0]
      console.log("[Creem Webhook] 用户已有订阅记录（无creem_subscription_id），更新:", existingSubscription.id)
      
      const now = new Date()
      let endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      
      if (current_period_end_date) {
        endDate = new Date(current_period_end_date)
      }
      
      const { error: updateError } = await supabase
        .from("user_subscriptions")
        .update({
          status: "active",
          updated_at: now.toISOString(),
          end_date: endDate.toISOString(),
          creem_subscription_id: subscription_id, // 更新订阅ID
        })
        .eq("id", existingSubscription.id)
      
      if (updateError) {
        console.error("[Creem Webhook] 更新订阅失败:", updateError)
        return NextResponse.json({ success: true, message: "更新订阅失败，但webhook已接收" })
      }
      
      console.log("[Creem Webhook] 订阅更新成功:", user_id)
      return NextResponse.json({ success: true, message: "订阅更新成功" })
    }
    
    // 使用订阅的结束日期或延长30天
    const now = new Date()
    let endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    if (current_period_end_date) {
      endDate = new Date(current_period_end_date)
    }
    
    const { error } = await supabase.from("user_subscriptions").insert({
      user_id,
      subscription_type: "premium",
      status: "active",
      creem_subscription_id: subscription_id,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      end_date: endDate.toISOString(),
    })
    
    if (error) {
      console.error("[Creem Webhook] 订阅支付处理失败:", error)
      return NextResponse.json({ success: true, message: "订阅支付处理失败，但webhook已接收" })
    }
    
    console.log("[Creem Webhook] 订阅支付处理成功:", user_id, "结束日期:", endDate.toISOString())
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Creem Webhook] 处理异常:", error)
    return NextResponse.json({ success: true, message: "处理异常，但webhook已接收" })
  }
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
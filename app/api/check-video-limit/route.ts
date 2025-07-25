import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    
    if (!userId) {
      return NextResponse.json({ error: "用户ID不能为空" }, { status: 400 })
    }

    // 检查用户是否为会员
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from("user_subscriptions")
      .select("subscription_type, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle()

    if (subscriptionError) {
      console.error("查询订阅信息失败:", subscriptionError)
      // 对于非会员用户，subscriptionData为null是正常的
    }

    // 判断是否为会员用户
    const isPremium = subscriptionData && 
      (subscriptionData.subscription_type === "premium" || subscriptionData.subscription_type === "pro")

    if (isPremium) {
      // 会员用户无限制
      return NextResponse.json({ 
        canUpload: true, 
        isPremium: true,
        remainingCount: -1, // -1 表示无限制
        message: "会员用户无限制" 
      })
    }

    // 免费用户：统计当月视频打卡次数
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const { data: videoRecords, error: videoError } = await supabase
      .from("video_records")
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", startOfMonth.toISOString())
      .lte("created_at", endOfMonth.toISOString())

    if (videoError) {
      console.error("查询视频记录失败:", videoError)
      return NextResponse.json({ error: "查询视频记录失败" }, { status: 500 })
    }

    const monthlyVideoCount = videoRecords?.length || 0
    const maxFreeVideos = 3
    const remainingCount = Math.max(0, maxFreeVideos - monthlyVideoCount)
    const canUpload = remainingCount > 0

    return NextResponse.json({
      canUpload,
      isPremium: false,
      remainingCount,
      monthlyVideoCount,
      maxFreeVideos,
      message: canUpload 
        ? `您本月还有 ${remainingCount} 次免费视频打卡机会` 
        : "您本月的免费打卡次数已用完，升级为会员享受无限次打卡"
    })

  } catch (error) {
    console.error("检查视频限制失败:", error)
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 })
  }
} 
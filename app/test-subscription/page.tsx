"use client"

import { useEffect, useState } from "react"
import { authService } from "@/lib/auth"
import { subscriptionService } from "@/lib/subscription"
import { supabase } from "@/lib/supabaseClient"

export default function TestSubscriptionPage() {
  const [user, setUser] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [subscriptionHistory, setSubscriptionHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const currentUser = await authService.getCurrentUser()
        if (!currentUser) {
          setLoading(false)
          return
        }

        setUser(currentUser)

        // 获取订阅状态
        const subscriptionStatus = await subscriptionService.getUserSubscriptionStatus(currentUser.id)
        setSubscription(subscriptionStatus)

        // 获取原始订阅数据
        const { data: rawSubscription, error } = await supabase
          .from("user_subscriptions")
          .select("*")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false })

        console.log("原始订阅数据:", rawSubscription)
        console.log("处理后的订阅状态:", subscriptionStatus)

        // 获取订阅历史记录
        const { data: history, error: historyError } = await supabase
          .from("user_subscriptions")
          .select("*")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false })

        if (!historyError && history) {
          setSubscriptionHistory(history)
        }

      } catch (error) {
        console.error("检查订阅状态失败:", error)
      } finally {
        setLoading(false)
      }
    }

    checkSubscription()
  }, [])

  if (loading) {
    return <div className="p-8">加载中...</div>
  }

  if (!user) {
    return <div className="p-8">请先登录</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">订阅状态测试</h1>
      
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">用户信息</h2>
          <div className="space-y-2">
            <p><strong>用户ID:</strong> {user.id}</p>
            <p><strong>邮箱:</strong> {user.email}</p>
            <p><strong>创建时间:</strong> {new Date(user.created_at).toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">当前订阅状态</h2>
          {subscription ? (
            <div className="space-y-2">
              <p><strong>订阅类型:</strong> {subscription.subscription_type}</p>
              <p><strong>状态:</strong> {subscription.status}</p>
              <p><strong>是否过期:</strong> {subscription.is_expired ? "是" : "否"}</p>
              <p><strong>是否Pro:</strong> {subscription.is_pro ? "是" : "否"}</p>
              <p><strong>是否Premium:</strong> {subscription.is_premium ? "是" : "否"}</p>
              <p><strong>结束日期:</strong> {subscription.end_date ? new Date(subscription.end_date).toLocaleString() : "无"}</p>
              <p><strong>剩余天数:</strong> {subscription.days_remaining !== null ? subscription.days_remaining : "无"}</p>
            </div>
          ) : (
            <p>无法获取订阅信息</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">订阅历史记录</h2>
          {subscriptionHistory.length > 0 ? (
            <div className="space-y-4">
              {subscriptionHistory.map((record, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p><strong>记录 {index + 1}</strong></p>
                      <p><strong>订阅类型:</strong> {record.subscription_type}</p>
                      <p><strong>状态:</strong> {record.status}</p>
                      <p><strong>创建时间:</strong> {new Date(record.created_at).toLocaleString()}</p>
                      <p><strong>更新时间:</strong> {new Date(record.updated_at).toLocaleString()}</p>
                      {record.end_date && (
                        <p><strong>结束日期:</strong> {new Date(record.end_date).toLocaleString()}</p>
                      )}
                      {record.activated_at && (
                        <p><strong>激活时间:</strong> {new Date(record.activated_at).toLocaleString()}</p>
                      )}
                      {record.order_id && (
                        <p><strong>订单ID:</strong> {record.order_id}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs ${
                        record.status === 'active' ? 'bg-green-100 text-green-800' :
                        record.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        record.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {record.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>暂无订阅历史记录</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">功能权限测试</h2>
          <div className="space-y-2">
            <p><strong>无限打卡:</strong> {subscriptionService.checkFeatureAccess(subscription, "unlimited_checkins") ? "✅" : "❌"}</p>
            <p><strong>自定义提醒:</strong> {subscriptionService.checkFeatureAccess(subscription, "custom_reminders") ? "✅" : "❌"}</p>
            <p><strong>完整排行榜:</strong> {subscriptionService.checkFeatureAccess(subscription, "full_leaderboard") ? "✅" : "❌"}</p>
            <p><strong>高级筛选:</strong> {subscriptionService.checkFeatureAccess(subscription, "advanced_filters") ? "✅" : "❌"}</p>
            <p><strong>高级内容:</strong> {subscriptionService.checkFeatureAccess(subscription, "premium_content") ? "✅" : "❌"}</p>
            <p><strong>冥想课程:</strong> {subscriptionService.checkFeatureAccess(subscription, "meditation_courses") ? "✅" : "❌"}</p>
            <p><strong>个人教练:</strong> {subscriptionService.checkFeatureAccess(subscription, "personal_coach") ? "✅" : "❌"}</p>
            <p><strong>高级分析:</strong> {subscriptionService.checkFeatureAccess(subscription, "advanced_analytics") ? "✅" : "❌"}</p>
            <p><strong>优先支持:</strong> {subscriptionService.checkFeatureAccess(subscription, "priority_support") ? "✅" : "❌"}</p>
            <p><strong>专属内容:</strong> {subscriptionService.checkFeatureAccess(subscription, "exclusive_content") ? "✅" : "❌"}</p>
          </div>
        </div>
      </div>
    </div>
  )
} 
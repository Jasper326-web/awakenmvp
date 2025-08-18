"use client"

import { useState, useEffect } from "react"
import { authService } from "@/lib/auth"
import { subscriptionService, type SubscriptionStatus } from "@/lib/subscription"

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true)
        const user = await authService.getCurrentUser()

        if (!user) {
          setSubscription(null)
          return
        }

        const subscriptionData = await subscriptionService.getUserSubscriptionStatus(user.id)
        setSubscription(subscriptionData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "获取订阅信息失败")
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [])

  const checkFeatureAccess = (feature: string): boolean => {
    return subscriptionService.checkFeatureAccess(subscription, feature)
  }

  const isPro = subscription?.is_pro || false
  const isPremium = subscription?.is_premium || false
  const isFree = !isPro && !isPremium

  const refresh = async () => {
    try {
      setLoading(true)
      setError(null)
      const user = await authService.getCurrentUser()

      if (!user) {
        setSubscription(null)
        return
      }

      const subscriptionData = await subscriptionService.getUserSubscriptionStatus(user.id)
      setSubscription(subscriptionData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "刷新订阅信息失败")
    } finally {
      setLoading(false)
    }
  }

  return {
    subscription,
    loading,
    error,
    isPro,
    isPremium,
    isFree,
    checkFeatureAccess,
    refresh,
  }
}

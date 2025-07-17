"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Crown, Star, Calendar, AlertCircle } from "lucide-react"
import { useSubscription } from "@/hooks/use-subscription"

interface SubscriptionStatusProps {
  variant?: "badge" | "card" | "inline"
  showExpiry?: boolean
}

export default function SubscriptionStatus({ variant = "badge", showExpiry = true }: SubscriptionStatusProps) {
  const { subscription, loading } = useSubscription()

  if (loading) {
    return <div className="w-16 h-6 bg-muted rounded animate-pulse" />
  }

  if (!subscription) {
    return <div className="text-xs text-muted-foreground flex items-center gap-1"><AlertCircle className="w-4 h-4 mr-1 text-gray-400" />未开通会员</div>
  }

  const getStatusConfig = () => {
    if (subscription.is_premium) {
      return {
        label: "Premium",
        icon: Star,
        className: "bg-purple-100 text-purple-800 border-purple-200",
        color: "purple",
      }
    } else if (subscription.is_pro) {
      return {
        label: "Pro",
        icon: Crown,
        className: "bg-blue-100 text-blue-800 border-blue-200",
        color: "blue",
      }
    } else {
      return {
        label: "免费版",
        icon: null,
        className: "bg-gray-100 text-gray-800 border-gray-200",
        color: "gray",
      }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  if (variant === "badge") {
    return (
      <Badge className={config.className}>
        {Icon && <Icon className="w-3 h-3 mr-1" />}
        {config.label}
      </Badge>
    )
  }

  if (variant === "inline") {
    return (
      <div className="flex items-center space-x-2">
        {Icon && <Icon className={`w-4 h-4 text-${config.color}-600`} />}
        <span className="text-sm font-medium text-foreground">{config.label}</span>
        {showExpiry && subscription.days_remaining && (
          <span className="text-xs text-muted-foreground">({subscription.days_remaining}天后到期)</span>
        )}
      </div>
    )
  }

  return (
    <Card className="card-minimal border border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {Icon && (
              <div className={`w-10 h-10 bg-${config.color}-100 rounded-full flex items-center justify-center`}>
                <Icon className={`w-5 h-5 text-${config.color}-600`} />
              </div>
            )}
            <div>
              <div className="font-medium text-foreground">{config.label} 会员</div>
              {showExpiry && subscription.expires_at && (
                <div className="text-sm text-muted-foreground flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{subscription.days_remaining ? `${subscription.days_remaining}天后到期` : "已到期"}</span>
                </div>
              )}
            </div>
          </div>

          {subscription.days_remaining && subscription.days_remaining <= 7 && (
            <div className="flex items-center space-x-1 text-orange-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs">即将到期</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

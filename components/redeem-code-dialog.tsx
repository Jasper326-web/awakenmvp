"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Gift, Loader2 } from "lucide-react"
import { useSubscription } from "@/hooks/use-subscription"

export function RedeemCodeDialog() {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { subscription, refresh } = useSubscription()

  const handleRedeem = async () => {
    if (!code.trim()) {
      toast({
        title: "请输入兑换码",
        description: "兑换码不能为空",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/redeem-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: code.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "兑换失败")
      }

      toast({
        title: "兑换成功！",
        description: `已获得 ${data.days_added} 天 ${data.subscription_type === 'premium' ? 'Premium' : 'Pro'} 会员`,
      })

      // 刷新订阅状态
      await refresh()
      
      // 关闭弹窗并清空输入
      setOpen(false)
      setCode("")
    } catch (error) {
      toast({
        title: "兑换失败",
        description: error instanceof Error ? error.message : "请检查兑换码是否正确",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleRedeem()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2 text-sm"
        >
          <Gift className="w-4 h-4" />
          兑换码
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            输入兑换码
          </DialogTitle>
          <DialogDescription>
            {subscription?.is_premium || subscription?.is_pro ? (
              "输入兑换码可以延长您的会员时长"
            ) : (
              "输入兑换码可以获得免费会员体验"
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="请输入兑换码"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="text-center text-lg font-mono tracking-wider"
              maxLength={20}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button
            onClick={handleRedeem}
            disabled={isLoading || !code.trim()}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                兑换中...
              </>
            ) : (
              "兑换"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

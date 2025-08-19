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
import { toast } from "sonner"
import { Gift, Loader2 } from "lucide-react"
import { useSubscription } from "@/hooks/use-subscription"
import { useLanguage } from "@/lib/lang-context"

interface RedeemCodeDialogProps {
  variant?: "default" | "large"
}

export function RedeemCodeDialog({ variant = "default" }: RedeemCodeDialogProps) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { subscription, refresh } = useSubscription()
  const { t } = useLanguage()

  const handleRedeem = async () => {
    if (!code.trim()) {
      toast.error(t("redeem.error.invalid_code_desc"), {
        description: t("redeem.error.invalid_code"),
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

      console.log("[Redeem Code] 兑换成功，显示提示:", data)

      // 先显示成功提示
      toast.success(t("redeem.success.description"), {
        duration: 3000, // 确保提示显示3秒
      })

      // 等待一小段时间确保toast显示
      await new Promise(resolve => setTimeout(resolve, 500))

      // 刷新订阅状态
      await refresh()
      
      // 关闭弹窗并清空输入
      setOpen(false)
      setCode("")
      
      // 延迟刷新页面
      setTimeout(() => {
        console.log("[Redeem Code] 准备刷新页面")
        window.location.reload()
      }, 2000) // 增加到2秒，确保用户能看到提示
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("redeem.error.general"),
        {
          description: t("redeem.error.title"),
        }
      )
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
          variant={variant === "large" ? "default" : "outline"}
          size={variant === "large" ? "lg" : "sm"}
          className={`flex items-center gap-2 ${variant === "large" ? "bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105" : "text-sm"}`}
        >
          <Gift className={variant === "large" ? "w-6 h-6" : "w-4 h-4"} />
          {t("redeem.button.text")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            {t("redeem.title")}
          </DialogTitle>
          <DialogDescription>
            {subscription?.is_premium || subscription?.is_pro ? (
              t("redeem.description.member")
            ) : (
              t("redeem.description.guest")
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder={t("redeem.placeholder")}
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
            {t("redeem.cancel")}
          </Button>
          <Button
            onClick={handleRedeem}
            disabled={isLoading || !code.trim()}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("redeem.button.loading")}
              </>
            ) : (
              t("redeem.button")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

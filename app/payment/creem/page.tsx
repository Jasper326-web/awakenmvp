"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

export default function CreemPaymentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 模拟支付流程，实际应集成Creem支付SDK或跳转到Creem支付链接
  const handlePay = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // 获取当前用户的认证token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error("无法获取用户认证token");
        setError("支付链接生成失败，请稍后重试");
        return;
      }
      
      const res = await fetch("/api/create-creem-session", { 
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error("创建支付会话失败:", errorData);
        setError("支付链接生成失败，请稍后重试");
        return;
      }
      
      const { checkout_url } = await res.json();
      if (checkout_url) {
        // 添加错误处理提示
        console.log("正在跳转到Creem支付页面...");
        console.log("如果遇到网络错误，请刷新页面重试");
        
        // 延迟跳转，给用户一些时间看到提示
        setTimeout(() => {
          window.location.href = checkout_url;
        }, 1000);
      } else {
        setError("支付链接生成失败，请稍后重试");
      }
    } catch (error) {
      console.error("支付流程错误:", error);
      setError("支付链接生成失败，请稍后重试");
    } finally {
      setLoading(false)
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="max-w-md mx-auto text-center">
        <CardHeader>
          <CardTitle className="text-2xl text-gray-900">Creem 月度会员支付</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-lg text-gray-700">月度会员：<span className="font-bold text-red-600">$10/月</span></div>
          <div className="text-gray-500 text-sm">支付后会员权限自动开通，无需联系客服。</div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}
          
          <Button 
            onClick={handlePay} 
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-medium text-lg disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                正在生成支付链接...
              </>
            ) : (
              "前往Creem支付"
            )}
          </Button>
          
          {loading && (
            <div className="text-sm text-gray-500">
              如果遇到网络错误，请刷新页面重试
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 
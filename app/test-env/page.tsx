"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestEnvPage() {
  const [envInfo, setEnvInfo] = useState<string>("")

  const checkEnvironment = async () => {
    try {
      const response = await fetch("/api/test-env")
      const data = await response.json()
      setEnvInfo(JSON.stringify(data, null, 2))
    } catch (error) {
      setEnvInfo("检查失败: " + error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-2xl text-white">环境变量检查</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button onClick={checkEnvironment} className="w-full">
            检查环境变量
          </Button>
          
          {envInfo && (
            <div className="bg-black/50 p-4 rounded-lg">
              <h3 className="text-white mb-2">环境变量信息:</h3>
              <pre className="text-green-400 text-sm overflow-auto">{envInfo}</pre>
            </div>
          )}
          
          <div className="text-gray-300 text-sm">
            <p>这个页面用于检查关键环境变量是否已正确配置。</p>
            <p>特别是 SUPABASE_SERVICE_ROLE_KEY 对于webhook功能很重要。</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
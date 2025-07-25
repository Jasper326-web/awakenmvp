"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function SetupCommunityPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const setupCommunityTables = async () => {
    try {
      setLoading(true)
      setResult(null)

      const response = await fetch('/api/setup-community-tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || '社群数据库表创建成功'
        })
      } else {
        setResult({
          success: false,
          message: data.error || '创建失败'
        })
      }
    } catch (error) {
      console.error('设置社群数据库表时出错:', error)
      setResult({
        success: false,
        message: '网络错误，请重试'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-2xl text-center">
                社群数据库设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-gray-300 text-center">
                <p className="mb-4">
                  此页面用于创建社群功能所需的数据库表。
                </p>
                <p className="text-sm text-gray-400">
                  包括：community_posts（帖子表）和 community_comments（评论表）
                </p>
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={setupCommunityTables}
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-8 py-3"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      创建中...
                    </>
                  ) : (
                    "创建社群数据库表"
                  )}
                </Button>
              </div>

              {result && (
                <div className={`p-4 rounded-lg border ${
                  result.success 
                    ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}>
                  <div className="flex items-center space-x-2">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <XCircle className="w-5 h-5" />
                    )}
                    <span>{result.message}</span>
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-400 space-y-2">
                <h3 className="text-white font-semibold mb-2">创建的表结构：</h3>
                <div className="space-y-1">
                  <p>• community_posts - 社群帖子表</p>
                  <p>• community_comments - 社群评论表</p>
                  <p>• 相关索引和RLS策略</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 
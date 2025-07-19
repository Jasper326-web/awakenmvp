"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function SetupFeedbackPage() {
  const [isCreating, setIsCreating] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    error?: string
  } | null>(null)

  const createFeedbackImagesBucket = async () => {
    setIsCreating(true)
    setResult(null)

    try {
      const response = await fetch('/api/create-feedback-images-bucket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || '反馈图片存储桶创建成功'
        })
      } else {
        setResult({
          success: false,
          message: '创建失败',
          error: data.error || '未知错误'
        })
      }
    } catch (error) {
      console.error('创建存储桶时出错:', error)
      setResult({
        success: false,
        message: '创建失败',
        error: '网络错误或服务器错误'
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
              反馈系统设置
            </CardTitle>
            <CardDescription>
              初始化反馈图片上传功能所需的存储桶和数据库字段
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">需要执行的步骤：</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>1. 在数据库中为 user_feedback 表添加 image_url 字段</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>2. 创建 feedback-images 存储桶用于存储用户上传的图片</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>3. 设置存储桶的访问权限和文件大小限制</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">数据库脚本：</h3>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-sm font-mono">
                  请执行以下SQL脚本：<br/>
                  <code className="text-blue-600">scripts/add-feedback-image-field.sql</code><br/>
                  <code className="text-blue-600">scripts/create-feedback-images-bucket.sql</code>
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">存储桶创建：</h3>
              <Button 
                onClick={createFeedbackImagesBucket}
                disabled={isCreating}
                className="w-full"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    创建中...
                  </>
                ) : (
                  '创建反馈图片存储桶'
                )}
              </Button>
            </div>

            {result && (
              <div className={`p-4 rounded-lg ${
                result.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className={`font-medium ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.message}
                  </span>
                </div>
                {result.error && (
                  <p className="text-sm text-red-600 mt-2">{result.error}</p>
                )}
              </div>
            )}

            <div className="text-sm text-gray-500">
              <p>注意：</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>存储桶创建后，用户就可以在反馈表单中上传图片了</li>
                <li>支持的图片格式：JPG、PNG、GIF、WebP</li>
                <li>单个文件大小限制：5MB</li>
                <li>图片将存储在 Supabase 的 feedback-images 存储桶中</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
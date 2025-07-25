"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Send, ImageIcon, Sparkles } from "lucide-react"
import { authService } from "@/lib/auth"
import { supabase } from "@/lib/supabaseClient"

export default function NewPostPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [content, setContent] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await authService.getCurrentUser()
      if (!currentUser) {
        router.push("/auth/signin")
        return
      }
      setUser(currentUser)
    }
    checkAuth()
  }, [router])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("图片大小不能超过5MB")
        return
      }
      setImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      setError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !content.trim()) return

    if (content.length > 300) {
      setError("内容不能超过300字")
      return
    }

    setLoading(true)
    setError("")

    try {
      let images: string[] = []

      // 上传图片（如有）
      if (image) {
        const fileExt = image.name.split(".").pop()
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from("community-images").upload(fileName, image)
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from("community-images").getPublicUrl(fileName)
        images = [urlData.publicUrl]
      }

      // 通过 API 路由发帖
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          images,
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "发帖失败")
      router.push("/community")
    } catch (error) {
      console.error("发布失败:", error)
      setError("发布失败，请重试")
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto"></div>
          <p className="text-white/70 text-lg">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill=&quot;none&quot; fillRule=&quot;evenodd&quot;%3E%3Cg fill=&quot;%239C92AC&quot; fillOpacity=&quot;0.05&quot;%3E%3Ccircle cx=&quot;30&quot; cy=&quot;30&quot; r=&quot;2&quot;/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-16">
        {/* 头部 */}
        <div className="text-center space-y-8 mb-12">
          <div className="relative inline-block">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-green-500/30 transform rotate-3">
              <Send className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              发布新帖
            </h1>
            <p className="text-xl text-gray-300">分享你的经验和想法 ✨</p>
          </div>
        </div>

        {/* 发帖表单 */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl text-white flex items-center">
              <Send className="w-6 h-6 mr-3 text-green-400" />
              创建帖子
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 内容输入 */}
              <div className="space-y-2">
                <Label htmlFor="content" className="text-white font-medium">
                  内容 *
                </Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="分享你的想法、经验或感悟..."
                  className="min-h-[120px] bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-green-400 focus:ring-green-400/20"
                  maxLength={300}
                />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">支持 Markdown 格式</span>
                  <span className={`${content.length > 280 ? "text-red-400" : "text-gray-400"}`}>
                    {content.length}/300
                  </span>
                </div>
              </div>

              {/* 图片上传 */}
              <div className="space-y-2">
                <Label htmlFor="image" className="text-white font-medium">
                  配图 (可选)
                </Label>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <input type="file" id="image" accept="image/*" onChange={handleImageChange} className="hidden" />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("image")?.click()}
                      className="border-white/30 text-white hover:bg-white/10"
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      选择图片
                    </Button>
                    <span className="text-sm text-gray-400">最大 5MB</span>
                  </div>

                  {imagePreview && (
                    <div className="relative">
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="预览"
                        className="max-w-full h-auto rounded-lg border border-white/20"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setImage(null)
                          setImagePreview(null)
                        }}
                        className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600 text-white border-0"
                      >
                        删除
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* 错误提示 */}
              {error && (
                <Alert className="bg-red-500/20 border-red-500/30 text-red-200">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* 提交按钮 */}
              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1 border-white/30 text-white hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !content.trim()}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      发布中...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      发布帖子
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabaseClient"
import { authService } from "@/lib/auth"
import { ArrowLeft, ImagePlus, Send, X, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function NewPostPage() {
  const router = useRouter()
  const [content, setContent] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB限制
        setError("图片大小不能超过5MB")
        return
      }

      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      setError(null)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      setError("请输入帖子内容")
      return
    }

    if (content.length > 300) {
      setError("内容不能超过300字")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const user = await authService.getCurrentUser()
      if (!user) {
        router.push("/auth/signin")
        return
      }

      let images: string[] = []

      // 上传图片（如果有）
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop()
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from("community-images").upload(fileName, imageFile)
        if (uploadError) {
          console.error("图片上传失败:", uploadError)
          setError("图片上传失败，请重试")
          return
        }
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
      if (!res.ok) {
        setError(data.error || "发帖失败，请重试")
        return
      }
      router.push("/community")
    } catch (error) {
      console.error("发帖错误:", error)
      setError("发帖失败，请重试")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 头部导航 */}
      <header className="bg-card border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold text-foreground">发布新帖</h1>
            </div>
          </div>
        </div>
      </header>

      {/* 发帖表单 */}
      <main className="max-w-2xl mx-auto px-6 py-6">
        <Card className="card-industrial">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">分享你的经验</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 错误提示 */}
              {error && (
                <Alert className="border-red-500/50 bg-red-500/10">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              {/* 内容输入 */}
              <div className="space-y-2">
                <Label htmlFor="content" className="text-foreground">
                  帖子内容 *
                </Label>
                <Textarea
                  id="content"
                  placeholder="分享你的戒色心得、经验或困惑..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[120px] bg-background border-border text-foreground resize-none"
                  maxLength={300}
                />
                <div className="text-right text-sm text-muted-foreground">{content.length}/300</div>
              </div>

              {/* 图片上传 */}
              <div className="space-y-2">
                <Label className="text-foreground">配图（可选）</Label>
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="预览"
                      className="w-full max-h-64 object-cover rounded-lg border border-border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                    <Label htmlFor="image" className="cursor-pointer">
                      <div className="flex flex-col items-center space-y-2">
                        <ImagePlus className="w-8 h-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">点击上传图片（最大5MB）</span>
                      </div>
                      <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </Label>
                  </div>
                )}
              </div>

              {/* 提交按钮 */}
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1 border-border hover:bg-accent"
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !content.trim()}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      发布中...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      发布
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

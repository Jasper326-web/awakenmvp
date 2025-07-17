"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase"
import { authService } from "@/lib/auth"
import ReactMarkdown from "react-markdown"
import { ArrowLeft, Heart, MessageCircle, Plus, Clock, Users, Flame } from "lucide-react"

interface CommunityPost {
  id: string
  user_id: string
  content: string
  media_url?: string
  likes_count: number
  created_at: string
  user?: {
    username?: string
    email?: string
  }
}

export default function CommunityPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const initPage = async () => {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
      await fetchPosts()
    }
    initPage()
  }, [])

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("community_posts")
        .select(`
          *,
          user:users(username, email)
        `)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) {
        console.error("获取帖子失败:", error)
        return
      }

      setPosts(data || [])
    } catch (error) {
      console.error("获取帖子失败:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      return "刚刚"
    } else if (diffInHours < 24) {
      return `${diffInHours}小时前`
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}天前`
    } else {
      return date.toLocaleDateString()
    }
  }

  const generateAnonymousId = (userId: string) => {
    // 生成基于用户ID的匿名标识
    const hash = userId.slice(-6)
    return `guest-${hash}`
  }

  const handleLike = async (postId: string) => {
    if (!user) {
      router.push("/auth/signin")
      return
    }

    try {
      // 这里可以实现点赞逻辑
      console.log("点赞帖子:", postId)
    } catch (error) {
      console.error("点赞失败:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-400">加载中...</p>
          </div>
        </div>
      </div>
    )
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
              <div className="flex items-center space-x-2">
                <Users className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-bold text-foreground">社区</h1>
              </div>
            </div>

            <Link href="/community/new">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                发帖
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 帖子列表 */}
      <main className="max-w-2xl mx-auto px-6 py-6">
        <div className="space-y-6">
          {posts.length === 0 ? (
            <Card className="card-industrial">
              <CardContent className="p-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">还没有帖子</h3>
                <p className="text-muted-foreground mb-4">成为第一个分享经验的人吧！</p>
                <Link href="/community/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    发布第一个帖子
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="card-industrial">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src="/placeholder.svg?height=40&width=40" />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {generateAnonymousId(post.user_id)[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-foreground">{generateAnonymousId(post.user_id)}</div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTime(post.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* 帖子内容 */}
                  <div className="prose prose-sm max-w-none text-foreground">
                    <ReactMarkdown>{post.content}</ReactMarkdown>
                  </div>

                  {/* 配图 */}
                  {post.media_url && (
                    <div className="rounded-lg overflow-hidden border border-border">
                      <img
                        src={post.media_url || "/placeholder.svg"}
                        alt="帖子配图"
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  )}

                  {/* 互动区域 */}
                  <div className="flex items-center space-x-6 pt-2 border-t border-border">
                    <button
                      onClick={() => handleLike(post.id)}
                      className="flex items-center space-x-2 text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                      <span className="text-sm">{post.likes_count}</span>
                    </button>

                    <button className="flex items-center space-x-2 text-muted-foreground hover:text-blue-500 transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm">评论</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* 底部导航提示 */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <Flame className="w-4 h-4" />
            <span>返回首页</span>
          </Link>
        </div>
      </main>
    </div>
  )
}

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Heart, MessageSquare, Flag, MoreHorizontal, Send, Smile, ImageIcon, Calendar, MapPin, ChevronDown, ChevronUp, UserIcon } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/lib/lang-context'
import { supabase } from '@/lib/supabaseClient'
import { virtualUsers, virtualPosts } from '@/lib/community-data'
import { getUserLevel } from '@/lib/streak-calculator'

export default function Community() {
  const { user, loading: userLoading } = useUser()
  const { toast } = useToast()
  const { t, language } = useLanguage()

  // 状态管理
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newPostContent, setNewPostContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({})
  const [commentLoading, setCommentLoading] = useState<{ [key: string]: boolean }>({})
  const [commentsMap, setCommentsMap] = useState<{ [key: string]: any[] }>({})
  const [reportingPostId, setReportingPostId] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [userProfile, setUserProfile] = useState<any>(null)
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPosts, setTotalPosts] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  
  // 发布成功状态
  const [publishSuccess, setPublishSuccess] = useState(false)

  // Refs
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const imageUploadRef = useRef<HTMLDivElement>(null)

  // 常用表情
  const commonEmojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '💪', '✨', '🌟', '💯', '😍', '🤔', '👏', '🙏', '💖', '😎']

  // 加载用户资料
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        if (!error && data) {
          setUserProfile(data)
        }
      } catch (err) {
        console.error('加载用户资料失败:', err)
      }
    }
    loadUserProfile()
  }, [user])

  // 分页控制函数
  const handleNextPage = () => {
    if (hasMore && !loading) {
      const nextPage = currentPage + 1
      setCurrentPage(nextPage)
      loadPosts(nextPage, 10)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 0 && !loading) {
      const prevPage = currentPage - 1
      setCurrentPage(prevPage)
      loadPosts(prevPage, 10)
    }
  }

  const handlePageChange = (page: number) => {
    if (page !== currentPage && !loading) {
      setCurrentPage(page)
      loadPosts(page, 10)
    }
  }

  // 加载帖子
  const loadPosts = async (page = 0, pageSize = 10) => {
    try {
      setLoading(true)
      
      // 获取总帖子数量
      const { count: totalCount } = await supabase
        .from('community_posts')
        .select('*', { count: 'exact', head: true })
      
      setTotalPosts((totalCount || 0) + virtualPosts.length)
      
      // 虚拟帖子只在第一页显示，算在10条数量中
      const virtualPostsToShow = page === 0 ? virtualPosts.map((post: any) => {
        const user = virtualUsers.find((u: any) => u.id === post.userId) || virtualUsers[0]
        return {
          ...post,
          username: user.name,
          avatar_url: user.avatar,
          level: user.level,
          isVerified: user.isVerified,
          isVirtual: true
        }
      }) : []

      // 真实帖子分页逻辑
      const virtualPostCount = virtualPosts.length // 始终使用虚拟帖子的总数
      const realPostsOffset = Math.max(0, page * pageSize - virtualPostCount)
      const realPostsNeeded = pageSize - Math.max(0, virtualPostCount - page * pageSize)
      
      // 确保不超过总帖子数量
      const maxPostsToLoad = Math.min(realPostsNeeded, (totalCount || 0) - realPostsOffset)
      const actualPostsNeeded = Math.max(0, maxPostsToLoad)

      // 加载真实帖子
      let realPosts = []
      if (user?.id) {
        // 登录用户使用 RPC 查询（包含点赞状态）
        const { data, error } = await supabase
          .rpc('get_community_posts_with_like_status', {
            user_id: user.id,
            page_limit: actualPostsNeeded,
            page_offset: realPostsOffset,
          })
        
        if (!error && data) {
          // 获取评论数量
          const postIds = data.map((post: any) => post.id)
          const commentCountMap: { [key: string]: number } = {}
          
          // 为每个帖子查询评论数量
          for (const postId of postIds) {
            const { count, error: countError } = await supabase
              .from('community_comments')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', postId)
            
            if (!countError) {
              commentCountMap[postId] = count || 0
            }
          }
          
          realPosts = data.map((post: any) => ({
            ...post,
            isVirtual: false,
            likedByCurrentUser: post.liked_by_current_user,
            comments: [],
            comments_count: commentCountMap[post.id] || 0,
          }))
        }
      } else {
        // 未登录用户查询帖子，包含用户信息
        const { data, error } = await supabase
          .from('community_posts')
          .select(`
            *,
            users!community_posts_user_id_fkey (
              id,
              username,
              avatar_url,
              level
            )
          `)
          .order('created_at', { ascending: false })
          .limit(actualPostsNeeded)
          .range(realPostsOffset, realPostsOffset + actualPostsNeeded - 1)
        
        if (!error && data) {
          // 获取评论数量
          const postIds = data.map((post: any) => post.id)
          const commentCountMap: { [key: string]: number } = {}
          
          // 为每个帖子查询评论数量
          for (const postId of postIds) {
            const { count, error: countError } = await supabase
              .from('community_comments')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', postId)
            
            if (!countError) {
              commentCountMap[postId] = count || 0
            }
          }
          
          realPosts = data.map((post: any) => ({
            ...post,
            isVirtual: false,
            likedByCurrentUser: false, // 未登录用户默认未点赞
            comments: [],
            comments_count: commentCountMap[post.id] || 0,
            username: post.users?.username || `用户${post.user_id.slice(0, 8)}`,
            avatar_url: post.users?.avatar_url,
            level: post.users?.level || 0,
          }))
        }
      }

      // 合并真实帖子和虚拟帖子
      const allPosts = [...virtualPostsToShow, ...realPosts]
      setPosts(allPosts)
      
      // 检查是否还有更多页面（只针对真实帖子）
      const totalPages = Math.ceil((totalCount || 0) / pageSize)
      setHasMore(page < totalPages - 1 || realPosts.length === actualPostsNeeded)
      
      // 调试信息
      console.log('分页调试:', {
        page,
        totalCount,
        virtualPostCount,
        realPostsNeeded,
        actualPostsNeeded,
        realPostsOffset,
        realPostsLength: realPosts.length,
        virtualPostsLength: virtualPostsToShow.length,
        totalPages,
        hasMore: page < totalPages - 1 || realPosts.length === actualPostsNeeded,
        description: page === 0 ? `第一页：${virtualPostsToShow.length}条虚拟帖子 + ${actualPostsNeeded}条真实帖子（总共10条）` : `第${page + 1}页：${actualPostsNeeded}条真实帖子`,
        expectedPosts: page === 0 ? `${virtualPostsToShow.length}虚拟 + ${actualPostsNeeded}真实 = 10条` : `${actualPostsNeeded}真实`,
        offsetRange: `${realPostsOffset} - ${realPostsOffset + actualPostsNeeded - 1}`,
        totalExpected: page === 0 ? virtualPostsToShow.length + realPosts.length : realPosts.length,
        formula: `offset=${page}*${pageSize}-${virtualPostCount}=${realPostsOffset}, needed=${pageSize}-max(0,${virtualPostCount}-${page}*${pageSize})=${realPostsNeeded}`
      })
    } catch (err) {
      console.error('加载帖子失败:', err)
      setPosts(page === 0 ? virtualPosts.map((post: any) => {
        const user = virtualUsers.find((u: any) => u.id === post.userId) || virtualUsers[0]
        return {
          ...post,
          username: user.name,
          avatar_url: user.avatar,
          level: user.level,
          isVerified: user.isVerified,
          isVirtual: true
        }
      }) : [])
    } finally {
      setLoading(false)
    }
  }

  // 点击外部关闭弹窗
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
      if (imageUploadRef.current && !imageUploadRef.current.contains(event.target as Node)) {
        setShowImageUpload(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 点赞功能 - 乐观更新
  const handleLike = async (postId: string, liked: boolean) => {
    if (!user) {
      toast({ title: '请先登录', description: '登录后才能点赞', variant: 'destructive' })
      return
    }

    // 乐观更新：立即更新 UI
    setPosts(prevPosts => 
      prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            likedByCurrentUser: !liked,
            likes_count: liked ? post.likes_count - 1 : post.likes_count + 1
          }
        }
        return post
      })
    )

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      
      const res = await fetch('/api/community/likes', {
        method: liked ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ postId })
      })

      if (!res.ok) {
        // 如果后端请求失败，回滚 UI 状态
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                likedByCurrentUser: liked,
                likes_count: liked ? post.likes_count + 1 : post.likes_count - 1
              }
            }
            return post
          })
        )
        
        const errorData = await res.json()
        toast({ 
          title: '点赞失败', 
          description: errorData.error || '请稍后重试', 
          variant: 'destructive' 
        })
      }
    } catch (err) {
      console.error('点赞失败:', err)
      // 网络错误时也回滚 UI 状态
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              likedByCurrentUser: liked,
              likes_count: liked ? post.likes_count + 1 : post.likes_count - 1
            }
          }
          return post
        })
      )
      toast({ 
        title: '网络错误', 
        description: '请检查网络连接', 
        variant: 'destructive' 
      })
    }
  }

  // 切换评论展开
  const toggleComments = async (postId: string) => {
    const newExpanded = new Set(expandedComments)
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId)
    } else {
      newExpanded.add(postId)
      // 加载评论
      if (!commentsMap[postId]) {
        try {
          console.log('开始加载评论，帖子ID:', postId)
          const res = await fetch(`/api/community/comments?postId=${postId}`)
          if (res.ok) {
            const comments = await res.json()
            console.log('加载到的评论:', comments)
            setCommentsMap(prev => ({ ...prev, [postId]: comments }))
          } else {
            console.error('加载评论失败，状态码:', res.status)
          }
        } catch (err) {
          console.error('加载评论失败:', err)
        }
      } else {
        console.log('评论已缓存，帖子ID:', postId, '评论数量:', commentsMap[postId].length)
      }
    }
    setExpandedComments(newExpanded)
  }

  // 提交评论
  const handleCommentSubmit = async (postId: string) => {
    if (!user || !commentInputs[postId]?.trim()) return

    setCommentLoading(prev => ({ ...prev, [postId]: true }))
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      
      const res = await fetch('/api/community/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          postId,
          content: commentInputs[postId]
        })
      })

      if (res.ok) {
        const newComment = await res.json()
        setCommentInputs(prev => ({ ...prev, [postId]: '' }))
        
        // 将新评论添加到现有评论列表
        setCommentsMap(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), newComment]
        }))
        
        // 更新帖子的评论数量
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, comments_count: (post.comments_count || 0) + 1 }
            : post
        ))
        
        toast({ title: '评论成功', description: '评论已发布' })
      } else {
        const errorData = await res.json()
        toast({ 
          title: '评论失败', 
          description: errorData.error || '发布评论失败', 
          variant: 'destructive' 
        })
      }
    } catch (err) {
      console.error('提交评论失败:', err)
    } finally {
      setCommentLoading(prev => ({ ...prev, [postId]: false }))
    }
  }

  // 评论点赞
  const handleCommentLike = (postId: string, commentId: string) => {
    // 实现评论点赞逻辑
    console.log('评论点赞:', postId, commentId)
  }

  // 删除评论
  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!user) {
      toast({ title: '删除失败', description: '请先登录', variant: 'destructive' })
      return
    }

    if (!window.confirm(t("community.confirmDeleteComment"))) {
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      
      if (!accessToken) {
        toast({ title: '删除失败', description: '未获取到登录凭证', variant: 'destructive' })
        return
      }

      const res = await fetch(`/api/community/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (res.ok) {
        // 从本地评论列表中移除评论
        setCommentsMap(prev => ({
          ...prev,
          [postId]: prev[postId]?.filter((comment: any) => comment.id !== commentId) || []
        }))
        
        // 更新帖子的评论数量
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, comments_count: Math.max(0, (post.comments_count || 0) - 1) }
            : post
        ))
        
        toast({ title: '删除成功', description: '评论已删除' })
      } else {
        const errorData = await res.json()
        toast({ 
          title: '删除失败', 
          description: errorData.error || '删除评论失败', 
          variant: 'destructive' 
        })
      }
    } catch (err) {
      console.error('删除评论失败:', err)
      toast({ 
        title: '删除失败', 
        description: '网络错误', 
        variant: 'destructive' 
      })
    }
  }

  // 提交帖子
  const handleSubmitPost = async () => {
    // Plausible Analytics: 追踪发布帖子事件
    if (typeof window !== 'undefined' && window.plausible) {
      window.plausible('post_submit')
    }
    
    if (!newPostContent.trim() || submitting) return

    setSubmitting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      
      if (!accessToken) {
        toast({ title: '发布失败', description: '未获取到登录凭证', variant: 'destructive' })
        setSubmitting(false)
        return
      }

      let images: string[] = []
      if (uploadedImages.length > 0) {
        // 过滤出有效的图片URL（包括data URL和http URL）
        images = uploadedImages.filter(img => img && (img.startsWith('http') || img.startsWith('data:')))
        console.log('准备发送的图片:', images)
      }

      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          content: newPostContent.trim(),
          images
        })
      })

      const data = await res.json()
      console.log('发布响应:', data)

      if (res.ok && data.post) {
        setNewPostContent('')
        setUploadedImages([])
        setPublishSuccess(true)
        toast({ title: '发布成功', description: '帖子已发布' })
        
        // 使用后端返回的完整帖子数据
        const newPost = {
          ...data.post,
          isVirtual: false,
          likedByCurrentUser: false,
          comments: []
        }
        
        console.log('新帖子数据:', newPost)
        
        // 将新帖子添加到列表顶部
        setPosts(prevPosts => {
          console.log('当前帖子列表长度:', prevPosts.length)
          const updatedPosts = [newPost, ...prevPosts]
          console.log('更新后帖子列表长度:', updatedPosts.length)
          return updatedPosts
        })
        
        // 更新总帖子数
        setTotalPosts(prev => prev + 1)
        
        // 3秒后重置成功状态
        setTimeout(() => setPublishSuccess(false), 3000)
      } else {
        const errorMessage = data.error || data.detail || '创建帖子失败'
        toast({ title: '发布失败', description: errorMessage, variant: 'destructive' })
      }
    } catch (err) {
      console.error('发布失败:', err)
      toast({ title: '发布失败', description: '创建帖子失败', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  // 举报帖子
  const handleReport = async () => {
    if (!reportingPostId || !reportReason.trim()) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      
      const res = await fetch('/api/community/posts/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          postId: reportingPostId,
          reason: reportReason
        })
      })

      if (res.ok) {
        toast({ title: '举报成功', description: '感谢您的反馈' })
        setReportingPostId(null)
        setReportReason('')
      } else {
        toast({ title: '举报失败', description: '请稍后重试', variant: 'destructive' })
      }
    } catch (err) {
      console.error('举报失败:', err)
      toast({ title: '举报失败', description: '请稍后重试', variant: 'destructive' })
    }
  }

  // 表情点击
  const handleEmojiClick = (emoji: string) => {
    setNewPostContent(prev => prev + emoji)
    setShowEmojiPicker(false)
  }

  // 图片上传
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    // 检查文件大小（限制为5MB）
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: '文件过大', description: '图片大小不能超过5MB', variant: 'destructive' })
      return
    }
    
    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast({ title: '文件类型不支持', description: '只支持 JPG、PNG、GIF、WebP 格式', variant: 'destructive' })
      return
    }
    
    // 立即显示预览
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setUploadedImages(prev => [...prev, result])
    }
    reader.readAsDataURL(file)
    
    // 异步上传到 Supabase
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${user?.id}/${fileName}`
      
      console.log('开始上传图片:', filePath)
      
      const { data, error } = await supabase.storage
        .from('community-images')
        .upload(filePath, file)
        
      if (error) {
        console.error('图片上传失败:', error)
        toast({ title: '上传失败', description: error.message || '图片上传失败', variant: 'destructive' })
        // 移除预览图片
        setUploadedImages(prev => prev.filter(img => !img.startsWith('data:')))
        return
      }
      
      const { data: urlData } = supabase.storage
        .from('community-images')
        .getPublicUrl(filePath)
        
      console.log('图片上传成功，URL:', urlData.publicUrl)
      
      // 更新图片URL
      setUploadedImages(prev => {
        const updated = prev.map(img => {
          if (img.startsWith('data:')) {
            return urlData.publicUrl
          }
          return img
        })
        console.log('更新后的图片数组:', updated)
        return updated
      })
      
      toast({ title: '上传成功', description: '图片已上传' })
    } catch (err) {
      console.error('上传失败:', err)
      toast({ title: '上传失败', description: String(err), variant: 'destructive' })
      // 移除预览图片
      setUploadedImages(prev => prev.filter(img => !img.startsWith('data:')))
    }
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return t("date.just_now")
    if (minutes < 60) return `${minutes} ${t("date.minutes_ago")}`
    if (hours < 24) return `${hours} ${t("date.hours_ago")}`
    if (days < 7) return `${days} ${t("date.days_ago")}`
    return date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US')
  }

  // 获取用户头像URL
  const getUserAvatar = () => {
    if (userProfile?.avatar_url) {
      return userProfile.avatar_url
    }
    return user?.user_metadata?.avatar_url || "/placeholder-user.jpg"
  }

  // 初始加载
  useEffect(() => {
    if (userLoading) return; // 等待 user 加载完成
    loadPosts(0, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userLoading]);

  if (loading || userLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-400">{t("common.loading")}</p>
        </div>
      </div>
    )
  }



  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* 发布新帖子 */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user ? getUserAvatar() : "/placeholder-user.jpg"} />
                <AvatarFallback>
                  {user ? (userProfile?.username?.charAt(0) || user?.user_metadata?.full_name?.charAt(0) || "U") : "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder={user ? t("community.post_placeholder") : t("community.login_required_to_post")}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="min-h-[100px] bg-slate-700/50 border-slate-600 text-white placeholder-gray-400 resize-none"
                  disabled={!user}
                />
                
                {/* 图片预览 */}
                {uploadedImages.length > 0 && (
                  <div className="mt-4">
                    <div className="grid grid-cols-1 gap-2">
                      {uploadedImages.map((imageUrl, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={imageUrl}
                            alt={`预览图片 ${index + 1}`}
                            className="w-full max-h-48 object-contain rounded-lg bg-slate-700/50"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                          <button
                            onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== index))}
                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex space-x-2">
                    <div className="relative" ref={emojiPickerRef}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-blue-400"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        disabled={!user}
                      >
                        <Smile className="w-4 h-4" />
                      </Button>
                      {showEmojiPicker && (
                        <div className="absolute bottom-full left-0 mb-2 bg-slate-700 border border-slate-600 rounded-lg p-3 z-10 min-w-[300px] max-h-[300px] overflow-hidden">
                          <div className="text-sm text-white mb-2 font-medium">{t("community.select_emoji")}</div>
                          <div className="max-h-[220px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700">
                            <div className="grid grid-cols-8 gap-2">
                              {commonEmojis.map((emoji, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleEmojiClick(emoji)}
                                  className="w-8 h-8 flex items-center justify-center hover:bg-slate-600 rounded text-lg transition-colors"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="relative" ref={imageUploadRef}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-green-400"
                        onClick={() => setShowImageUpload(!showImageUpload)}
                        disabled={!user}
                      >
                        <ImageIcon className="w-4 h-4" />
                      </Button>
                      {showImageUpload && (
                        <div className="absolute bottom-full left-0 mb-2 bg-slate-700 border border-slate-600 rounded-xl p-5 z-10 min-w-[340px] shadow-2xl">
                          <div className="text-sm text-white mb-4 font-medium flex items-center">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mr-3">
                              <ImageIcon className="w-4 h-4 text-white" />
                            </div>
                            {t("community.select_image")}
                          </div>
                          <div className="space-y-4">
                            <div className="relative group">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                id="image-upload-input"
                              />
                              <label
                                htmlFor="image-upload-input"
                                className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-500 rounded-2xl bg-gradient-to-br from-slate-600/20 via-slate-700/30 to-slate-800/20 hover:from-slate-600/40 hover:via-slate-700/50 hover:to-slate-800/40 transition-all duration-300 cursor-pointer group-hover:border-slate-400 group-hover:scale-[1.02] group-hover:shadow-lg"
                              >
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center mb-4 group-hover:from-blue-500/50 group-hover:to-purple-500/50 transition-all duration-300 group-hover:scale-110">
                                  <ImageIcon className="w-8 h-8 text-slate-200" />
                                </div>
                                <span className="text-sm text-slate-200 font-medium mb-2">{t("community.click_to_upload")}</span>
                                <span className="text-xs text-slate-400 bg-slate-800/50 px-3 py-1 rounded-full">{t("community.image_formats")}</span>
                              </label>
                            </div>
                            
                            <div className="flex items-center space-x-3 text-xs text-slate-400 bg-gradient-to-r from-slate-600/40 to-slate-700/40 rounded-xl p-3 border border-slate-600/50">
                              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse"></div>
                              <span className="font-medium">{t("community.image_upload_tip")}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={!user ? () => toast({ title: '请先登录', description: '登录后才能发布帖子', variant: 'destructive' }) : handleSubmitPost}
                    disabled={!newPostContent.trim() || submitting}
                    className={`${
                      publishSuccess 
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                        : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white'
                    }`}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {submitting ? "发布中..." : publishSuccess ? "发布成功" : t("community.post")}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 帖子列表 */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">还没有帖子，发布第一条帖子吧！</p>
            </div>
          ) : (
            posts.map((post, postIdx) => (
              <Card key={post.isVirtual ? `virtual-${post.id}` : String(post.id)} className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={post.avatar_url} />
                        <AvatarFallback>
                          {post.username?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-white text-base">
                            {post.username || '用户'}
                          </span>
                          {post.isVerified && (
                            <Badge variant="secondary" className="bg-blue-500 text-white text-xs">
                              ✓
                            </Badge>
                          )}
                          {/* 等级显示 */}
                          <Badge variant="outline" className="text-xs border-purple-500 text-purple-400">
                            Lv.{post.level || 0}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(post.created_at)}</span>
                          </div>
                          {/* 删除或注释掉 streak 显示部分 */}
                          {/* <div className="flex items-center space-x-1">
                            <span>🔥 {post.streak} {t("community.days")}</span>
                          </div> */}
                        </div>
                      </div>
                    </div>
                    {/* 右上角更多按钮，发帖人可见删除 */}
                    <div className="relative group">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-white"
                        onClick={() => setPosts(prev => prev.map((p, i) => i === postIdx ? { ...p, showMenu: !p.showMenu } : { ...p, showMenu: false }))}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                      {post.showMenu && (
                        <div className="absolute right-0 mt-2 w-32 bg-slate-800 border border-slate-700 rounded shadow-lg z-20">
                          {/* 仅发帖人可见删除 */}
                          {user && (String(user.id) === String(post.userId) || String(user.id) === String(post.user_id)) && (
                            <button
                              className="block w-full text-left px-4 py-2 text-red-500 hover:bg-red-500/10"
                              onClick={async () => {
                                if (!window.confirm(t("community.confirmDelete"))) return;
                                try {
                                  const { data: { session } } = await supabase.auth.getSession();
                                  const accessToken = session?.access_token;
                                  if (!accessToken) {
                                    toast({ title: t("community.deleteFailed"), description: t("common.loginRequired"), variant: 'destructive' });
                                    return;
                                  }
                                  const res = await fetch('/api/community/posts', {
                                    method: 'DELETE',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'Authorization': `Bearer ${accessToken}`
                                    },
                                    body: JSON.stringify({ postId: post.id })
                                  });
                                  const data = await res.json();
                                  if (res.ok && data.success) {
                                    setPosts(prev => prev.filter((p, i) => i !== postIdx));
                                    toast({ title: t("community.deleteSuccess"), description: t("community.postDeleted") });
                                  } else {
                                    toast({ title: t("community.deleteFailed"), description: data.error || t("community.deleteFailed"), variant: 'destructive' });
                                  }
                                } catch (err) {
                                  toast({ title: t("community.deleteFailed"), description: String(err), variant: 'destructive' });
                                }
                              }}
                            >
                                                              {t("community.delete")}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="mb-4">
                    <p className="text-white whitespace-pre-wrap">{post.content}</p>
                  </div>

                  {/* 图片展示 */}
                  {post.images && post.images.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {post.images.map((image: string, index: number) => (
                        <div key={`${post.id}-image-${index}`} className="relative">
                          <img
                            src={image}
                            alt={`帖子图片 ${index + 1}`}
                            className="w-full rounded-lg"
                            style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '400px' }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 互动按钮 */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                    <div className="flex items-center space-x-6">
                      <Button 
                        onClick={() => handleLike(post.id, post.likedByCurrentUser)} 
                        className={`transition-all duration-200 ${
                          post.likedByCurrentUser 
                            ? "text-red-500 hover:text-red-400 hover:bg-red-500/10" 
                            : "text-gray-400 hover:text-red-400 hover:bg-red-400/10"
                        }`}
                        variant="ghost"
                        size="sm"
                      >
                        {post.likedByCurrentUser ? (
                          <Heart className="w-4 h-4 mr-2 fill-current" />
                        ) : (
                          <Heart className="w-4 h-4 mr-2" />
                        )}
                        <span className={`font-medium ${post.likedByCurrentUser ? 'text-red-500' : 'text-gray-400'}`}>
                          {post.likes_count || 0}
                        </span>
                      </Button>
                      
                      <Button 
                        onClick={() => toggleComments(post.id)}
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 transition-all duration-200"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        <span className="font-medium">
                          {commentsMap[post.id] ? commentsMap[post.id].length : (post.comments_count || 0)}
                        </span>
                      </Button>
                    </div>
                  </div>

                  {/* 评论区域 */}
                  {expandedComments.has(post.id) && (
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      {/* 评论输入框 */}
                      <div className="flex space-x-3 mb-4">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={getUserAvatar()} />
                          <AvatarFallback>
                            {userProfile?.username?.charAt(0) || user?.user_metadata?.full_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Textarea
                            placeholder={t("community.write_comment")}
                            value={commentInputs[post.id] || ''}
                            onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                            className="min-h-[60px] bg-slate-700/50 border-slate-600 text-white placeholder-gray-400 resize-none"
                          />
                          <div className="flex justify-end mt-2">
                            <Button
                              onClick={() => handleCommentSubmit(post.id)}
                              disabled={!commentInputs[post.id]?.trim() || commentLoading[post.id]}
                              size="sm"
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                            >
                              {commentLoading[post.id] ? t("community.sending") : t("community.send")}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* 评论列表 */}
                      <div className="space-y-3">
                        {(commentsMap[post.id] || []).map((comment: any, cidx: number) => (
                          <div key={`${post.id}-comment-${comment.id ?? cidx}`} className="flex space-x-3 group">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={comment.avatar_url || '/placeholder-user.jpg'} />
                              <AvatarFallback>
                                {comment.username?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-white text-sm">
                                    {comment.username || '用户'}
                                  </span>
                                </div>
                                {/* 删除按钮 - 仅评论作者可见 */}
                                {user && comment.user_id === user.id && (
                                  <button
                                    onClick={() => handleDeleteComment(post.id, comment.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 text-xs"
                                    title={t("community.deleteComment")}
                                  >
                                    {t("community.delete")}
                                  </button>
                                )}
                              </div>
                              <span className="text-xs text-gray-400">
                                {formatDate(comment.created_at)}
                              </span>
                              <div className="text-white mt-1">
                                {comment.content}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* 分页组件 */}
        {totalPosts > 0 && (
          <div className="flex items-center justify-center space-x-4 py-6">
            <Button
              onClick={handlePrevPage}
              disabled={currentPage === 0 || loading}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <ChevronUp className="w-4 h-4 rotate-90" />
              {t("community.previous")}
            </Button>
            
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">{t("community.page")}</span>
              <span className="font-medium text-white">{currentPage + 1}</span>
              <span className="text-gray-400">{t("community.of")}</span>
              <span className="font-medium text-white">{Math.ceil(totalPosts / 10)}</span>
              <span className="text-gray-400">{t("community.pages")}</span>
            </div>
            
            <Button
              onClick={handleNextPage}
              disabled={!hasMore || loading}
              variant="outline"
              className="flex items-center space-x-2"
            >
              {t("community.next")}
              <ChevronUp className="w-4 h-4 -rotate-90" />
            </Button>
          </div>
        )}

        {/* 举报弹窗 */}
        {reportingPostId && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
            <div className="bg-slate-900 rounded-xl p-6 w-full max-w-sm shadow-2xl">
              <div className="text-lg font-bold mb-2">举报帖子</div>
              <Textarea
                value={reportReason}
                onChange={e => setReportReason(e.target.value)}
                placeholder="请输入举报理由..."
                className="w-full min-h-[80px] bg-slate-800 border-slate-700 text-white"
              />
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => {setReportingPostId(null); setReportReason('')}}>取消</Button>
                <Button className="bg-red-500 text-white" onClick={handleReport} disabled={!reportReason.trim()}>提交举报</Button>
              </div>
            </div>
          </div>
        )}
    </div>
    </TooltipProvider>
  )
}

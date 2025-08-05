import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { authService } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postIdParam = searchParams.get('postId')
    if (!postIdParam) {
      console.error('缺少帖子ID')
      return NextResponse.json({ error: '缺少帖子ID' }, { status: 400 })
    }
    const postId = parseInt(postIdParam, 10)
    if (isNaN(postId)) {
      console.error('帖子ID格式错误:', postIdParam)
      return NextResponse.json({ error: '帖子ID格式错误' }, { status: 400 })
    }
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: comments, error } = await supabase
      .from('community_comments')
      .select(`
        *,
        users!community_comments_user_id_fkey(
          id, 
          username, 
          avatar_url, 
          level, 
          current_streak, 
          total_days, 
          max_streak, 
          personal_motto
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    console.log('comments:', comments)
    console.log('error:', error)
    if (error) {
      console.error('获取评论失败:', error)
      return NextResponse.json({ error: '获取评论失败', detail: error.message }, { status: 500 })
    }
    if (!comments) {
      console.log('无评论数据')
      return NextResponse.json([], { status: 200 })
    }
    const formattedComments = comments.map(comment => ({
      id: comment.id,
      user_id: comment.user_id,
      content: comment.content,
      created_at: comment.created_at,
      username: comment.users?.username || '用户',
      avatar_url: comment.users?.avatar_url || '/placeholder-user.jpg',
      level: comment.users?.level,
      current_streak: comment.users?.current_streak,
      total_days: comment.users?.total_days,
      max_streak: comment.users?.max_streak,
      personal_motto: comment.users?.personal_motto,
      isVerified: false,
      likes: 0
    }))
    return NextResponse.json(formattedComments)
  } catch (error) {
    console.error('评论接口服务器错误:', error)
    return NextResponse.json({ error: '服务器错误', detail: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await authService.getCurrentUserFromRequest(request)
    if (!currentUser) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }
    const { postId: postIdParam, content } = await request.json()
    if (!postIdParam || !content?.trim()) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }
    // postId 转为 integer
    const postId = parseInt(postIdParam, 10)
    if (isNaN(postId)) {
      return NextResponse.json({ error: '帖子ID格式错误' }, { status: 400 })
    }
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace(/^Bearer\s+/i, '')
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { global: { headers: { Authorization: `Bearer ${accessToken}` } } })
    // 添加评论
    const { data: newComment, error: commentError } = await supabase
      .from('community_comments')
      .insert({
        post_id: postId,
        user_id: currentUser.id,
        content: content.trim()
      })
      .select(`
        *,
        users!community_comments_user_id_fkey(
          id, 
          username, 
          avatar_url, 
          level, 
          current_streak, 
          total_days, 
          max_streak, 
          personal_motto
        )
      `)
      .single()
    if (commentError) {
      return NextResponse.json({ error: '添加评论失败' }, { status: 500 })
    }
    
    // 格式化返回的评论数据
    const formattedComment = {
      id: newComment.id,
      user_id: newComment.user_id,
      content: newComment.content,
      created_at: newComment.created_at,
      username: newComment.users?.username || '用户',
      avatar_url: newComment.users?.avatar_url || '/placeholder-user.jpg',
      level: newComment.users?.level,
      current_streak: newComment.users?.current_streak,
      total_days: newComment.users?.total_days,
      max_streak: newComment.users?.max_streak,
      personal_motto: newComment.users?.personal_motto,
      isVerified: false,
      likes: 0
    }
    
    return NextResponse.json(formattedComment)
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
} 
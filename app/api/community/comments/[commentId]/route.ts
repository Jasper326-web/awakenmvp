import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { authService } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const currentUser = await authService.getCurrentUserFromRequest(request)
    if (!currentUser) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const commentId = params.commentId
    if (!commentId) {
      return NextResponse.json({ error: '缺少评论ID' }, { status: 400 })
    }

    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace(/^Bearer\s+/i, '')
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { 
      global: { headers: { Authorization: `Bearer ${accessToken}` } } 
    })

    // 首先检查评论是否存在且属于当前用户
    const { data: comment, error: fetchError } = await supabase
      .from('community_comments')
      .select('id, user_id, post_id')
      .eq('id', commentId)
      .single()

    if (fetchError || !comment) {
      return NextResponse.json({ error: '评论不存在' }, { status: 404 })
    }

    // 检查是否为评论作者
    if (comment.user_id !== currentUser.id) {
      return NextResponse.json({ error: '无权删除他人评论' }, { status: 403 })
    }

    // 删除评论
    const { error: deleteError } = await supabase
      .from('community_comments')
      .delete()
      .eq('id', commentId)

    if (deleteError) {
      console.error('删除评论失败:', deleteError)
      return NextResponse.json({ error: '删除评论失败' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: '评论已删除' })
  } catch (error) {
    console.error('删除评论时出错:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
} 
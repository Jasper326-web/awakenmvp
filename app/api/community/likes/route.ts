import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { authService } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    console.log('点赞 API 开始处理...')
    console.log('请求方法:', request.method)
    console.log('请求头:', Object.fromEntries(request.headers.entries()))
    
    const currentUser = await authService.getCurrentUserFromRequest(request)
    if (!currentUser) {
      console.log('用户未登录')
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }
    
    console.log('当前用户:', currentUser.id)
    
    const body = await request.json()
    console.log('请求体:', body)
    
    const { postId } = body
    if (!postId) {
      console.log('缺少帖子ID')
      return NextResponse.json({ error: '缺少帖子ID' }, { status: 400 })
    }
    
    console.log('帖子ID:', postId)
    
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace(/^Bearer\s+/i, '')
    
    if (!accessToken) {
      console.log('缺少访问令牌')
      return NextResponse.json({ error: '缺少访问令牌' }, { status: 401 })
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, 
      { 
        global: { 
          headers: { 
            Authorization: `Bearer ${accessToken}` 
          } 
        } 
      }
    )
    
    // 检查帖子是否存在
    const { data: post, error: postError } = await supabase
      .from('community_posts')
      .select('id')
      .eq('id', postId)
      .single()
    
    if (postError || !post) {
      console.log('帖子不存在:', postError)
      return NextResponse.json({ error: '帖子不存在' }, { status: 404 })
    }
    
    // 检查是否已点赞 - 使用 community_likes 表
    const { data: existing, error: checkError } = await supabase
      .from('community_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', currentUser.id)
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 是 "not found" 错误
      console.log('检查点赞状态失败:', checkError)
      return NextResponse.json({ error: '检查点赞状态失败' }, { status: 500 })
    }
    
    if (existing) {
      console.log('用户已点赞该帖子')
      return NextResponse.json({ error: '已点赞' }, { status: 400 })
    }
    
    // 插入点赞记录 - 触发器会自动更新 likes_count
    const { error: likeError } = await supabase
      .from('community_likes')
      .insert({ 
        post_id: postId, 
        user_id: currentUser.id 
      })
    
    if (likeError) {
      console.log('插入点赞记录失败:', likeError)
      return NextResponse.json({ 
        error: '点赞失败', 
        detail: likeError.message 
      }, { status: 500 })
    }
    
    console.log('点赞成功')
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('点赞接口服务器错误:', error)
    return NextResponse.json({ 
      error: '服务器错误', 
      detail: String(error) 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('取消点赞 API 开始处理...')
    console.log('请求方法:', request.method)
    console.log('请求头:', Object.fromEntries(request.headers.entries()))
    
    const currentUser = await authService.getCurrentUserFromRequest(request)
    if (!currentUser) {
      console.log('用户未登录')
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }
    
    console.log('当前用户:', currentUser.id)
    
    const body = await request.json()
    console.log('请求体:', body)
    
    const { postId } = body
    if (!postId) {
      console.log('缺少帖子ID')
      return NextResponse.json({ error: '缺少帖子ID' }, { status: 400 })
    }
    
    console.log('帖子ID:', postId)
    
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace(/^Bearer\s+/i, '')
    
    if (!accessToken) {
      console.log('缺少访问令牌')
      return NextResponse.json({ error: '缺少访问令牌' }, { status: 401 })
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, 
      { 
        global: { 
          headers: { 
            Authorization: `Bearer ${accessToken}` 
          } 
        } 
      }
    )
    
    // 检查是否已点赞 - 使用 community_likes 表
    const { data: existing, error: checkError } = await supabase
      .from('community_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', currentUser.id)
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.log('检查点赞状态失败:', checkError)
      return NextResponse.json({ error: '检查点赞状态失败' }, { status: 500 })
    }
    
    if (!existing) {
      console.log('用户未点赞该帖子')
      return NextResponse.json({ error: '未点赞' }, { status: 400 })
    }
    
    // 删除点赞记录 - 触发器会自动更新 likes_count
    const { error: delError } = await supabase
      .from('community_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', currentUser.id)
    
    if (delError) {
      console.log('删除点赞记录失败:', delError)
      return NextResponse.json({ 
        error: '取消点赞失败', 
        detail: delError.message 
      }, { status: 500 })
    }
    
    console.log('取消点赞成功')
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('取消点赞接口服务器错误:', error)
    return NextResponse.json({ 
      error: '服务器错误', 
      detail: String(error) 
    }, { status: 500 })
  }
} 
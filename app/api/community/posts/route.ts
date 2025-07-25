import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { authService } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

// GET - 获取帖子列表
export async function GET() {
  try {
    const { data: posts, error } = await supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('获取帖子失败:', error)
      return NextResponse.json({ error: '获取帖子失败' }, { status: 500 })
    }

    return NextResponse.json({ posts: posts || [] })
  } catch (error) {
    console.error('获取帖子时出错:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// POST - 创建新帖子
export async function POST(request: NextRequest) {
  try {
    console.log("[API] 开始处理帖子创建请求")
    
    // 使用新的API认证方法
    const currentUser = await authService.getCurrentUserFromRequest(request)
    console.log("[API] 当前用户:", currentUser ? currentUser.email : "null")
    if (!currentUser) {
      console.log("[API] 用户未登录，返回401")
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 获取 access token
    let accessToken = null;
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (authHeader) {
      accessToken = authHeader.replace(/^Bearer\s+/i, '');
    }
    if (!accessToken) {
      console.log("[API] 未获取到 access token，返回401");
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    // 用当前用户 token 创建 supabase 客户端
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    )

    const { content, images = [] } = await request.json()
    
    if (!content || !content.trim()) {
      return NextResponse.json({ error: '帖子内容不能为空' }, { status: 400 })
    }

    // 获取用户资料
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('username, avatar_url, level, current_streak')
      .eq('id', currentUser.id)
      .single()

    if (userError) {
      console.error('获取用户资料失败:', userError)
      return NextResponse.json({ error: '获取用户资料失败' }, { status: 500 })
    }

    // 会员校验：仅允许premium、active、end_date有效的用户发帖
    console.log('[API] 当前用户:', currentUser.email, 'ID:', currentUser.id)
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('id, end_date')
      .eq('user_id', currentUser.id)
      .eq('subscription_type', 'premium')
      .eq('status', 'active')
      .order('end_date', { ascending: false })
      .maybeSingle();
    console.log('[API] 查到的会员记录:', subscription, '错误:', subError);

    if (
      subError ||
      !subscription ||
      !subscription.end_date ||
      new Date(subscription.end_date).getTime() <= Date.now()
    ) {
      return NextResponse.json({ error: '仅限会员发帖' }, { status: 403 });
    }

    // images 字段类型安全处理和日志
    const safeImages = Array.isArray(images) ? images.filter(x => typeof x === 'string') : []
    console.log('[API] 准备插入帖子，images 字段:', safeImages, '类型:', Array.isArray(safeImages), safeImages.map(x => typeof x))

    // 创建新帖子
    const { data: newPost, error: postError } = await supabase
      .from('community_posts')
      .insert({
        user_id: currentUser.id,
        content: content.trim(),
        images: safeImages, // 保存图片URL数组
        likes_count: 0, // 初始化点赞数
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (postError) {
      console.error('创建帖子失败:', postError)
      return NextResponse.json({ error: '创建帖子失败', detail: String(postError) }, { status: 500 })
    }

    // 返回包含用户信息的完整帖子数据
    const postWithUser = {
      ...newPost,
      images: newPost.images || [], // 确保返回图片数组
      user: {
        id: currentUser.id,
        name: userProfile?.username || currentUser.user_metadata?.full_name || '用户',
        avatar: userProfile?.avatar_url || currentUser.user_metadata?.avatar_url || '/placeholder-user.jpg',
        level: userProfile?.level || 1,
        streak: userProfile?.current_streak || 0,
        isVerified: false,
        joinDate: currentUser.created_at,
        country: 'Local'
      },
      comments: []
    }

    return NextResponse.json({ post: postWithUser })
  } catch (error) {
    const err = error as any;
    console.error('创建帖子时出错:', err, err?.message, err?.stack)
    return NextResponse.json({ error: '服务器错误', detail: String(err) }, { status: 500 })
  }
} 

// DELETE - 删除帖子
export async function DELETE(request: NextRequest) {
  try {
    // 认证
    const currentUser = await authService.getCurrentUserFromRequest(request)
    if (!currentUser) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }
    // 获取 access token
    let accessToken = null;
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (authHeader) {
      accessToken = authHeader.replace(/^Bearer\s+/i, '');
    }
    if (!accessToken) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    // 用 token 创建 supabase 客户端
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    )
    // 获取 postId
    const { postId } = await request.json();
    if (!postId) {
      return NextResponse.json({ error: '缺少 postId' }, { status: 400 })
    }
    // 校验是否本人发帖
    const { data: post, error: postError } = await supabase
      .from('community_posts')
      .select('id, user_id')
      .eq('id', postId)
      .single();
    if (postError || !post) {
      return NextResponse.json({ error: '帖子不存在' }, { status: 404 })
    }
    if (post.user_id !== currentUser.id) {
      return NextResponse.json({ error: '无权删除他人帖子' }, { status: 403 })
    }
    // 删除帖子
    const { error: delError } = await supabase
      .from('community_posts')
      .delete()
      .eq('id', postId);
    if (delError) {
      return NextResponse.json({ error: '删除失败', detail: String(delError) }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    const err = error as any;
    return NextResponse.json({ error: '服务器错误', detail: String(err) }, { status: 500 })
  }
} 
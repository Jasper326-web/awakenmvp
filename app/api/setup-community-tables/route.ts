import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    // 创建社群帖子表
    const { error: postsTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS community_posts (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          likes INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (postsTableError) {
      console.error('创建社群帖子表失败:', postsTableError)
      return NextResponse.json({ error: '创建社群帖子表失败' }, { status: 500 })
    }

    // 创建社群评论表
    const { error: commentsTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS community_comments (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          likes INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (commentsTableError) {
      console.error('创建社群评论表失败:', commentsTableError)
      return NextResponse.json({ error: '创建社群评论表失败' }, { status: 500 })
    }

    // 创建索引
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
        CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at);
        CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON community_comments(post_id);
        CREATE INDEX IF NOT EXISTS idx_community_comments_user_id ON community_comments(user_id);
      `
    })

    if (indexError) {
      console.error('创建索引失败:', indexError)
      return NextResponse.json({ error: '创建索引失败' }, { status: 500 })
    }

    // 启用RLS
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
        ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
      `
    })

    if (rlsError) {
      console.error('启用RLS失败:', rlsError)
      return NextResponse.json({ error: '启用RLS失败' }, { status: 500 })
    }

    // 创建RLS策略
    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "community_posts_select_policy" ON community_posts;
        DROP POLICY IF EXISTS "community_posts_insert_policy" ON community_posts;
        DROP POLICY IF EXISTS "community_posts_update_policy" ON community_posts;
        DROP POLICY IF EXISTS "community_posts_delete_policy" ON community_posts;
        
        CREATE POLICY "community_posts_select_policy" ON community_posts
          FOR SELECT USING (true);

        CREATE POLICY "community_posts_insert_policy" ON community_posts
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "community_posts_update_policy" ON community_posts
          FOR UPDATE USING (auth.uid() = user_id);

        CREATE POLICY "community_posts_delete_policy" ON community_posts
          FOR DELETE USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "community_comments_select_policy" ON community_comments;
        DROP POLICY IF EXISTS "community_comments_insert_policy" ON community_comments;
        DROP POLICY IF EXISTS "community_comments_update_policy" ON community_comments;
        DROP POLICY IF EXISTS "community_comments_delete_policy" ON community_comments;
        
        CREATE POLICY "community_comments_select_policy" ON community_comments
          FOR SELECT USING (true);

        CREATE POLICY "community_comments_insert_policy" ON community_comments
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "community_comments_update_policy" ON community_comments
          FOR UPDATE USING (auth.uid() = user_id);

        CREATE POLICY "community_comments_delete_policy" ON community_comments
          FOR DELETE USING (auth.uid() = user_id);
      `
    })

    if (policyError) {
      console.error('创建RLS策略失败:', policyError)
      return NextResponse.json({ error: '创建RLS策略失败' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: '社群数据库表创建成功' 
    })
  } catch (error) {
    console.error('设置社群数据库表时出错:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
} 
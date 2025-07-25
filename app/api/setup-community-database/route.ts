import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    // 执行存储桶策略设置
    const storagePolicySQL = `
      -- 创建存储桶（如果不存在）
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('community-images', 'community-images', true)
      ON CONFLICT (id) DO NOTHING;

      -- 设置存储桶的 RLS 策略
      DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
      CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'community-images');

      DROP POLICY IF EXISTS "Allow public to view images" ON storage.objects;
      CREATE POLICY "Allow public to view images" ON storage.objects
      FOR SELECT TO public
      USING (bucket_id = 'community-images');
    `

    // 执行表结构修复
    const tableSQL = `
      -- 确保 community_posts 表存在并包含正确的字段
      CREATE TABLE IF NOT EXISTS public.community_posts (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL,
          content TEXT NOT NULL,
          images TEXT[] DEFAULT '{}',
          likes INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 添加外键约束（如果不存在）
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'fk_community_posts_user_id'
        ) THEN
          ALTER TABLE public.community_posts 
          ADD CONSTRAINT fk_community_posts_user_id 
          FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        END IF;
      END $$;

      -- 创建索引
      CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);
      CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at);

      -- 启用 RLS
      ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

      -- 创建 RLS 策略
      DROP POLICY IF EXISTS "Allow public to view posts" ON public.community_posts;
      CREATE POLICY "Allow public to view posts" ON public.community_posts
      FOR SELECT TO public
      USING (true);

      DROP POLICY IF EXISTS "Allow authenticated users to create posts" ON public.community_posts;
      CREATE POLICY "Allow authenticated users to create posts" ON public.community_posts
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Allow users to update their own posts" ON public.community_posts;
      CREATE POLICY "Allow users to update their own posts" ON public.community_posts
      FOR UPDATE TO authenticated
      USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Allow users to delete their own posts" ON public.community_posts;
      CREATE POLICY "Allow users to delete their own posts" ON public.community_posts
      FOR DELETE TO authenticated
      USING (auth.uid() = user_id);

      -- 创建更新时间触发器（如果不存在）
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_trigger 
              WHERE tgname = 'update_community_posts_updated_at'
          ) THEN
              CREATE TRIGGER update_community_posts_updated_at 
                  BEFORE UPDATE ON public.community_posts 
                  FOR EACH ROW 
                  EXECUTE FUNCTION update_updated_at_column();
          END IF;
      END $$;
    `

    // 执行SQL
    const { error: storageError } = await supabase.rpc('exec_sql', { sql: storagePolicySQL })
    const { error: tableError } = await supabase.rpc('exec_sql', { sql: tableSQL })

    if (storageError) {
      console.error('存储策略设置失败:', storageError)
    }
    if (tableError) {
      console.error('表结构设置失败:', tableError)
    }

    return NextResponse.json({ 
      success: true, 
      message: '数据库设置完成',
      storageError: storageError?.message,
      tableError: tableError?.message
    })

  } catch (error) {
    console.error('设置数据库时出错:', error)
    return NextResponse.json({ 
      error: '设置数据库失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
} 
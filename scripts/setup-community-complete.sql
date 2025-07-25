-- 完整的社区数据库设置脚本
-- 请在 Supabase SQL 编辑器中执行此脚本

-- 1. 创建存储桶（如果不存在）
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-images', 'community-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 设置存储桶的 RLS 策略
DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'community-images');

DROP POLICY IF EXISTS "Allow public to view images" ON storage.objects;
CREATE POLICY "Allow public to view images" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'community-images');

-- 3. 确保 community_posts 表存在并包含正确的字段
CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    images TEXT[] DEFAULT '{}',
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 添加外键约束（如果不存在）
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

-- 5. 创建索引
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at);

-- 6. 启用 RLS
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- 7. 创建 RLS 策略
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

-- 8. 创建更新时间触发器（如果不存在）
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
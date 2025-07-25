-- 修复社区帖子表结构
-- 添加缺失的外键关系和字段

-- 1. 确保 community_posts 表存在并包含正确的字段
CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    images TEXT[] DEFAULT '{}',
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 添加外键约束
ALTER TABLE public.community_posts 
ADD CONSTRAINT fk_community_posts_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at);

-- 4. 启用 RLS
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- 5. 创建 RLS 策略
-- 允许所有用户查看帖子
CREATE POLICY "Allow public to view posts" ON public.community_posts
FOR SELECT TO public
USING (true);

-- 允许认证用户创建帖子
CREATE POLICY "Allow authenticated users to create posts" ON public.community_posts
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 允许用户更新自己的帖子
CREATE POLICY "Allow users to update their own posts" ON public.community_posts
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- 允许用户删除自己的帖子
CREATE POLICY "Allow users to delete their own posts" ON public.community_posts
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- 6. 创建更新时间触发器（如果不存在）
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
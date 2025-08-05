-- 修复社区帖子公开访问权限
-- 确保未登录用户可以查看社区帖子

-- 1. 确保 community_posts 表存在
CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    images TEXT[] DEFAULT '{}',
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 启用 RLS
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- 3. 删除旧的策略（如果存在）
DROP POLICY IF EXISTS "Allow public to view posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can view all posts" ON public.community_posts;
DROP POLICY IF EXISTS "community_posts_select_policy" ON public.community_posts;

-- 4. 创建新的公开查看策略
CREATE POLICY "Allow public to view posts" ON public.community_posts
FOR SELECT TO public
USING (true);

-- 5. 确保认证用户可以创建帖子
DROP POLICY IF EXISTS "Allow authenticated users to create posts" ON public.community_posts;
CREATE POLICY "Allow authenticated users to create posts" ON public.community_posts
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 6. 确保用户可以更新自己的帖子
DROP POLICY IF EXISTS "Allow users to update their own posts" ON public.community_posts;
CREATE POLICY "Allow users to update their own posts" ON public.community_posts
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- 7. 确保用户可以删除自己的帖子
DROP POLICY IF EXISTS "Allow users to delete their own posts" ON public.community_posts;
CREATE POLICY "Allow users to delete their own posts" ON public.community_posts
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- 8. 验证策略是否正确应用
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'community_posts'; 
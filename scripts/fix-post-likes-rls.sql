-- 修复 community_likes 表的 RLS 策略
-- 确保用户可以正常点赞和取消点赞

-- 1. 确保 community_likes 表存在
CREATE TABLE IF NOT EXISTS community_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- 2. 启用 RLS
ALTER TABLE community_likes ENABLE ROW LEVEL SECURITY;

-- 3. 删除可能存在的旧策略
DROP POLICY IF EXISTS "Users can view their own likes" ON community_likes;
DROP POLICY IF EXISTS "Users can insert their own likes" ON community_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON community_likes;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON community_likes;

-- 4. 创建新的 RLS 策略
-- 允许用户查看所有点赞记录（用于检查是否已点赞）
CREATE POLICY "Users can view all likes" ON community_likes
  FOR SELECT USING (true);

-- 允许用户插入自己的点赞记录
CREATE POLICY "Users can insert their own likes" ON community_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 允许用户删除自己的点赞记录
CREATE POLICY "Users can delete their own likes" ON community_likes
  FOR DELETE USING (auth.uid() = user_id);

-- 5. 确保 community_posts 表也有正确的 RLS 策略
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "Users can view all posts" ON community_posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON community_posts;

-- 创建新的策略
CREATE POLICY "Users can view all posts" ON community_posts
  FOR SELECT USING (true);

CREATE POLICY "Users can update post likes count" ON community_posts
  FOR UPDATE USING (true);

-- 6. 确保 increment_likes 和 decrement_likes 函数存在
CREATE OR REPLACE FUNCTION increment_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE community_posts 
  SET likes_count = likes_count + 1 
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE community_posts 
  SET likes_count = GREATEST(likes_count - 1, 0)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- 7. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_community_likes_user_post ON community_likes(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_community_likes_post_id ON community_likes(post_id);

-- 8. 验证设置
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename IN ('community_likes', 'community_posts')
ORDER BY tablename, policyname; 
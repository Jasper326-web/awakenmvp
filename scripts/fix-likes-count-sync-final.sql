-- 最终修复 community_posts 的 likes_count 与 community_likes 表同步
-- 在 Supabase 控制台中运行此脚本

-- 1. 删除所有可能存在的触发器
DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON community_likes;
DROP TRIGGER IF EXISTS update_updated_at_column ON community_likes;
DROP TRIGGER IF EXISTS update_community_likes_updated_at ON community_likes;

-- 2. 为 community_likes 表添加 updated_at 字段（如果不存在）
ALTER TABLE community_likes 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. 更新所有帖子的点赞数，基于 community_likes 表的实际数据
UPDATE community_posts 
SET likes_count = (
  SELECT COUNT(*) 
  FROM community_likes 
  WHERE community_likes.post_id = community_posts.id
);

-- 4. 创建新的触发器函数，自动维护 likes_count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 插入点赞记录时，增加点赞数
    UPDATE community_posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- 删除点赞记录时，减少点赞数
    UPDATE community_posts 
    SET likes_count = GREATEST(likes_count - 1, 0) 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 5. 创建触发器
CREATE TRIGGER trigger_update_post_likes_count
  AFTER INSERT OR DELETE ON community_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

-- 6. 验证更新结果
SELECT 
  cp.id,
  LEFT(cp.content, 50) as content_preview,
  cp.likes_count as current_likes_count,
  COUNT(cl.id) as actual_likes_count
FROM community_posts cp
LEFT JOIN community_likes cl ON cp.id = cl.post_id
GROUP BY cp.id, cp.content, cp.likes_count
ORDER BY cp.created_at DESC
LIMIT 10; 
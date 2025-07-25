-- 终极修复：彻底解决 community_likes 表的触发器问题
-- 在 Supabase 控制台中运行此脚本

-- 1. 删除所有可能存在的触发器和函数
DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON community_likes;
DROP TRIGGER IF EXISTS update_updated_at_column ON community_likes;
DROP TRIGGER IF EXISTS update_community_likes_updated_at ON community_likes;
DROP TRIGGER IF EXISTS set_updated_at ON community_likes;
DROP TRIGGER IF EXISTS update_updated_at ON community_likes;

-- 2. 删除可能存在的函数
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_post_likes_count() CASCADE;

-- 3. 检查并添加 updated_at 字段
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'community_likes' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE community_likes ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 4. 更新所有帖子的点赞数，基于 community_likes 表的实际数据
UPDATE community_posts 
SET likes_count = (
  SELECT COUNT(*) 
  FROM community_likes 
  WHERE community_likes.post_id = community_posts.id
);

-- 5. 创建新的触发器函数，自动维护 likes_count
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

-- 6. 创建触发器
CREATE TRIGGER trigger_update_post_likes_count
  AFTER INSERT OR DELETE ON community_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

-- 7. 验证更新结果
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
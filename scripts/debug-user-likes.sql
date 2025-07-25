-- 调试用户点赞状态
-- 在 Supabase 控制台中运行此脚本

-- 1. 查看所有点赞记录
SELECT 
  cl.id,
  cl.user_id,
  cl.post_id,
  cl.created_at,
  u.email as user_email,
  cp.content as post_content
FROM community_likes cl
JOIN auth.users u ON cl.user_id = u.id
JOIN community_posts cp ON cl.post_id = cp.id
ORDER BY cl.created_at DESC
LIMIT 10;

-- 2. 查看特定用户的点赞记录（替换为你的用户ID）
-- SELECT 
--   cl.id,
--   cl.user_id,
--   cl.post_id,
--   cl.created_at,
--   cp.content as post_content,
--   cp.likes_count as post_likes_count
-- FROM community_likes cl
-- JOIN community_posts cp ON cl.post_id = cp.id
-- WHERE cl.user_id = '你的用户ID'
-- ORDER BY cl.created_at DESC;

-- 3. 检查用户表结构
SELECT 
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5; 
-- 清理冗余表格的脚本

-- 1. 检查是否还存在会员相关表格（应该已经被清理）
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('user_subscriptions', 'subscription_history', 'payment_records');

-- 2. 检查post_bookmarks表的使用情况
SELECT COUNT(*) as bookmark_count FROM post_bookmarks;

-- 3. 如果确认不需要收藏功能，可以删除post_bookmarks表
-- DROP TABLE IF EXISTS post_bookmarks CASCADE;

-- 4. 清理未使用的索引（如果有）
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
  AND indexname LIKE '%bookmark%';

-- 5. 检查是否有孤立的数据
-- 检查没有对应用户的记录
SELECT 'daily_checkins' as table_name, COUNT(*) as orphaned_records
FROM daily_checkins dc
LEFT JOIN users u ON dc.user_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 'addiction_tests' as table_name, COUNT(*) as orphaned_records
FROM addiction_tests at
LEFT JOIN users u ON at.user_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 'community_posts' as table_name, COUNT(*) as orphaned_records
FROM community_posts cp
LEFT JOIN users u ON cp.user_id = u.id
WHERE u.id IS NULL;

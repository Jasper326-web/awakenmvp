-- 测试评论API功能
-- 1. 查看现有的评论数据
SELECT 
    c.id,
    c.post_id,
    c.user_id,
    c.content,
    c.created_at,
    u.username,
    u.avatar_url
FROM community_comments c
LEFT JOIN users u ON c.user_id = u.id
ORDER BY c.created_at DESC
LIMIT 10;

-- 2. 查看评论表的外键约束
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'community_comments'
AND tc.constraint_type = 'FOREIGN KEY';

-- 3. 检查RLS策略
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'community_comments';

-- 4. 测试插入评论（需要替换为实际的用户ID和帖子ID）
-- INSERT INTO community_comments (post_id, user_id, content) 
-- VALUES (37, '25936bb6-f478-4651-a102-0edbf02adcf8', '测试评论内容');

-- 5. 查看评论统计
SELECT 
    COUNT(*) as total_comments,
    COUNT(DISTINCT post_id) as posts_with_comments,
    COUNT(DISTINCT user_id) as users_who_commented
FROM community_comments; 
-- 查看 community_comments 表结构
-- 1. 查看表的基本信息
SELECT 
    table_name,
    table_type,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'community_comments';

-- 2. 查看表的详细结构
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'community_comments'
ORDER BY ordinal_position;

-- 3. 查看表的主键和约束
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
WHERE tc.table_name = 'community_comments';

-- 4. 查看表的索引
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'community_comments';

-- 5. 查看表的RLS策略
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'community_comments';

-- 6. 查看表的行数（如果有数据的话）
SELECT COUNT(*) as total_comments FROM community_comments;

-- 7. 查看最新的几条评论数据（如果有的话）
SELECT 
    id,
    post_id,
    user_id,
    content,
    created_at,
    updated_at
FROM community_comments 
ORDER BY created_at DESC 
LIMIT 5; 
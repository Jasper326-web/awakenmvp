-- 检查user_subscriptions表结构
-- 这个脚本用于验证表结构是否正确

-- 1. 检查表是否存在
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'user_subscriptions';

-- 2. 检查表结构
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'user_subscriptions'
ORDER BY ordinal_position;

-- 3. 检查主键
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'user_subscriptions' 
AND constraint_type = 'PRIMARY KEY';

-- 4. 检查外键
SELECT 
    constraint_name,
    constraint_type,
    column_name
FROM information_schema.key_column_usage 
WHERE table_name = 'user_subscriptions';

-- 5. 检查现有数据
SELECT 
    id,
    user_id,
    subscription_type,
    status,
    created_at,
    updated_at,
    end_date
FROM user_subscriptions 
LIMIT 5;

-- 6. 检查RLS策略
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'user_subscriptions'
ORDER BY policyname;

-- 7. 检查表权限
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'user_subscriptions'; 
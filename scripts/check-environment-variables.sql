-- 检查环境变量配置
-- 这个脚本用于验证Supabase配置是否正确

-- 1. 检查Supabase URL和密钥
-- 注意：这些需要在应用层面检查，不是数据库查询
-- 需要检查的环境变量：
-- - NEXT_PUBLIC_SUPABASE_URL
-- - NEXT_PUBLIC_SUPABASE_ANON_KEY
-- - SUPABASE_SERVICE_ROLE_KEY
-- - CREEM_API_KEY
-- - CREEM_PRODUCT_ID

-- 2. 检查user_subscriptions表结构
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_subscriptions'
ORDER BY ordinal_position;

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
WHERE tablename = 'user_subscriptions'
ORDER BY policyname;

-- 4. 检查现有订阅记录
SELECT 
    us.id,
    us.user_id,
    us.subscription_type,
    us.status,
    us.created_at,
    us.end_date,
    u.email
FROM user_subscriptions us
JOIN auth.users u ON us.user_id = u.id
ORDER BY us.created_at DESC
LIMIT 10;

-- 5. 检查表权限
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'user_subscriptions';

-- 6. 测试服务端角色访问（如果可能）
-- 注意：这需要在应用层面测试
-- 使用SUPABASE_SERVICE_ROLE_KEY创建的客户端应该能够绕过RLS 
-- 测试Creem支付流程
-- 这个脚本用于验证支付流程的各个组件

-- 1. 检查用户订阅表结构
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_subscriptions'
ORDER BY ordinal_position;

-- 2. 检查是否有测试用户的订阅记录
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

-- 3. 检查webhook日志（如果有的话）
-- 注意：这需要查看应用日志，不是数据库查询

-- 4. 验证RLS策略
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'user_subscriptions';

-- 5. 测试插入订阅记录（模拟webhook）
-- 注意：这只是一个测试，实际应该由webhook处理
-- INSERT INTO user_subscriptions (
--     user_id,
--     subscription_type,
--     status,
--     created_at,
--     updated_at,
--     end_date
-- ) VALUES (
--     'test-user-id',
--     'premium',
--     'active',
--     NOW(),
--     NOW(),
--     NOW() + INTERVAL '30 days'
-- );

-- 6. 检查环境变量（需要在应用层面检查）
-- CREEM_API_KEY
-- CREEM_PRODUCT_ID
-- NEXT_PUBLIC_BASE_URL

-- 7. 验证支付成功页面的URL
-- 应该是: /payment/creem-success?status=completed&checkout_id={checkout_id}

-- 8. 检查webhook端点
-- 应该是: /api/creem/webhook

-- 9. 测试用户权限检查
SELECT 
    u.id,
    u.email,
    us.subscription_type,
    us.status,
    us.end_date,
    CASE 
        WHEN us.status = 'active' AND us.end_date > NOW() THEN 'Premium'
        ELSE 'Free'
    END as current_status
FROM auth.users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id 
    AND us.status = 'active' 
    AND us.end_date > NOW()
ORDER BY u.created_at DESC
LIMIT 10; 
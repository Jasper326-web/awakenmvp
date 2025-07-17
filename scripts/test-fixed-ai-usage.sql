-- 测试修复后的AI使用统计功能
-- 此脚本用于验证get_user_ai_usage_stats函数是否正常工作

-- 1. 检查user_subscriptions表结构
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_subscriptions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. 检查chat_logs表结构
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'chat_logs' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. 测试函数是否存在
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'get_user_ai_usage_stats';

-- 4. 测试函数调用（使用实际的用户ID）
-- 注意：需要替换为实际的用户ID
SELECT get_user_ai_usage_stats('25936bb6-f478-4651-a102-0edbf02adcf8');

-- 5. 验证用户订阅数据
SELECT 
    user_id,
    subscription_type,
    status,
    created_at
FROM user_subscriptions 
WHERE user_id = '25936bb6-f478-4651-a102-0edbf02adcf8';

-- 6. 验证chat_logs数据
SELECT 
    user_id,
    usage_date,
    COUNT(*) as daily_count
FROM chat_logs 
WHERE user_id = '25936bb6-f478-4651-a102-0edbf02adcf8'
GROUP BY user_id, usage_date
ORDER BY usage_date DESC
LIMIT 5;

-- 7. 显示测试结果
SELECT 'AI usage stats function test completed' as status; 
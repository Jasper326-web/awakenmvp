-- 测试AI使用统计功能
-- 此脚本用于验证get_user_ai_usage_stats函数的正确性

-- 1. 首先确保函数存在
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'get_user_ai_usage_stats';

-- 2. 测试函数返回的数据结构
-- 注意：需要替换为实际的用户ID
SELECT get_user_ai_usage_stats('25936bb6-f478-4651-a102-0edbf02adcf8');

-- 3. 验证chat_logs表的数据
SELECT 
    user_id,
    usage_date,
    COUNT(*) as daily_count
FROM chat_logs 
WHERE user_id = '25936bb6-f478-4651-a102-0edbf02adcf8'
GROUP BY user_id, usage_date
ORDER BY usage_date DESC
LIMIT 10;

-- 4. 验证本周和本月的日期范围计算
SELECT 
    CURRENT_DATE as today,
    CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE) - 1)::INTEGER as week_start,
    DATE_TRUNC('month', CURRENT_DATE)::DATE as month_start;

-- 5. 验证本周使用统计
SELECT 
    COUNT(*) as weekly_usage
FROM chat_logs
WHERE user_id = '25936bb6-f478-4651-a102-0edbf02adcf8'
AND usage_date >= CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE) - 1)::INTEGER
AND usage_date <= CURRENT_DATE;

-- 6. 验证本月使用统计
SELECT 
    COUNT(*) as monthly_usage
FROM chat_logs
WHERE user_id = '25936bb6-f478-4651-a102-0edbf02adcf8'
AND usage_date >= DATE_TRUNC('month', CURRENT_DATE)::DATE
AND usage_date <= CURRENT_DATE;

-- 7. 验证用户类型获取
SELECT 
    user_id,
    plan,
    status
FROM user_subscriptions
WHERE user_id = '25936bb6-f478-4651-a102-0edbf02adcf8'
AND status = 'active';

-- 8. 完整测试：模拟不同用户类型的使用情况
-- 免费用户测试
SELECT 
    'free_user_test' as test_name,
    get_user_ai_usage_stats('25936bb6-f478-4651-a102-0edbf02adcf8') as stats;

-- 9. 验证剩余次数计算
SELECT 
    today_usage,
    max_daily_usage,
    remaining_today,
    can_send_today
FROM get_user_ai_usage_stats('25936bb6-f478-4651-a102-0edbf02adcf8');

-- 10. 显示测试结果
SELECT 'AI usage stats test completed' as status; 
-- AI聊天系统测试脚本
-- 此脚本用于验证AI聊天系统的各个功能是否正常工作

-- 1. 检查表是否存在
SELECT 
    table_name,
    CASE 
        WHEN table_name = 'chat_logs' THEN '✓'
        WHEN table_name = 'user_preferences' THEN '✓'
        ELSE '✗'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('chat_logs', 'user_preferences');

-- 2. 检查chat_logs表结构
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'chat_logs' 
ORDER BY ordinal_position;

-- 3. 检查函数是否存在
SELECT 
    routine_name,
    CASE 
        WHEN routine_name = 'get_user_daily_ai_usage' THEN '✓'
        WHEN routine_name = 'can_user_send_ai_message' THEN '✓'
        WHEN routine_name = 'get_user_ai_usage_stats' THEN '✓'
        WHEN routine_name = 'get_user_memory' THEN '✓'
        ELSE '✗'
    END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'get_user_daily_ai_usage',
    'can_user_send_ai_message', 
    'get_user_ai_usage_stats',
    'get_user_memory'
);

-- 4. 检查索引是否存在
SELECT 
    indexname,
    CASE 
        WHEN indexname LIKE '%chat_logs_user_id%' THEN '✓'
        WHEN indexname LIKE '%chat_logs_created_at%' THEN '✓'
        WHEN indexname LIKE '%chat_logs_conversation_id%' THEN '✓'
        WHEN indexname LIKE '%chat_logs_user_usage_date%' THEN '✓'
        WHEN indexname LIKE '%user_preferences_user_id%' THEN '✓'
        ELSE '✗'
    END as status
FROM pg_indexes 
WHERE tablename IN ('chat_logs', 'user_preferences')
AND indexname LIKE '%idx_%';

-- 5. 检查触发器是否存在
SELECT 
    trigger_name,
    CASE 
        WHEN trigger_name = 'update_chat_logs_updated_at' THEN '✓'
        WHEN trigger_name = 'update_user_preferences_updated_at' THEN '✓'
        WHEN trigger_name = 'set_chat_logs_usage_date' THEN '✓'
        ELSE '✗'
    END as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name IN (
    'update_chat_logs_updated_at',
    'update_user_preferences_updated_at',
    'set_chat_logs_usage_date'
);

-- 6. 测试函数调用（需要替换为实际的用户ID）
-- 注意：这些测试需要有效的用户ID才能正常工作
-- SELECT get_user_daily_ai_usage('00000000-0000-0000-0000-000000000000');
-- SELECT can_user_send_ai_message('00000000-0000-0000-0000-000000000000', 'free');
-- SELECT get_user_ai_usage_stats('00000000-0000-0000-0000-000000000000');

-- 7. 检查RLS策略
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
WHERE tablename IN ('chat_logs', 'user_preferences');

-- 8. 总结
SELECT 'AI chat system test completed' as test_result; 
-- 验证从 relapsed 到 status 字段的迁移是否成功

-- 1. 检查表结构
SELECT '=== 表结构检查 ===' as check_type;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'daily_checkins' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. 检查约束
SELECT '=== 约束检查 ===' as check_type;

SELECT conname, contype, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'daily_checkins'::regclass;

-- 3. 检查数据迁移情况
SELECT '=== 数据迁移检查 ===' as check_type;

-- 统计各状态记录数量
SELECT 
    'Status 分布' as check_item,
    status,
    COUNT(*) as record_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM daily_checkins 
GROUP BY status
ORDER BY status;

-- 检查是否有无效的 status 值
SELECT 
    '无效 Status 值' as check_item,
    COUNT(*) as invalid_count
FROM daily_checkins 
WHERE status NOT IN ('pending', 'success', 'failed');

-- 4. 检查函数是否存在
SELECT '=== 函数检查 ===' as check_type;

SELECT 
    'calculate_streak' as function_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE p.proname = 'calculate_streak' 
        AND n.nspname = 'public'
    ) THEN '✅ 存在' ELSE '❌ 不存在' END as status;

SELECT 
    'update_user_stats' as function_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE p.proname = 'update_user_stats' 
        AND n.nspname = 'public'
    ) THEN '✅ 存在' ELSE '❌ 不存在' END as status;

SELECT 
    'refresh_all_user_stats' as function_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE p.proname = 'refresh_all_user_stats' 
        AND n.nspname = 'public'
    ) THEN '✅ 存在' ELSE '❌ 不存在' END as status;

-- 5. 检查触发器
SELECT '=== 触发器检查 ===' as check_type;

SELECT 
    tgname as trigger_name,
    tgtype,
    CASE WHEN tgtype & 66 > 0 THEN 'INSERT' END as insert_trigger,
    CASE WHEN tgtype & 130 > 0 THEN 'UPDATE' END as update_trigger,
    CASE WHEN tgtype & 258 > 0 THEN 'DELETE' END as delete_trigger
FROM pg_trigger 
WHERE tgrelid = 'daily_checkins'::regclass
AND NOT tgisinternal;

-- 6. 检查索引
SELECT '=== 索引检查 ===' as check_type;

SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'daily_checkins'
AND schemaname = 'public';

-- 7. 测试函数功能
SELECT '=== 函数功能测试 ===' as check_type;

-- 测试 calculate_streak 函数（如果有数据）
DO $$
DECLARE
    test_user_id UUID;
    test_result RECORD;
BEGIN
    -- 获取第一个有打卡记录的用户进行测试
    SELECT user_id INTO test_user_id 
    FROM daily_checkins 
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        SELECT * INTO test_result FROM calculate_streak(test_user_id);
        RAISE NOTICE '测试用户 % 的统计数据: 当前连续天数=%, 最大连续天数=%, 总天数=%', 
            test_user_id, test_result.current_streak, test_result.max_streak, test_result.total_days;
    ELSE
        RAISE NOTICE '没有找到测试数据';
    END IF;
END $$;

-- 8. 检查统计字段是否正确填充
SELECT '=== 统计字段检查 ===' as check_type;

SELECT 
    '有 max_streak 值的记录' as check_item,
    COUNT(*) as record_count
FROM daily_checkins 
WHERE max_streak IS NOT NULL;

SELECT 
    '有 total_days 值的记录' as check_item,
    COUNT(*) as record_count
FROM daily_checkins 
WHERE total_days IS NOT NULL;

-- 9. 检查数据一致性
SELECT '=== 数据一致性检查 ===' as check_type;

-- 检查是否有重复的 user_id + date 组合
SELECT 
    '重复的 user_id + date 组合' as check_item,
    COUNT(*) as duplicate_count
FROM (
    SELECT user_id, date, COUNT(*)
    FROM daily_checkins 
    GROUP BY user_id, date
    HAVING COUNT(*) > 1
) duplicates;

-- 10. 生成迁移报告
SELECT '=== 迁移报告 ===' as check_type;

WITH stats AS (
    SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as success_records,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_records,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_records,
        COUNT(CASE WHEN max_streak IS NOT NULL THEN 1 END) as records_with_max_streak,
        COUNT(CASE WHEN total_days IS NOT NULL THEN 1 END) as records_with_total_days
    FROM daily_checkins
)
SELECT 
    '迁移完成情况' as report_item,
    CASE 
        WHEN total_records > 0 THEN '✅ 有数据'
        ELSE '⚠️ 无数据'
    END as total_data,
    CASE 
        WHEN success_records + failed_records > 0 THEN '✅ 数据已迁移'
        ELSE '⚠️ 数据未迁移'
    END as data_migration,
    CASE 
        WHEN records_with_max_streak > 0 THEN '✅ 统计已计算'
        ELSE '⚠️ 统计未计算'
    END as stats_calculation,
    CASE 
        WHEN pending_records = 0 THEN '✅ 无待处理记录'
        ELSE '⚠️ 有待处理记录'
    END as pending_status
FROM stats; 
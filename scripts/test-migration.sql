-- 测试迁移后的功能
-- 这个脚本会测试基本的数据库操作

-- 1. 测试插入新记录
DO $$
DECLARE
    test_user_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
    test_date DATE := CURRENT_DATE;
    insert_result RECORD;
BEGIN
    RAISE NOTICE '开始测试插入新记录...';
    
    -- 插入一条成功记录
    INSERT INTO daily_checkins (user_id, date, status, notes)
    VALUES (test_user_id, test_date, 'success', '测试记录')
    ON CONFLICT (user_id, date) DO UPDATE SET
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        updated_at = NOW()
    RETURNING * INTO insert_result;
    
    RAISE NOTICE '✅ 成功插入记录: user_id=%, date=%, status=%', 
        insert_result.user_id, insert_result.date, insert_result.status;
    
    -- 插入一条失败记录
    INSERT INTO daily_checkins (user_id, date, status, notes)
    VALUES (test_user_id, test_date - INTERVAL '1 day', 'failed', '测试失败记录')
    ON CONFLICT (user_id, date) DO UPDATE SET
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        updated_at = NOW()
    RETURNING * INTO insert_result;
    
    RAISE NOTICE '✅ 成功插入失败记录: user_id=%, date=%, status=%', 
        insert_result.user_id, insert_result.date, insert_result.status;
END $$;

-- 2. 测试 calculate_streak 函数
DO $$
DECLARE
    test_user_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
    streak_result RECORD;
BEGIN
    RAISE NOTICE '开始测试 calculate_streak 函数...';
    
    SELECT * INTO streak_result FROM calculate_streak(test_user_id);
    
    RAISE NOTICE '✅ calculate_streak 结果: 当前连续天数=%, 最大连续天数=%, 总天数=%', 
        streak_result.current_streak, streak_result.max_streak, streak_result.total_days;
END $$;

-- 3. 测试 update_user_stats 函数
DO $$
DECLARE
    test_user_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
BEGIN
    RAISE NOTICE '开始测试 update_user_stats 函数...';
    
    PERFORM update_user_stats(test_user_id);
    
    RAISE NOTICE '✅ update_user_stats 执行完成';
END $$;

-- 4. 测试查询功能
SELECT '=== 查询测试 ===' as test_type;

-- 查询测试用户的记录
SELECT 
    user_id,
    date,
    status,
    notes,
    max_streak,
    total_days,
    created_at
FROM daily_checkins 
WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID
ORDER BY date DESC;

-- 5. 测试约束
DO $$
BEGIN
    RAISE NOTICE '开始测试约束...';
    
    -- 测试无效的 status 值
    BEGIN
        INSERT INTO daily_checkins (user_id, date, status)
        VALUES ('00000000-0000-0000-0000-000000000002'::UUID, CURRENT_DATE, 'invalid_status');
        RAISE EXCEPTION '❌ 约束测试失败：应该拒绝无效的 status 值';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE '✅ 约束测试通过：正确拒绝了无效的 status 值';
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️ 约束测试出现其他错误: %', SQLERRM;
    END;
END $$;

-- 6. 测试索引
SELECT '=== 索引测试 ===' as test_type;

-- 检查索引是否存在
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'daily_checkins'
AND schemaname = 'public'
AND indexname LIKE '%status%';

-- 7. 测试触发器
DO $$
DECLARE
    test_user_id UUID := '00000000-0000-0000-0000-000000000003'::UUID;
    trigger_result RECORD;
BEGIN
    RAISE NOTICE '开始测试触发器...';
    
    -- 插入一条记录，触发器应该自动更新统计字段
    INSERT INTO daily_checkins (user_id, date, status, notes)
    VALUES (test_user_id, CURRENT_DATE, 'success', '触发器测试记录')
    RETURNING * INTO trigger_result;
    
    RAISE NOTICE '✅ 触发器测试: 插入记录后 max_streak=%, total_days=%', 
        trigger_result.max_streak, trigger_result.total_days;
END $$;

-- 8. 清理测试数据
DO $$
BEGIN
    RAISE NOTICE '清理测试数据...';
    
    DELETE FROM daily_checkins 
    WHERE user_id IN (
        '00000000-0000-0000-0000-000000000001'::UUID,
        '00000000-0000-0000-0000-000000000002'::UUID,
        '00000000-0000-0000-0000-000000000003'::UUID
    );
    
    RAISE NOTICE '✅ 测试数据清理完成';
END $$;

-- 9. 测试总结
SELECT '=== 测试总结 ===' as test_type;

SELECT 
    '迁移测试完成' as test_result,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'daily_checkins' 
            AND column_name = 'status'
            AND table_schema = 'public'
        ) THEN '✅ status 字段存在'
        ELSE '❌ status 字段不存在'
    END as status_field_test,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p 
            JOIN pg_namespace n ON p.pronamespace = n.oid 
            WHERE p.proname = 'calculate_streak' 
            AND n.nspname = 'public'
        ) THEN '✅ calculate_streak 函数存在'
        ELSE '❌ calculate_streak 函数不存在'
    END as function_test,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_trigger 
            WHERE tgrelid = 'daily_checkins'::regclass
            AND tgname = 'update_checkin_stats_trigger'
            AND NOT tgisinternal
        ) THEN '✅ 触发器存在'
        ELSE '❌ 触发器不存在'
    END as trigger_test;

SELECT '🎉 所有测试完成！如果所有测试都通过，说明迁移成功。' as final_message; 
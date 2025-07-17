-- 完整的迁移执行脚本
-- 这个脚本会按顺序执行所有迁移步骤

-- 设置输出格式
\pset format expanded

-- 开始迁移
SELECT '🚀 开始从 relapsed 字段迁移到 status 字段...' as migration_start;

-- 第一步：检查当前状态
SELECT '=== 第一步：检查当前状态 ===' as step;

DO $$
DECLARE
    has_relapsed BOOLEAN;
    has_status BOOLEAN;
    total_records INTEGER;
BEGIN
    -- 检查字段存在性
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_checkins' 
        AND column_name = 'relapsed'
        AND table_schema = 'public'
    ) INTO has_relapsed;
    
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_checkins' 
        AND column_name = 'status'
        AND table_schema = 'public'
    ) INTO has_status;
    
    -- 检查记录数量
    SELECT COUNT(*) INTO total_records FROM daily_checkins;
    
    RAISE NOTICE '当前状态:';
    RAISE NOTICE '  - relapsed 字段存在: %', has_relapsed;
    RAISE NOTICE '  - status 字段存在: %', has_status;
    RAISE NOTICE '  - 总记录数: %', total_records;
    
    IF has_status AND has_relapsed THEN
        RAISE NOTICE '⚠️ 两个字段都存在，将进行数据迁移';
    ELSIF has_status AND NOT has_relapsed THEN
        RAISE NOTICE '✅ 迁移已完成，只有 status 字段';
    ELSIF NOT has_status AND has_relapsed THEN
        RAISE NOTICE '📋 需要添加 status 字段并迁移数据';
    ELSE
        RAISE NOTICE '❌ 两个字段都不存在，请检查表结构';
    END IF;
END $$;

-- 第二步：执行主迁移脚本
SELECT '=== 第二步：执行主迁移脚本 ===' as step;

-- 这里会执行 migrate-to-status-field.sql 的内容
-- 由于这是一个独立的脚本，你需要单独运行它
-- \i scripts/migrate-to-status-field.sql

-- 第三步：验证迁移结果
SELECT '=== 第三步：验证迁移结果 ===' as step;

-- 这里会执行 verify-migration.sql 的内容
-- \i scripts/verify-migration.sql

-- 第四步：运行功能测试
SELECT '=== 第四步：运行功能测试 ===' as step;

-- 这里会执行 test-migration.sql 的内容
-- \i scripts/test-migration.sql

-- 第五步：生成迁移报告
SELECT '=== 第五步：生成迁移报告 ===' as step;

DO $$
DECLARE
    total_records INTEGER;
    success_records INTEGER;
    failed_records INTEGER;
    pending_records INTEGER;
    records_with_max_streak INTEGER;
    records_with_total_days INTEGER;
    has_relapsed BOOLEAN;
    has_status BOOLEAN;
    has_functions BOOLEAN;
    has_triggers BOOLEAN;
BEGIN
    -- 获取数据统计
    SELECT COUNT(*) INTO total_records FROM daily_checkins;
    SELECT COUNT(*) INTO success_records FROM daily_checkins WHERE status = 'success';
    SELECT COUNT(*) INTO failed_records FROM daily_checkins WHERE status = 'failed';
    SELECT COUNT(*) INTO pending_records FROM daily_checkins WHERE status = 'pending';
    SELECT COUNT(*) INTO records_with_max_streak FROM daily_checkins WHERE max_streak IS NOT NULL;
    SELECT COUNT(*) INTO records_with_total_days FROM daily_checkins WHERE total_days IS NOT NULL;
    
    -- 检查字段存在性
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_checkins' 
        AND column_name = 'relapsed'
        AND table_schema = 'public'
    ) INTO has_relapsed;
    
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_checkins' 
        AND column_name = 'status'
        AND table_schema = 'public'
    ) INTO has_status;
    
    -- 检查函数存在性
    SELECT EXISTS(
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE p.proname = 'calculate_streak' 
        AND n.nspname = 'public'
    ) INTO has_functions;
    
    -- 检查触发器存在性
    SELECT EXISTS(
        SELECT 1 FROM pg_trigger 
        WHERE tgrelid = 'daily_checkins'::regclass
        AND tgname = 'update_checkin_stats_trigger'
        AND NOT tgisinternal
    ) INTO has_triggers;
    
    -- 生成报告
    RAISE NOTICE '📊 迁移报告:';
    RAISE NOTICE '  数据统计:';
    RAISE NOTICE '    - 总记录数: %', total_records;
    RAISE NOTICE '    - 成功记录: %', success_records;
    RAISE NOTICE '    - 失败记录: %', failed_records;
    RAISE NOTICE '    - 待处理记录: %', pending_records;
    RAISE NOTICE '    - 有最大连续天数的记录: %', records_with_max_streak;
    RAISE NOTICE '    - 有总天数的记录: %', records_with_total_days;
    RAISE NOTICE '  字段状态:';
    RAISE NOTICE '    - relapsed 字段存在: %', has_relapsed;
    RAISE NOTICE '    - status 字段存在: %', has_status;
    RAISE NOTICE '  功能状态:';
    RAISE NOTICE '    - 函数存在: %', has_functions;
    RAISE NOTICE '    - 触发器存在: %', has_triggers;
    
    -- 评估迁移状态
    IF has_status AND has_functions AND has_triggers THEN
        IF has_relapsed THEN
            RAISE NOTICE '🎯 迁移状态: 基本完成，建议清理 relapsed 字段';
        ELSE
            RAISE NOTICE '🎉 迁移状态: 完全完成！';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ 迁移状态: 需要检查，某些组件可能缺失';
    END IF;
END $$;

-- 第六步：提供后续步骤建议
SELECT '=== 第六步：后续步骤建议 ===' as step;

SELECT 
    '迁移完成后的建议' as recommendation,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'daily_checkins' 
            AND column_name = 'relapsed'
            AND table_schema = 'public'
        ) THEN '运行 cleanup-after-migration.sql 清理旧字段'
        ELSE '无需清理，relapsed 字段已移除'
    END as cleanup_recommendation,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'daily_checkins' 
            AND column_name = 'status'
            AND table_schema = 'public'
        ) THEN '前端代码已更新，可以正常使用'
        ELSE '需要检查前端代码更新'
    END as frontend_recommendation,
    '定期运行 verify-migration.sql 检查数据一致性' as maintenance_recommendation;

-- 完成提示
SELECT '🎉 迁移脚本执行完成！请检查上述报告并执行相应的后续步骤。' as completion_message;

-- 重置输出格式
\pset format aligned 
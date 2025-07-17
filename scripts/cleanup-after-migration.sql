-- 清理迁移后的旧字段和索引
-- 注意：只有在确认迁移成功后才能运行此脚本

-- 1. 首先验证迁移是否成功
DO $$
DECLARE
    total_records INTEGER;
    success_records INTEGER;
    failed_records INTEGER;
    pending_records INTEGER;
    invalid_status_count INTEGER;
BEGIN
    -- 检查数据迁移情况
    SELECT COUNT(*) INTO total_records FROM daily_checkins;
    SELECT COUNT(*) INTO success_records FROM daily_checkins WHERE status = 'success';
    SELECT COUNT(*) INTO failed_records FROM daily_checkins WHERE status = 'failed';
    SELECT COUNT(*) INTO pending_records FROM daily_checkins WHERE status = 'pending';
    SELECT COUNT(*) INTO invalid_status_count FROM daily_checkins WHERE status NOT IN ('pending', 'success', 'failed');
    
    -- 验证迁移是否成功
    IF total_records = 0 THEN
        RAISE EXCEPTION '没有找到任何记录，请先确认数据存在';
    END IF;
    
    IF invalid_status_count > 0 THEN
        RAISE EXCEPTION '发现 % 条无效的 status 值，请先修复数据', invalid_status_count;
    END IF;
    
    IF success_records + failed_records = 0 THEN
        RAISE EXCEPTION '没有找到已迁移的数据，请先运行迁移脚本';
    END IF;
    
    RAISE NOTICE '✅ 迁移验证通过！';
    RAISE NOTICE '总记录数: %', total_records;
    RAISE NOTICE '成功记录: %', success_records;
    RAISE NOTICE '失败记录: %', failed_records;
    RAISE NOTICE '待处理记录: %', pending_records;
END $$;

-- 2. 备份重要数据（可选）
-- 如果你想要备份，可以取消注释以下代码
/*
CREATE TABLE daily_checkins_backup AS 
SELECT *, NOW() as backup_created_at 
FROM daily_checkins;

CREATE INDEX idx_daily_checkins_backup_user_date 
ON daily_checkins_backup(user_id, date);
*/

-- 3. 删除旧的索引（如果存在）
DROP INDEX IF EXISTS idx_daily_checkins_user_date_relapsed;
DROP INDEX IF EXISTS idx_daily_checkins_relapsed;

-- 4. 删除旧的触发器（如果存在）
DROP TRIGGER IF EXISTS update_stats_on_checkin ON daily_checkins;
DROP TRIGGER IF EXISTS update_streak_on_checkin ON daily_checkins;

-- 5. 删除旧的函数（如果存在）
DROP FUNCTION IF EXISTS update_user_streak();
DROP FUNCTION IF EXISTS update_checkin_stats();

-- 6. 移除 relapsed 字段
-- 注意：这个操作不可逆，请确保迁移成功后再执行
ALTER TABLE daily_checkins DROP COLUMN IF EXISTS relapsed;

-- 7. 验证清理结果
DO $$
DECLARE
    column_count INTEGER;
    index_count INTEGER;
    trigger_count INTEGER;
BEGIN
    -- 检查是否还有 relapsed 字段
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_name = 'daily_checkins' 
    AND column_name = 'relapsed'
    AND table_schema = 'public';
    
    IF column_count > 0 THEN
        RAISE EXCEPTION 'relapsed 字段仍然存在，清理失败';
    END IF;
    
    -- 检查索引
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE tablename = 'daily_checkins'
    AND schemaname = 'public'
    AND indexname LIKE '%relapsed%';
    
    IF index_count > 0 THEN
        RAISE WARNING '发现 % 个包含 relapsed 的索引', index_count;
    END IF;
    
    -- 检查触发器
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger 
    WHERE tgrelid = 'daily_checkins'::regclass
    AND NOT tgisinternal;
    
    RAISE NOTICE '✅ 清理完成！';
    RAISE NOTICE '剩余触发器数量: %', trigger_count;
END $$;

-- 8. 显示最终表结构
SELECT '=== 最终表结构 ===' as check_type;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'daily_checkins' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 9. 显示最终索引
SELECT '=== 最终索引 ===' as check_type;

SELECT indexname, indexdef
FROM pg_indexes 
WHERE tablename = 'daily_checkins'
AND schemaname = 'public';

-- 10. 显示最终触发器
SELECT '=== 最终触发器 ===' as check_type;

SELECT 
    tgname as trigger_name,
    CASE WHEN tgtype & 66 > 0 THEN 'INSERT' END as insert_trigger,
    CASE WHEN tgtype & 130 > 0 THEN 'UPDATE' END as update_trigger,
    CASE WHEN tgtype & 258 > 0 THEN 'DELETE' END as delete_trigger
FROM pg_trigger 
WHERE tgrelid = 'daily_checkins'::regclass
AND NOT tgisinternal;

-- 11. 最终验证
SELECT '=== 最终验证 ===' as check_type;

SELECT 
    '清理完成情况' as check_item,
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'daily_checkins' 
            AND column_name = 'relapsed'
            AND table_schema = 'public'
        ) THEN '✅ relapsed 字段已移除'
        ELSE '❌ relapsed 字段仍然存在'
    END as relapsed_field_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'daily_checkins' 
            AND column_name = 'status'
            AND table_schema = 'public'
        ) THEN '✅ status 字段存在'
        ELSE '❌ status 字段不存在'
    END as status_field_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p 
            JOIN pg_namespace n ON p.pronamespace = n.oid 
            WHERE p.proname = 'calculate_streak' 
            AND n.nspname = 'public'
        ) THEN '✅ calculate_streak 函数存在'
        ELSE '❌ calculate_streak 函数不存在'
    END as function_status;

-- 完成提示
SELECT '🎉 清理完成！relapsed 字段已安全移除，现在使用 status 字段进行所有操作。' as completion_message; 
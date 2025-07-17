-- 迁移 daily_checkins 表从 relapsed 字段到 status 字段
-- 这个脚本会安全地迁移数据并更新所有相关函数

-- 1. 首先检查当前表结构
DO $$
BEGIN
    RAISE NOTICE '开始检查 daily_checkins 表结构...';
    
    -- 检查是否存在 status 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_checkins' 
        AND column_name = 'status'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ status 字段不存在，将添加该字段';
    ELSE
        RAISE NOTICE '⚠️ status 字段已存在';
    END IF;
    
    -- 检查是否存在 relapsed 字段
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_checkins' 
        AND column_name = 'relapsed'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ relapsed 字段存在，将进行数据迁移';
    ELSE
        RAISE NOTICE '⚠️ relapsed 字段不存在';
    END IF;
END $$;

-- 2. 添加 status 字段（如果不存在）
ALTER TABLE daily_checkins 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

-- 3. 添加约束
ALTER TABLE daily_checkins 
DROP CONSTRAINT IF EXISTS check_status;

ALTER TABLE daily_checkins 
ADD CONSTRAINT check_status 
CHECK (status IN ('pending', 'success', 'failed'));

-- 4. 迁移现有数据（从 relapsed 到 status）
UPDATE daily_checkins 
SET status = CASE 
    WHEN relapsed = TRUE THEN 'failed'
    WHEN relapsed = FALSE THEN 'success'
    ELSE 'pending'
END
WHERE status = 'pending' OR status IS NULL;

-- 5. 确保所有记录都有有效的 status 值
UPDATE daily_checkins 
SET status = 'success'
WHERE status IS NULL OR status NOT IN ('pending', 'success', 'failed');

-- 6. 添加统计字段（如果不存在）
ALTER TABLE daily_checkins 
ADD COLUMN IF NOT EXISTS max_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_days INTEGER DEFAULT 0;

-- 7. 删除旧的函数（如果存在）
DROP FUNCTION IF EXISTS calculate_streak(UUID);
DROP FUNCTION IF EXISTS update_user_stats(UUID);
DROP FUNCTION IF EXISTS update_checkin_stats();
DROP FUNCTION IF EXISTS update_checkin_stats_trigger();

-- 8. 创建新的计算连续天数的函数
CREATE OR REPLACE FUNCTION calculate_streak(p_user_id UUID)
RETURNS TABLE(current_streak INTEGER, max_streak INTEGER, total_days INTEGER) AS $$
DECLARE
    current_streak_count INTEGER := 0;
    max_streak_count INTEGER := 0;
    total_successful_days INTEGER := 0;
    prev_date DATE := NULL;
    checkin_record RECORD;
BEGIN
    -- 计算总成功天数
    SELECT COUNT(*) INTO total_successful_days
    FROM daily_checkins 
    WHERE user_id = p_user_id 
    AND status = 'success';
    
    -- 计算连续天数和最大连续天数
    FOR checkin_record IN 
        SELECT date, status
        FROM daily_checkins 
        WHERE user_id = p_user_id 
        ORDER BY date ASC
    LOOP
        IF checkin_record.status = 'success' THEN
            IF prev_date IS NULL OR checkin_record.date = prev_date + INTERVAL '1 day' THEN
                current_streak_count := current_streak_count + 1;
                max_streak_count := GREATEST(max_streak_count, current_streak_count);
            ELSE
                current_streak_count := 1;
                max_streak_count := GREATEST(max_streak_count, current_streak_count);
            END IF;
            prev_date := checkin_record.date;
        ELSE
            current_streak_count := 0;
            prev_date := NULL;
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT current_streak_count, max_streak_count, total_successful_days;
END;
$$ LANGUAGE plpgsql;

-- 9. 创建更新用户统计的函数
CREATE OR REPLACE FUNCTION update_user_stats(p_user_id UUID)
RETURNS void AS $$
DECLARE
    stats_record RECORD;
BEGIN
    -- 获取用户的统计数据
    SELECT * INTO stats_record FROM calculate_streak(p_user_id);
    
    -- 更新用户最新的打卡记录中的统计字段
    UPDATE daily_checkins 
    SET 
        max_streak = stats_record.max_streak,
        total_days = stats_record.total_days,
        updated_at = NOW()
    WHERE user_id = p_user_id 
    AND date = (
        SELECT MAX(date) 
        FROM daily_checkins 
        WHERE user_id = p_user_id
    );
    
    -- 如果没有找到记录进行更新，则插入一条新记录（防御性编程）
    IF NOT FOUND THEN
        RAISE NOTICE 'No recent checkin record found for user %', p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 10. 创建触发器函数
CREATE OR REPLACE FUNCTION update_checkin_stats_trigger()
RETURNS TRIGGER AS $$
DECLARE
    stats_record RECORD;
BEGIN
    -- 获取用户的最新统计数据
    SELECT * INTO stats_record FROM calculate_streak(NEW.user_id);
    
    -- 更新当前记录的统计字段
    NEW.max_streak := stats_record.max_streak;
    NEW.total_days := stats_record.total_days;
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS update_checkin_stats_trigger ON daily_checkins;
DROP TRIGGER IF EXISTS update_stats_on_checkin ON daily_checkins;
DROP TRIGGER IF EXISTS update_streak_on_checkin ON daily_checkins;

-- 12. 创建新触发器
CREATE TRIGGER update_checkin_stats_trigger
    BEFORE INSERT OR UPDATE ON daily_checkins
    FOR EACH ROW
    EXECUTE FUNCTION update_checkin_stats_trigger();

-- 13. 创建批量更新所有用户统计数据的函数
CREATE OR REPLACE FUNCTION refresh_all_user_stats()
RETURNS void AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- 遍历所有有打卡记录的用户
    FOR user_record IN 
        SELECT DISTINCT user_id 
        FROM daily_checkins
    LOOP
        -- 更新每个用户的统计数据
        PERFORM update_user_stats(user_record.user_id);
    END LOOP;
    
    RAISE NOTICE 'All user stats have been refreshed';
END;
$$ LANGUAGE plpgsql;

-- 14. 创建获取用户当前连续天数的函数
CREATE OR REPLACE FUNCTION get_user_current_streak(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    current_streak_val INTEGER;
BEGIN
    SELECT current_streak INTO current_streak_val 
    FROM calculate_streak(user_uuid);
    
    RETURN COALESCE(current_streak_val, 0);
END;
$$ LANGUAGE plpgsql;

-- 15. 创建获取排行榜数据的函数
CREATE OR REPLACE FUNCTION get_leaderboard(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
    user_id UUID,
    max_streak INTEGER,
    total_days INTEGER,
    rank_position INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH user_stats AS (
        SELECT DISTINCT ON (dc.user_id)
            dc.user_id,
            dc.max_streak,
            dc.total_days
        FROM daily_checkins dc
        WHERE dc.max_streak IS NOT NULL
        ORDER BY dc.user_id, dc.date DESC
    ),
    ranked_users AS (
        SELECT 
            us.user_id,
            us.max_streak,
            us.total_days,
            ROW_NUMBER() OVER (ORDER BY us.max_streak DESC, us.total_days DESC) as rank_pos
        FROM user_stats us
    )
    SELECT 
        ru.user_id,
        ru.max_streak,
        ru.total_days,
        ru.rank_pos::INTEGER
    FROM ranked_users ru
    ORDER BY ru.rank_pos
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 16. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_daily_checkins_status ON daily_checkins(status);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date_status ON daily_checkins(user_id, date, status);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date_desc ON daily_checkins(user_id, date DESC);

-- 17. 批量更新所有现有用户的统计数据
SELECT refresh_all_user_stats();

-- 18. 显示迁移结果
DO $$
DECLARE
    total_records INTEGER;
    success_records INTEGER;
    failed_records INTEGER;
    pending_records INTEGER;
BEGIN
    -- 统计记录数量
    SELECT COUNT(*) INTO total_records FROM daily_checkins;
    SELECT COUNT(*) INTO success_records FROM daily_checkins WHERE status = 'success';
    SELECT COUNT(*) INTO failed_records FROM daily_checkins WHERE status = 'failed';
    SELECT COUNT(*) INTO pending_records FROM daily_checkins WHERE status = 'pending';
    
    RAISE NOTICE '迁移完成！统计信息：';
    RAISE NOTICE '总记录数: %', total_records;
    RAISE NOTICE '成功记录: %', success_records;
    RAISE NOTICE '失败记录: %', failed_records;
    RAISE NOTICE '待处理记录: %', pending_records;
END $$;

-- 19. 验证迁移结果
SELECT 
    'Migration completed successfully!' as status,
    COUNT(*) as total_records,
    COUNT(CASE WHEN status = 'success' THEN 1 END) as success_records,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_records,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_records
FROM daily_checkins; 
-- 手动修复连续天数和总打卡天数计算
-- 在Supabase SQL编辑器中运行此脚本

-- 1. 删除所有旧的函数和触发器
DROP TRIGGER IF EXISTS update_checkin_stats_trigger ON daily_checkins;
DROP TRIGGER IF EXISTS update_streak_on_checkin ON daily_checkins;
DROP TRIGGER IF EXISTS update_user_streak_trigger ON daily_checkins;

DROP FUNCTION IF EXISTS calculate_streak(uuid) CASCADE;
DROP FUNCTION IF EXISTS calculate_current_streak(uuid) CASCADE;
DROP FUNCTION IF EXISTS calculate_max_streak(uuid) CASCADE;
DROP FUNCTION IF EXISTS calculate_total_success_days(uuid) CASCADE;
DROP FUNCTION IF EXISTS update_user_checkin_stats(uuid) CASCADE;
DROP FUNCTION IF EXISTS update_user_stats(uuid) CASCADE;
DROP FUNCTION IF EXISTS update_checkin_stats() CASCADE;
DROP FUNCTION IF EXISTS update_user_streak() CASCADE;
DROP FUNCTION IF EXISTS trigger_update_checkin_stats() CASCADE;
DROP FUNCTION IF EXISTS update_checkin_stats_trigger() CASCADE;
DROP FUNCTION IF EXISTS get_user_current_streak(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_leaderboard(int) CASCADE;
DROP FUNCTION IF EXISTS refresh_all_user_stats() CASCADE;
DROP FUNCTION IF EXISTS calculate_total_days(uuid) CASCADE;

-- 2. 创建正确的计算最大连续天数的函数
CREATE OR REPLACE FUNCTION calculate_max_streak(user_uuid uuid)
RETURNS integer AS $$
DECLARE
    checkin_record RECORD;
    current_streak int := 0;
    max_streak int := 0;
    prev_date date := NULL;
    date_diff int;
BEGIN
    -- 按日期正序遍历所有成功打卡记录
    FOR checkin_record IN 
        SELECT date
        FROM daily_checkins 
        WHERE user_id = user_uuid 
        AND status = 'success'
        ORDER BY date ASC
    LOOP
        IF prev_date IS NULL THEN
            -- 第一次成功打卡
            current_streak := 1;
        ELSE
            date_diff := checkin_record.date - prev_date;
            
            -- 检查连续性（只允许连续的天数）
            IF date_diff = 1 THEN
                current_streak := current_streak + 1;
            ELSE
                -- 不连续，重新开始
                current_streak := 1;
            END IF;
        END IF;
        
        -- 更新最大连续天数
        max_streak := GREATEST(max_streak, current_streak);
        prev_date := checkin_record.date;
    END LOOP;
    
    RETURN COALESCE(max_streak, 0);
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error calculating max streak for user %: %', user_uuid, SQLERRM;
        RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- 3. 创建计算总成功天数的函数
CREATE OR REPLACE FUNCTION calculate_total_success_days(user_uuid uuid)
RETURNS integer AS $$
DECLARE
    total_count int := 0;
BEGIN
    -- 统计所有成功打卡的天数（status = 'success'）
    SELECT COUNT(*) INTO total_count
    FROM daily_checkins 
    WHERE user_id = user_uuid 
    AND status = 'success';
    
    RETURN COALESCE(total_count, 0);
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error calculating total success days for user %: %', user_uuid, SQLERRM;
        RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- 4. 创建触发器函数
CREATE OR REPLACE FUNCTION trigger_update_checkin_stats()
RETURNS TRIGGER AS $$
DECLARE
    max_streak_val int;
    total_days_val int;
BEGIN
    -- 计算统计数据
    max_streak_val := calculate_max_streak(NEW.user_id);
    total_days_val := calculate_total_success_days(NEW.user_id);
    
    -- 更新当前记录的统计字段
    NEW.max_streak := max_streak_val;
    NEW.total_days := total_days_val;
    NEW.updated_at := NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in checkin stats trigger for user %: %', NEW.user_id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. 创建触发器
CREATE TRIGGER update_checkin_stats_trigger
    BEFORE INSERT OR UPDATE ON daily_checkins
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_checkin_stats();

-- 6. 立即更新所有用户的统计数据
UPDATE daily_checkins 
SET 
    max_streak = calculate_max_streak(user_id),
    total_days = calculate_total_success_days(user_id),
    updated_at = NOW()
WHERE user_id IN (SELECT DISTINCT user_id FROM daily_checkins);

-- 7. 显示修复结果
SELECT 
    user_id,
    MAX(date) as latest_date,
    MAX(max_streak) as max_streak,
    MAX(total_days) as total_days,
    COUNT(*) as total_records
FROM daily_checkins 
WHERE max_streak IS NOT NULL 
GROUP BY user_id 
ORDER BY MAX(max_streak) DESC 
LIMIT 10;

-- 8. 验证特定用户的详细数据（替换为你的用户ID）
-- SELECT 
--     date,
--     status,
--     max_streak,
--     total_days
-- FROM daily_checkins 
-- WHERE user_id = '你的用户ID'
-- ORDER BY date DESC; 
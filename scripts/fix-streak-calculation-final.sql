-- 最终修复连续天数和总打卡天数计算
-- 删除所有旧的函数和触发器
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

-- 创建正确的计算最大连续天数的函数
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

-- 创建计算总成功天数的函数
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

-- 创建计算当前连续天数的函数
CREATE OR REPLACE FUNCTION calculate_current_streak(user_uuid uuid)
RETURNS integer AS $$
DECLARE
    checkin_record RECORD;
    current_streak int := 0;
    prev_date date := NULL;
    date_diff int;
BEGIN
    -- 从最近的日期开始倒序遍历成功打卡记录
    FOR checkin_record IN 
        SELECT date
        FROM daily_checkins 
        WHERE user_id = user_uuid 
        AND status = 'success'
        ORDER BY date DESC
    LOOP
        IF prev_date IS NULL THEN
            -- 第一条记录
            current_streak := 1;
            prev_date := checkin_record.date;
        ELSE
            date_diff := prev_date - checkin_record.date;
            
            -- 检查是否连续（只允许连续的天数）
            IF date_diff = 1 THEN
                current_streak := current_streak + 1;
                prev_date := checkin_record.date;
            ELSE
                -- 不连续，结束计算
                EXIT;
            END IF;
        END IF;
    END LOOP;
    
    RETURN COALESCE(current_streak, 0);
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error calculating current streak for user %: %', user_uuid, SQLERRM;
        RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器函数
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

-- 创建触发器
CREATE TRIGGER update_checkin_stats_trigger
    BEFORE INSERT OR UPDATE ON daily_checkins
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_checkin_stats();

-- 创建批量更新所有用户统计数据的函数
CREATE OR REPLACE FUNCTION refresh_all_user_stats()
RETURNS void AS $$
DECLARE
    user_record RECORD;
    processed_count int := 0;
    error_count int := 0;
BEGIN
    -- 遍历所有有打卡记录的用户
    FOR user_record IN 
        SELECT DISTINCT user_id 
        FROM daily_checkins
        ORDER BY user_id
    LOOP
        BEGIN
            -- 更新用户统计
            UPDATE daily_checkins 
            SET 
                max_streak = calculate_max_streak(user_record.user_id),
                total_days = calculate_total_success_days(user_record.user_id),
                updated_at = NOW()
            WHERE user_id = user_record.user_id;
            
            processed_count := processed_count + 1;
        EXCEPTION
            WHEN OTHERS THEN
                error_count := error_count + 1;
                RAISE LOG 'Error updating stats for user %: %', user_record.user_id, SQLERRM;
        END;
    END LOOP;
    
    RAISE LOG 'Batch update completed: % users processed, % errors', processed_count, error_count;
END;
$$ LANGUAGE plpgsql;

-- 创建获取用户统计的函数
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid uuid)
RETURNS TABLE(
    current_streak int,
    max_streak int,
    total_success_days int,
    total_checkin_days int,
    success_rate numeric
) AS $$
DECLARE
    current_streak_val int;
    max_streak_val int;
    total_success_val int;
    total_checkin_val int;
    success_rate_val numeric;
BEGIN
    -- 计算各项统计
    current_streak_val := calculate_current_streak(user_uuid);
    max_streak_val := calculate_max_streak(user_uuid);
    total_success_val := calculate_total_success_days(user_uuid);
    
    -- 计算总打卡天数
    SELECT COUNT(*) INTO total_checkin_val
    FROM daily_checkins 
    WHERE user_id = user_uuid;
    
    -- 计算成功率
    IF total_checkin_val > 0 THEN
        success_rate_val := ROUND((total_success_val::numeric / total_checkin_val::numeric) * 100, 2);
    ELSE
        success_rate_val := 0;
    END IF;
    
    -- 返回结果
    RETURN QUERY SELECT 
        current_streak_val,
        max_streak_val,
        total_success_val,
        total_checkin_val,
        success_rate_val;
        
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error getting user stats for %: %', user_uuid, SQLERRM;
        RETURN QUERY SELECT 0, 0, 0, 0, 0::numeric;
END;
$$ LANGUAGE plpgsql;

-- 立即更新所有用户的统计数据
SELECT refresh_all_user_stats();

-- 显示更新结果
SELECT 
    user_id,
    MAX(date) as latest_date,
    MAX(max_streak) as max_streak,
    MAX(total_days) as total_days
FROM daily_checkins 
WHERE max_streak IS NOT NULL 
GROUP BY user_id 
ORDER BY MAX(max_streak) DESC 
LIMIT 10; 
-- 修复 max_streak 更新问题
-- 问题：当前触发器只更新 daily_checkins 表的 max_streak，但没有更新 users 表的 max_streak

-- 删除旧的触发器函数
DROP TRIGGER IF EXISTS update_checkin_stats_trigger ON daily_checkins;
DROP FUNCTION IF EXISTS trigger_update_checkin_stats() CASCADE;

-- 创建新的触发器函数，同时更新 users 表
CREATE OR REPLACE FUNCTION trigger_update_checkin_stats()
RETURNS TRIGGER AS $$
DECLARE
    max_streak_val int;
    total_days_val int;
    current_streak_val int;
BEGIN
    -- 计算统计数据
    max_streak_val := calculate_max_streak(NEW.user_id);
    total_days_val := calculate_total_success_days(NEW.user_id);
    current_streak_val := calculate_current_streak(NEW.user_id);
    
    -- 更新当前记录的统计字段
    NEW.max_streak := max_streak_val;
    NEW.total_days := total_days_val;
    NEW.updated_at := NOW();
    
    -- 同时更新 users 表的统计字段
    UPDATE users 
    SET 
        current_streak = current_streak_val,
        max_streak = max_streak_val,
        total_days = total_days_val,
        updated_at = NOW()
    WHERE id = NEW.user_id;
    
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
    max_streak_val int;
    total_days_val int;
    current_streak_val int;
BEGIN
    -- 遍历所有有打卡记录的用户
    FOR user_record IN 
        SELECT DISTINCT user_id 
        FROM daily_checkins
        ORDER BY user_id
    LOOP
        BEGIN
            -- 计算统计数据
            max_streak_val := calculate_max_streak(user_record.user_id);
            total_days_val := calculate_total_success_days(user_record.user_id);
            current_streak_val := calculate_current_streak(user_record.user_id);
            
            -- 更新 users 表
            UPDATE users 
            SET 
                current_streak = current_streak_val,
                max_streak = max_streak_val,
                total_days = total_days_val,
                updated_at = NOW()
            WHERE id = user_record.user_id;
            
            -- 更新 daily_checkins 表的最新记录
            UPDATE daily_checkins 
            SET 
                max_streak = max_streak_val,
                total_days = total_days_val,
                updated_at = NOW()
            WHERE user_id = user_record.user_id
            AND date = (
                SELECT MAX(date) 
                FROM daily_checkins 
                WHERE user_id = user_record.user_id
            );
            
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

-- 立即执行批量更新
SELECT refresh_all_user_stats();

-- 验证更新结果
SELECT 
    u.id,
    u.username,
    u.current_streak,
    u.max_streak,
    u.total_days,
    COUNT(dc.date) as checkin_count
FROM users u
LEFT JOIN daily_checkins dc ON u.id = dc.user_id
WHERE u.id IN (
    SELECT DISTINCT user_id 
    FROM daily_checkins
)
GROUP BY u.id, u.username, u.current_streak, u.max_streak, u.total_days
ORDER BY u.max_streak DESC, u.current_streak DESC
LIMIT 10; 
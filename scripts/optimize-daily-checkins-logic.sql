-- 优化 daily_checkins 表逻辑，基于 relapsed 字段判断打卡成功
-- relapsed 是 JSON 数组，只要没有 true 就视为打卡成功

-- 创建或替换计算连续天数的函数
CREATE OR REPLACE FUNCTION calculate_streak(user_uuid uuid)
RETURNS TABLE(current_streak int, max_streak int, total_days int) AS $$
DECLARE
    checkin_record RECORD;
    current_streak_count int := 0;
    max_streak_count int := 0;
    total_successful_days int := 0;
    prev_date date := NULL;
    date_diff int;
    is_successful boolean;
BEGIN
    -- 遍历用户的所有打卡记录，按日期排序
    FOR checkin_record IN 
        SELECT date, relapsed
        FROM daily_checkins 
        WHERE user_id = user_uuid 
        ORDER BY date ASC
    LOOP
        -- 检查 relapsed 数组中是否包含 true
        is_successful := NOT (checkin_record.relapsed::jsonb ? 'true' OR 
                             checkin_record.relapsed::jsonb @> 'true'::jsonb OR
                             checkin_record.relapsed::text LIKE '%true%');
        
        -- 如果打卡成功
        IF is_successful THEN
            total_successful_days := total_successful_days + 1;
            
            -- 如果是第一次打卡或者与上次打卡连续（允许3天内补打）
            IF prev_date IS NULL THEN
                current_streak_count := 1;
            ELSE
                date_diff := checkin_record.date - prev_date;
                
                -- 连续打卡或在3天内补打
                IF date_diff <= 3 THEN
                    current_streak_count := current_streak_count + 1;
                ELSE
                    -- 超过3天，重新开始计算
                    current_streak_count := 1;
                END IF;
            END IF;
            
            -- 更新最大连续天数
            max_streak_count := GREATEST(max_streak_count, current_streak_count);
            prev_date := checkin_record.date;
        ELSE
            -- 打卡失败，重置连续天数
            current_streak_count := 0;
            prev_date := NULL;
        END IF;
    END LOOP;
    
    -- 返回结果
    RETURN QUERY SELECT current_streak_count, max_streak_count, total_successful_days;
END;
$$ LANGUAGE plpgsql;

-- 创建或替换更新用户统计的函数
CREATE OR REPLACE FUNCTION update_user_stats(user_uuid uuid)
RETURNS void AS $$
DECLARE
    stats_record RECORD;
BEGIN
    -- 获取用户的统计数据
    SELECT * INTO stats_record FROM calculate_streak(user_uuid);
    
    -- 更新用户最新的打卡记录中的统计字段
    UPDATE daily_checkins 
    SET 
        max_streak = stats_record.max_streak,
        total_days = stats_record.total_days,
        updated_at = NOW()
    WHERE user_id = user_uuid 
    AND date = (
        SELECT MAX(date) 
        FROM daily_checkins 
        WHERE user_id = user_uuid
    );
    
    -- 如果没有找到记录进行更新，则插入一条新记录（防御性编程）
    IF NOT FOUND THEN
        -- 这种情况通常不会发生，但作为安全措施
        RAISE NOTICE 'No recent checkin record found for user %', user_uuid;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 创建或替换触发器函数
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

-- 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS update_checkin_stats_trigger ON daily_checkins;

-- 创建新触发器
CREATE TRIGGER update_checkin_stats_trigger
    BEFORE INSERT OR UPDATE ON daily_checkins
    FOR EACH ROW
    EXECUTE FUNCTION update_checkin_stats_trigger();

-- 创建获取用户当前连续天数的函数（用于前端显示）
CREATE OR REPLACE FUNCTION get_user_current_streak(user_uuid uuid)
RETURNS int AS $$
DECLARE
    current_streak_val int;
BEGIN
    SELECT current_streak INTO current_streak_val 
    FROM calculate_streak(user_uuid);
    
    RETURN COALESCE(current_streak_val, 0);
END;
$$ LANGUAGE plpgsql;

-- 创建获取排行榜数据的函数
CREATE OR REPLACE FUNCTION get_leaderboard(limit_count int DEFAULT 10)
RETURNS TABLE(
    user_id uuid,
    max_streak int,
    total_days int,
    rank_position int
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
        ru.rank_pos::int
    FROM ranked_users ru
    ORDER BY ru.rank_pos
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 创建批量更新所有用户统计数据的函数（用于数据迁移或修复）
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

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON daily_checkins(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_max_streak ON daily_checkins(max_streak DESC) WHERE max_streak IS NOT NULL;

-- 执行一次性数据更新，重新计算所有用户的统计数据
SELECT refresh_all_user_stats();

-- 验证函数是否正常工作的测试查询（可选）
-- SELECT * FROM get_leaderboard(5);
-- SELECT get_user_current_streak('your-user-uuid-here');

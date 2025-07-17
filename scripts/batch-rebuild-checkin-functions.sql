-- 批量删除现有函数（忽略不存在的报错）
DROP FUNCTION IF EXISTS calculate_streak(uuid) CASCADE;
DROP FUNCTION IF EXISTS update_user_stats(uuid) CASCADE;
DROP FUNCTION IF EXISTS update_checkin_stats_trigger() CASCADE;
DROP FUNCTION IF EXISTS get_user_current_streak(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_leaderboard(int) CASCADE;
DROP FUNCTION IF EXISTS refresh_all_user_stats() CASCADE;
DROP FUNCTION IF EXISTS calculate_current_streak(uuid) CASCADE;
DROP FUNCTION IF EXISTS calculate_max_streak(uuid) CASCADE;
DROP FUNCTION IF EXISTS calculate_total_success_days(uuid) CASCADE;
DROP FUNCTION IF EXISTS update_user_checkin_stats(uuid) CASCADE;
DROP FUNCTION IF EXISTS trigger_update_checkin_stats() CASCADE;
DROP FUNCTION IF EXISTS get_user_stats(uuid) CASCADE;
DROP FUNCTION IF EXISTS test_relapsed_logic() CASCADE;

-- 删除触发器
DROP TRIGGER IF EXISTS update_checkin_stats_trigger ON daily_checkins;

-- 重建函数：计算当前连续天数
CREATE FUNCTION calculate_current_streak(user_uuid uuid)
RETURNS integer AS $$
DECLARE
    checkin_record RECORD;
    current_streak int := 0;
    prev_date date := NULL;
    date_diff int;
    is_successful boolean;
BEGIN
    -- 从最近的日期开始倒序遍历
    FOR checkin_record IN 
        SELECT date, relapsed
        FROM daily_checkins 
        WHERE user_id = user_uuid 
        ORDER BY date DESC
    LOOP
        -- 检查打卡是否成功（relapsed 为 false 表示成功）
        is_successful := (checkin_record.relapsed = false);
        
        -- 如果打卡失败，直接结束计算
        IF NOT is_successful THEN
            EXIT;
        END IF;
        
        -- 检查日期连续性
        IF prev_date IS NULL THEN
            -- 第一条记录
            current_streak := 1;
            prev_date := checkin_record.date;
        ELSE
            date_diff := prev_date - checkin_record.date;
            
            -- 检查是否连续（允许3天内补打）
            IF date_diff <= 3 THEN
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
        RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- 重建函数：计算最大连续天数
CREATE FUNCTION calculate_max_streak(user_uuid uuid)
RETURNS integer AS $$
DECLARE
    checkin_record RECORD;
    current_streak int := 0;
    max_streak int := 0;
    prev_date date := NULL;
    date_diff int;
    is_successful boolean;
BEGIN
    -- 按日期正序遍历所有记录
    FOR checkin_record IN 
        SELECT date, relapsed
        FROM daily_checkins 
        WHERE user_id = user_uuid 
        ORDER BY date ASC
    LOOP
        -- 检查打卡是否成功（relapsed 为 false 表示成功）
        is_successful := (checkin_record.relapsed = false);
        
        IF is_successful THEN
            -- 打卡成功
            IF prev_date IS NULL THEN
                -- 第一次成功打卡
                current_streak := 1;
            ELSE
                date_diff := checkin_record.date - prev_date;
                
                -- 检查连续性（允许3天内补打）
                IF date_diff <= 3 THEN
                    current_streak := current_streak + 1;
                ELSE
                    -- 不连续，重新开始
                    current_streak := 1;
                END IF;
            END IF;
            
            -- 更新最大连续天数
            max_streak := GREATEST(max_streak, current_streak);
            prev_date := checkin_record.date;
        ELSE
            -- 打卡失败，重置连续天数
            current_streak := 0;
            prev_date := NULL;
        END IF;
    END LOOP;
    
    RETURN COALESCE(max_streak, 0);
EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- 重建函数：计算总成功天数
CREATE FUNCTION calculate_total_success_days(user_uuid uuid)
RETURNS integer AS $$
DECLARE
    total_count int := 0;
BEGIN
    -- 统计所有成功打卡的天数（relapsed = false）
    SELECT COUNT(*) INTO total_count
    FROM daily_checkins 
    WHERE user_id = user_uuid 
    AND relapsed = false;
    
    RETURN COALESCE(total_count, 0);
EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- 重建函数：更新用户统计
CREATE FUNCTION update_user_stats(user_uuid uuid)
RETURNS void AS $$
DECLARE
    max_streak_val int;
    total_days_val int;
    latest_date date;
BEGIN
    -- 获取用户最新打卡日期
    SELECT MAX(date) INTO latest_date
    FROM daily_checkins 
    WHERE user_id = user_uuid;
    
    -- 如果没有打卡记录，直接返回
    IF latest_date IS NULL THEN
        RETURN;
    END IF;
    
    -- 计算各项统计数据
    max_streak_val := calculate_max_streak(user_uuid);
    total_days_val := calculate_total_success_days(user_uuid);
    
    -- 更新最新打卡记录的统计字段
    UPDATE daily_checkins 
    SET 
        max_streak = max_streak_val,
        total_days = total_days_val,
        updated_at = NOW()
    WHERE user_id = user_uuid 
    AND date = latest_date;
        
EXCEPTION
    WHEN OTHERS THEN
        -- 异常处理，静默失败
        NULL;
END;
$$ LANGUAGE plpgsql;

-- 重建函数：触发器函数
CREATE FUNCTION update_checkin_stats_trigger()
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
        -- 异常处理，但不阻止操作
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 重建函数：获取用户当前连续天数
CREATE FUNCTION get_user_current_streak(user_uuid uuid)
RETURNS integer AS $$
BEGIN
    RETURN calculate_current_streak(user_uuid);
EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- 重建函数：获取排行榜
CREATE FUNCTION get_leaderboard(limit_count int DEFAULT 10)
RETURNS TABLE(
    user_id uuid,
    username text,
    max_streak int,
    total_days int,
    current_streak int,
    rank_position bigint
) AS $$
BEGIN
    RETURN QUERY
    WITH user_latest_stats AS (
        -- 获取每个用户最新的统计数据
        SELECT DISTINCT ON (dc.user_id)
            dc.user_id,
            COALESCE(dc.max_streak, 0) as max_streak,
            COALESCE(dc.total_days, 0) as total_days,
            calculate_current_streak(dc.user_id) as current_streak
        FROM daily_checkins dc
        ORDER BY dc.user_id, dc.date DESC
    ),
    ranked_users AS (
        -- 按最大连续天数排序并添加排名
        SELECT 
            uls.user_id,
            COALESCE(u.username, '匿名用户') as username,
            uls.max_streak,
            uls.total_days,
            uls.current_streak,
            ROW_NUMBER() OVER (
                ORDER BY uls.max_streak DESC, 
                         uls.total_days DESC, 
                         uls.current_streak DESC
            ) as rank_pos
        FROM user_latest_stats uls
        LEFT JOIN users u ON u.id = uls.user_id
        WHERE uls.max_streak > 0  -- 只显示有成功打卡记录的用户
    )
    SELECT 
        ru.user_id,
        ru.username,
        ru.max_streak,
        ru.total_days,
        ru.current_streak,
        ru.rank_pos
    FROM ranked_users ru
    ORDER BY ru.rank_pos
    LIMIT limit_count;
EXCEPTION
    WHEN OTHERS THEN
        -- 异常处理，返回空结果
        RETURN;
END;
$$ LANGUAGE plpgsql;

-- 重建函数：批量更新所有用户统计
CREATE FUNCTION refresh_all_user_stats()
RETURNS void AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- 遍历所有有打卡记录的用户
    FOR user_record IN 
        SELECT DISTINCT user_id 
        FROM daily_checkins
        ORDER BY user_id
    LOOP
        BEGIN
            -- 更新用户统计
            PERFORM update_user_stats(user_record.user_id);
        EXCEPTION
            WHEN OTHERS THEN
                -- 忽略单个用户的错误，继续处理下一个
                CONTINUE;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 重建函数：获取用户详细统计
CREATE FUNCTION get_user_stats(user_uuid uuid)
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
        -- 异常处理，返回默认值
        RETURN QUERY SELECT 0, 0, 0, 0, 0::numeric;
END;
$$ LANGUAGE plpgsql;

-- 重建函数：测试逻辑
CREATE FUNCTION test_relapsed_logic()
RETURNS void AS $$
DECLARE
    test_user_id uuid := gen_random_uuid();
    result_record RECORD;
BEGIN
    -- 插入测试数据
    INSERT INTO daily_checkins (user_id, date, relapsed, notes) VALUES
    (test_user_id, '2024-01-01', false, '成功打卡1'),
    (test_user_id, '2024-01-02', false, '成功打卡2'),
    (test_user_id, '2024-01-03', true, '失败打卡'),
    (test_user_id, '2024-01-04', false, '成功打卡3'),
    (test_user_id, '2024-01-05', false, '成功打卡4');
    
    -- 测试统计函数
    SELECT * INTO result_record FROM get_user_stats(test_user_id);
    
    -- 清理测试数据
    DELETE FROM daily_checkins WHERE user_id = test_user_id;
    
    RAISE NOTICE 'Test completed successfully';
END;
$$ LANGUAGE plpgsql;

-- 重新创建触发器
CREATE TRIGGER update_checkin_stats_trigger
    BEFORE INSERT OR UPDATE ON daily_checkins
    FOR EACH ROW
    EXECUTE FUNCTION update_checkin_stats_trigger();

-- 创建必要的索引
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON daily_checkins(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_max_streak ON daily_checkins(max_streak DESC) WHERE max_streak IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_daily_checkins_relapsed ON daily_checkins(relapsed) WHERE relapsed IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_relapsed ON daily_checkins(user_id, relapsed);

-- 完成提示
DO $$
BEGIN
    RAISE NOTICE 'All functions rebuilt successfully!';
    RAISE NOTICE 'Available functions:';
    RAISE NOTICE '- calculate_current_streak(uuid)';
    RAISE NOTICE '- calculate_max_streak(uuid)';
    RAISE NOTICE '- calculate_total_success_days(uuid)';
    RAISE NOTICE '- update_user_stats(uuid)';
    RAISE NOTICE '- get_user_current_streak(uuid)';
    RAISE NOTICE '- get_leaderboard(int)';
    RAISE NOTICE '- refresh_all_user_stats()';
    RAISE NOTICE '- get_user_stats(uuid)';
    RAISE NOTICE '- test_relapsed_logic()';
END $$;

-- 删除 filter_keywords 表
DROP TABLE IF EXISTS filter_keywords;

-- 修改 daily_checkins 表结构
ALTER TABLE daily_checkins 
DROP COLUMN IF EXISTS sleep_hours,
DROP COLUMN IF EXISTS sleep_quality;

-- 添加新字段
ALTER TABLE daily_checkins 
ADD COLUMN IF NOT EXISTS max_streak INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_days INT DEFAULT 0;

-- 创建或替换更新统计数据的函数
CREATE OR REPLACE FUNCTION update_checkin_stats()
RETURNS TRIGGER AS $$
DECLARE
    user_checkins RECORD;
    current_streak INT := 0;
    max_streak_val INT := 0;
    total_days_val INT := 0;
    prev_date DATE;
    streak_count INT := 0;
BEGIN
    -- 计算总打卡天数
    SELECT COUNT(*) INTO total_days_val
    FROM daily_checkins 
    WHERE user_id = NEW.user_id;

    -- 计算最大连续天数
    FOR user_checkins IN 
        SELECT date, relapsed 
        FROM daily_checkins 
        WHERE user_id = NEW.user_id 
        ORDER BY date ASC
    LOOP
        IF NOT user_checkins.relapsed THEN
            IF prev_date IS NULL OR user_checkins.date = prev_date + INTERVAL '1 day' THEN
                streak_count := streak_count + 1;
                max_streak_val := GREATEST(max_streak_val, streak_count);
            ELSE
                streak_count := 1;
                max_streak_val := GREATEST(max_streak_val, streak_count);
            END IF;
            prev_date := user_checkins.date;
        ELSE
            streak_count := 0;
            prev_date := NULL;
        END IF;
    END LOOP;

    -- 更新当前记录的统计数据
    NEW.max_streak := max_streak_val;
    NEW.total_days := total_days_val;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS update_checkin_stats_trigger ON daily_checkins;
CREATE TRIGGER update_checkin_stats_trigger
    BEFORE INSERT OR UPDATE ON daily_checkins
    FOR EACH ROW
    EXECUTE FUNCTION update_checkin_stats();

-- 更新现有记录的统计数据
UPDATE daily_checkins SET updated_at = NOW();

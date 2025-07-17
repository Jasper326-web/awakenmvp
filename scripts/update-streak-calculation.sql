-- 创建或更新函数，用于计算用户的连续守戒天数
CREATE OR REPLACE FUNCTION calculate_streak(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    streak INTEGER := 0;
    current_date DATE := CURRENT_DATE;
    record_date DATE;
    has_record BOOLEAN;
BEGIN
    -- 检查今天是否有成功记录
    SELECT EXISTS(
        SELECT 1 FROM daily_checkins 
        WHERE user_id = calculate_streak.user_id 
        AND date = current_date
        AND status = 'success'
    ) INTO has_record;
    
    -- 如果今天没有成功记录，从昨天开始检查
    IF NOT has_record THEN
        current_date := current_date - INTERVAL '1 day';
    END IF;
    
    -- 开始计算连续天数
    LOOP
        SELECT EXISTS(
            SELECT 1 FROM daily_checkins 
            WHERE user_id = calculate_streak.user_id 
            AND date = current_date
            AND status = 'success'
        ) INTO has_record;
        
        EXIT WHEN NOT has_record;
        
        streak := streak + 1;
        current_date := current_date - INTERVAL '1 day';
    END LOOP;
    
    RETURN streak;
END;
$$ LANGUAGE plpgsql;

-- 创建或更新触发器函数，在打卡记录更新时更新用户的连续天数
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
BEGIN
    -- 如果是失败记录，重置连续天数为0
    IF NEW.status = 'failed' THEN
        UPDATE users SET current_streak = 0 WHERE id = NEW.user_id;
    ELSE
        -- 计算并更新连续天数
        UPDATE users 
        SET current_streak = calculate_streak(NEW.user_id)
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 删除现有触发器（如果存在）
DROP TRIGGER IF EXISTS update_streak_on_checkin ON daily_checkins;

-- 创建新触发器
CREATE TRIGGER update_streak_on_checkin
AFTER INSERT OR UPDATE ON daily_checkins
FOR EACH ROW
EXECUTE FUNCTION update_user_streak();

-- 更新所有用户的连续天数
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id FROM users LOOP
        UPDATE users 
        SET current_streak = calculate_streak(user_record.id)
        WHERE id = user_record.id;
    END LOOP;
END $$;

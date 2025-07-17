-- 创建或更新函数，用于计算用户的连续守戒天数
CREATE OR REPLACE FUNCTION calculate_streak(input_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_streak INTEGER := 0;
    v_check_date DATE := CURRENT_DATE;
    v_has_record BOOLEAN;
BEGIN
    -- 检查今天是否有成功记录
    SELECT EXISTS(
        SELECT 1 FROM daily_checkins dc
        WHERE dc.user_id = input_user_id 
        AND dc.date = v_check_date
        AND dc.status = 'success'
    ) INTO v_has_record;
    
    -- 如果今天没有成功记录，从昨天开始检查
    IF NOT v_has_record THEN
        v_check_date := v_check_date - INTERVAL '1 day';
    END IF;
    
    -- 开始计算连续天数
    LOOP
        SELECT EXISTS(
            SELECT 1 FROM daily_checkins dc
            WHERE dc.user_id = input_user_id 
            AND dc.date = v_check_date
            AND dc.status = 'success'
        ) INTO v_has_record;
        
        EXIT WHEN NOT v_has_record;
        
        v_streak := v_streak + 1;
        v_check_date := v_check_date - INTERVAL '1 day';
    END LOOP;
    
    RETURN v_streak;
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
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM users LOOP
        UPDATE users 
        SET current_streak = calculate_streak(r.id)
        WHERE id = r.id;
    END LOOP;
END $$;

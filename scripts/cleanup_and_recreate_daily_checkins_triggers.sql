-- 脚本开始：清理并重新创建 daily_checkins 表的相关触发器和函数

-- 步骤 1 & 2: 删除 daily_checkins 上的连胜计算相关触发器
DROP TRIGGER IF EXISTS update_streak_on_checkin ON daily_checkins;
DROP TRIGGER IF EXISTS update_user_streak_trigger ON daily_checkins;

-- 步骤 3 & 4: 删除 daily_checkins 上的成就系统相关触发器
DROP TRIGGER IF EXISTS check_log_achievements_trigger ON daily_checkins;
DROP TRIGGER IF EXISTS check_special_achievements_trigger ON daily_checkins;

-- 步骤 5 & 6: 删除连胜计算相关函数 (使用 CASCADE 以处理依赖)
DROP FUNCTION IF EXISTS update_user_streak() CASCADE;
DROP FUNCTION IF EXISTS calculate_streak(uuid) CASCADE;

-- 步骤 7 & 8: 删除成就系统相关函数 (使用 CASCADE 以处理依赖)
DROP FUNCTION IF EXISTS check_log_achievements() CASCADE;
DROP FUNCTION IF EXISTS check_special_achievements() CASCADE;

-- 步骤 X: 删除 daily_checkins 上的用户统计相关触发器和函数
DROP TRIGGER IF EXISTS update_stats_on_checkin ON daily_checkins;
DROP FUNCTION IF EXISTS trigger_update_user_stats() CASCADE;
DROP FUNCTION IF EXISTS update_user_stats(uuid) CASCADE; -- 也删除这个，因为它依赖 calculate_streak


-- 步骤 9: 重新创建 calculate_streak 函数 (来自 update-streak-calculation-fixed5.sql)
CREATE FUNCTION calculate_streak(input_user_id UUID)
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

-- 步骤 10: 重新创建 update_user_streak 函数 (来自 update-streak-calculation-fixed5.sql)
CREATE FUNCTION update_user_streak()
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

-- 步骤 11: 重新创建 update_streak_on_checkin 触发器 (来自 update-streak-calculation-fixed5.sql)
CREATE TRIGGER update_streak_on_checkin
AFTER INSERT OR UPDATE ON daily_checkins
FOR EACH ROW
EXECUTE FUNCTION update_user_streak();

-- 步骤 12: 重新创建 check_log_achievements 函数 (来自 create-achievements-system.sql)
CREATE OR REPLACE FUNCTION check_log_achievements()
RETURNS TRIGGER AS $$
DECLARE
    log_count INTEGER;
    achievement_id UUID;
BEGIN
    -- 检查是否是用户的第一篇日志
    SELECT COUNT(*) INTO log_count FROM daily_checkins 
    WHERE user_id = NEW.user_id AND notes IS NOT NULL AND notes != '';
    
    IF log_count = 1 THEN
        SELECT id INTO achievement_id FROM achievements WHERE name = '反思者' AND is_active = TRUE;
        IF achievement_id IS NOT NULL THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            VALUES (NEW.user_id, achievement_id)
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 步骤 13: 重新创建 check_log_achievements_trigger 触发器 (来自 create-achievements-system.sql)
CREATE TRIGGER check_log_achievements_trigger
AFTER INSERT OR UPDATE OF notes ON daily_checkins
FOR EACH ROW
WHEN (NEW.notes IS NOT NULL AND NEW.notes != '')
EXECUTE FUNCTION check_log_achievements();

-- 步骤 14: 重新创建 check_special_achievements 函数 (来自 create-achievements-system.sql)
CREATE OR REPLACE FUNCTION check_special_achievements()
RETURNS TRIGGER AS $$
DECLARE
    early_checkins INTEGER;
    perfect_days INTEGER;
    achievement_id UUID;
BEGIN
    -- 检查早起打卡成就
    SELECT COUNT(*) INTO early_checkins
    FROM daily_checkins
    WHERE user_id = NEW.user_id
      AND EXTRACT(HOUR FROM created_at) < 8 -- 假设 created_at 是打卡时间
      AND date >= CURRENT_DATE - INTERVAL '6 days'; -- 包含今天的过去7天
      
    IF early_checkins >= 7 THEN
        SELECT id INTO achievement_id FROM achievements WHERE name = '早起打卡' AND is_active = TRUE;
        IF achievement_id IS NOT NULL THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            VALUES (NEW.user_id, achievement_id)
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
        END IF;
    END IF;
    
    -- 检查全勤奖成就 (假设 daily_plan_progress 表存在且结构如 create-achievements-system.sql 所示)
    -- 注意: 如果 daily_plan_progress 表不存在或结构不同，此部分可能需要调整或移除
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_plan_progress') THEN
        WITH daily_tasks AS (
            SELECT 
                date,
                COUNT(*) AS completed_tasks, -- 应该是总任务数
                COUNT(*) FILTER (WHERE completed = TRUE) AS completed_count -- 应该是已完成任务数
            FROM daily_plan_progress
            WHERE user_id = NEW.user_id
              AND date >= CURRENT_DATE - INTERVAL '29 days' -- 包含今天的过去30天
            GROUP BY date
        )
        SELECT COUNT(*) INTO perfect_days
        FROM daily_tasks
        WHERE completed_tasks = completed_count AND completed_tasks > 0; 
        
        IF perfect_days >= 30 THEN
            SELECT id INTO achievement_id FROM achievements WHERE name = '全勤奖' AND is_active = TRUE;
            IF achievement_id IS NOT NULL THEN
                INSERT INTO user_achievements (user_id, achievement_id)
                VALUES (NEW.user_id, achievement_id)
                ON CONFLICT (user_id, achievement_id) DO NOTHING;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 步骤 15: 重新创建 check_special_achievements_trigger 触发器 (来自 create-achievements-system.sql)
CREATE TRIGGER check_special_achievements_trigger
AFTER INSERT OR UPDATE ON daily_checkins
FOR EACH ROW
EXECUTE FUNCTION check_special_achievements();

-- 步骤 16: 重新创建 update_user_stats 函数 (来自 03-create-basic-functions.sql)
-- 注意: calculate_streak 函数已在本脚本前面重新创建
CREATE OR REPLACE FUNCTION update_user_stats(p_user_id UUID)
RETURNS void AS $$
DECLARE
  new_streak INTEGER;
  new_total INTEGER;
  new_level INTEGER;
BEGIN
  -- 计算新的连续天数
  new_streak := calculate_streak(p_user_id);
  
  -- 计算总天数（所有未破戒的打卡天数）
  -- 注意: daily_checkins 表的 'relapsed' 字段用于判断是否破戒
  SELECT COUNT(*) INTO new_total
  FROM daily_checkins 
  WHERE daily_checkins.user_id = p_user_id 
  AND daily_checkins.relapsed = false; -- 确保使用正确的字段
  
  -- 计算等级（基于总天数）
  new_level := CASE 
    WHEN new_total >= 365 THEN 15  -- 一年
    WHEN new_total >= 300 THEN 14  -- 10个月
    WHEN new_total >= 270 THEN 13  -- 9个月
    WHEN new_total >= 240 THEN 12  -- 8个月
    WHEN new_total >= 210 THEN 11  -- 7个月
    WHEN new_total >= 180 THEN 10  -- 6个月
    WHEN new_total >= 150 THEN 9   -- 5个月
    WHEN new_total >= 120 THEN 8   -- 4个月
    WHEN new_total >= 90 THEN 7    -- 3个月
    WHEN new_total >= 60 THEN 6    -- 2个月
    WHEN new_total >= 30 THEN 5    -- 1个月
    WHEN new_total >= 21 THEN 4    -- 3周
    WHEN new_total >= 14 THEN 3    -- 2周
    WHEN new_total >= 7 THEN 2     -- 1周
    ELSE 1
  END;
  
  -- 更新用户表
  UPDATE users 
  SET 
    current_streak = new_streak,
    total_days = new_total,
    level = new_level,
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- 步骤 17: 重新创建 trigger_update_user_stats 函数 (来自 05-create-triggers.sql)
CREATE OR REPLACE FUNCTION trigger_update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_user_stats(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 步骤 18: 重新创建 update_stats_on_checkin 触发器 (来自 05-create-triggers.sql)
CREATE TRIGGER update_stats_on_checkin
  AFTER INSERT OR UPDATE ON daily_checkins
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_user_stats();

-- 脚本结束
SELECT 'Cleanup and recreation of daily_checkins triggers and functions completed.' as status;

-- 提示: ���执行此脚本后，建议手动更新一次所有用户的连续天数，以确保数据一致性。
-- 例如，可以运行 update-streak-calculation-fixed5.sql 末尾的 DO $$ ... $$块。 
-- DO $$
-- DECLARE
--     r RECORD;
-- BEGIN
--     FOR r IN SELECT id FROM users LOOP
--         UPDATE users 
--         SET current_streak = calculate_streak(r.id)
--         WHERE id = r.id;
--     END LOOP;
-- END $$;

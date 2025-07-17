-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建计算连续天数的函数
CREATE OR REPLACE FUNCTION calculate_streak(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  streak_count INTEGER := 0;
  current_date DATE := CURRENT_DATE;
  check_date DATE;
BEGIN
  -- 从今天开始往前检查
  check_date := current_date;
  
  LOOP
    -- 检查这一天是否有打卡且没有破戒
    IF EXISTS (
      SELECT 1 FROM daily_checkins 
      WHERE daily_checkins.user_id = calculate_streak.user_id 
      AND date = check_date 
      AND relapsed = false
    ) THEN
      streak_count := streak_count + 1;
      check_date := check_date - INTERVAL '1 day';
    ELSE
      EXIT;
    END IF;
  END LOOP;
  
  RETURN streak_count;
END;
$$ LANGUAGE plpgsql;

-- 创建更新用户统计数据的函数
CREATE OR REPLACE FUNCTION update_user_stats(user_id UUID)
RETURNS void AS $$
DECLARE
  new_streak INTEGER;
  new_total INTEGER;
  new_level INTEGER;
BEGIN
  -- 计算新的连续天数
  new_streak := calculate_streak(user_id);
  
  -- 计算总天数（所有未破戒的打卡天数）
  SELECT COUNT(*) INTO new_total
  FROM daily_checkins 
  WHERE daily_checkins.user_id = update_user_stats.user_id 
  AND relapsed = false;
  
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
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- 创建增加点赞数的函数
CREATE OR REPLACE FUNCTION increment_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE community_posts 
  SET likes_count = likes_count + 1 
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- 创建减少点赞数的函数
CREATE OR REPLACE FUNCTION decrement_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE community_posts 
  SET likes_count = GREATEST(likes_count - 1, 0)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

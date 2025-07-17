-- 检查成就表是否存在
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'achievements') THEN
    -- 创建成就表
    CREATE TABLE achievements (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      achievement_type VARCHAR(50) NOT NULL,
      icon_url TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- 创建用户成就表
    CREATE TABLE IF NOT EXISTS user_achievements (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
      unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      is_displayed BOOLEAN DEFAULT TRUE,
      UNIQUE(user_id, achievement_id)
    );
  END IF;
END
$$;

-- 插入基础成就数据
INSERT INTO achievements (name, description, achievement_type)
VALUES 
  ('戒色菜鸟', '连续守戒3天', 'streak')
ON CONFLICT (id) DO NOTHING;

-- 创建触发器函数，当用户连续天数达到要求时自动解锁成就
CREATE OR REPLACE FUNCTION check_streak_achievements()
RETURNS TRIGGER AS $$
DECLARE
  rookie_achievement_id UUID;
BEGIN
  -- 获取"戒色菜鸟"成就ID
  SELECT id INTO rookie_achievement_id FROM achievements WHERE name = '戒色菜鸟';
  
  -- 检查连续3天成就
  IF NEW.current_streak >= 3 AND rookie_achievement_id IS NOT NULL THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    VALUES (NEW.id, rookie_achievement_id)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 删除现有触发器（如果存在）
DROP TRIGGER IF EXISTS check_user_streak_achievements ON users;

-- 创建触发器
CREATE TRIGGER check_user_streak_achievements
AFTER UPDATE OF current_streak ON users
FOR EACH ROW
WHEN (NEW.current_streak > OLD.current_streak)
EXECUTE FUNCTION check_streak_achievements();

-- 手动检查并解锁所有符合条件的用户成就
DO $$
DECLARE
  rookie_achievement_id UUID;
BEGIN
  -- 获取"戒色菜鸟"成就ID
  SELECT id INTO rookie_achievement_id FROM achievements WHERE name = '戒色菜鸟';
  
  IF rookie_achievement_id IS NOT NULL THEN
    -- 为所有符合条件的用户解锁成就
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT 
      u.id, 
      rookie_achievement_id
    FROM 
      users u
    WHERE 
      u.current_streak >= 3
      AND NOT EXISTS (
        SELECT 1 FROM user_achievements ua 
        WHERE ua.user_id = u.id AND ua.achievement_id = rookie_achievement_id
      )
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
  END IF;
END
$$;

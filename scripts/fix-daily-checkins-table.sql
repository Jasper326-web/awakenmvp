-- 首先检查当前表结构
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'daily_checkins' 
ORDER BY ordinal_position;

-- 删除现有的 daily_checkins 表（如果存在）
DROP TABLE IF EXISTS daily_checkins CASCADE;

-- 重新创建 daily_checkins 表，使其结构与 01-create-base-tables.sql 中的定义一致
CREATE TABLE daily_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mood TEXT NOT NULL CHECK (mood IN ('excellent', 'good', 'okay', 'bad', 'terrible')),
  had_urges TEXT NOT NULL CHECK (had_urges IN ('none', 'mild', 'moderate', 'strong', 'overwhelming')),
  relapsed BOOLEAN DEFAULT FALSE,
  exercised BOOLEAN DEFAULT FALSE,
  had_brain_fog TEXT NOT NULL CHECK (had_brain_fog IN ('none', 'mild', 'moderate', 'severe')),
  sleep_hours DECIMAL(3,1) NOT NULL CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
  sleep_quality TEXT NOT NULL CHECK (sleep_quality IN ('excellent', 'good', 'okay', 'poor', 'terrible')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 创建索引以提高查询性能
CREATE INDEX idx_daily_checkins_user_id ON daily_checkins(user_id);
CREATE INDEX idx_daily_checkins_date ON daily_checkins(date);
CREATE INDEX idx_daily_checkins_user_date ON daily_checkins(user_id, date);

-- 启用 RLS
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "Users can view own checkins" ON daily_checkins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkins" ON daily_checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkins" ON daily_checkins
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own checkins" ON daily_checkins
  FOR DELETE USING (auth.uid() = user_id);

-- 插入一些测试用户数据 (确保 daily_checkins 的 user_id 有效)
INSERT INTO users (id, email, username) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'testuser1@example.com', 'testuser1'),
  ('550e8400-e29b-41d4-a716-446655440002', 'testuser2@example.com', 'testuser2')
ON CONFLICT (id) DO NOTHING;

-- 插入一些测试数据
-- 注意: 由于 daily_checkins 表结构已更新，移除了 completed_plan 字段，因此测试数据中不再包含该字段。
-- 如果需要 completed_plan 功能，请考虑将其添加回表结构，或调整相关逻辑。
INSERT INTO daily_checkins (user_id, date, mood, had_urges, relapsed, exercised, had_brain_fog, sleep_hours, sleep_quality, notes) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE - INTERVAL '1 day', 'good', 'none', false, true, 'none', 7.5, 'good', '昨天状态不错'),
  ('550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE - INTERVAL '2 days', 'excellent', 'none', false, true, 'none', 8.0, 'excellent', '坚持锻炼'),
  ('550e8400-e29b-41d4-a716-446655440002', CURRENT_DATE - INTERVAL '1 day', 'okay', 'mild', false, false, 'mild', 6.0, 'okay', '今天有点困难')
ON CONFLICT (user_id, date) DO NOTHING;

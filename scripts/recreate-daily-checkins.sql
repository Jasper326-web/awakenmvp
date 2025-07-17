-- 完全删除并重新创建 daily_checkins 表
DROP TABLE IF EXISTS daily_checkins CASCADE;

-- 重新创建表，确保字段名称正确
CREATE TABLE daily_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  relapsed BOOLEAN DEFAULT FALSE NOT NULL,
  completed_plan BOOLEAN DEFAULT FALSE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT daily_checkins_user_date_unique UNIQUE (user_id, date)
);

-- 添加外键约束（但先不关联到 users 表，避免约束问题）
-- ALTER TABLE daily_checkins ADD CONSTRAINT daily_checkins_user_id_fkey 
-- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 创建索引
CREATE INDEX idx_daily_checkins_user_id ON daily_checkins(user_id);
CREATE INDEX idx_daily_checkins_date ON daily_checkins(date);
CREATE INDEX idx_daily_checkins_user_date ON daily_checkins(user_id, date);

-- 启用 RLS
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略（允许所有操作，暂时简化权限）
CREATE POLICY "Allow all operations on daily_checkins" ON daily_checkins
  FOR ALL USING (true) WITH CHECK (true);

-- 验证表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'daily_checkins' 
ORDER BY ordinal_position;

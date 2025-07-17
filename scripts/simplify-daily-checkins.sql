-- 首先检查当前表结构
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'daily_checkins' 
ORDER BY ordinal_position;

-- 删除现有的 daily_checkins 表（如果存在）
DROP TABLE IF EXISTS daily_checkins CASCADE;

-- 重新创建 daily_checkins 表，只保留必要字段
CREATE TABLE daily_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  -- 以下字段设为可空或提供默认值
  relapsed BOOLEAN DEFAULT FALSE,
  sleep_hours DECIMAL(3,1) DEFAULT 8.0,
  sleep_quality TEXT DEFAULT 'okay',
  notes TEXT,
  video_url TEXT, -- 存储视频URL，用于快速判断是否有视频记录，可空
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 添加字段注释
COMMENT ON COLUMN daily_checkins.video_url IS '视频URL引用，用于前端快速判断是否存在视频记录，详细视频元数据存储在video_records表中';

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

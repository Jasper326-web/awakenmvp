-- 更新每日打卡表结构
ALTER TABLE daily_checkins 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS journal_content TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS has_journal BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_video BOOLEAN DEFAULT FALSE;

-- 添加状态约束
ALTER TABLE daily_checkins 
ADD CONSTRAINT check_status 
CHECK (status IN ('pending', 'success', 'failed'));

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_daily_checkins_date ON daily_checkins(date);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON daily_checkins(user_id, date);

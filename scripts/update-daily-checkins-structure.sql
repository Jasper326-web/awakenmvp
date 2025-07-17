-- 确保 daily_checkins 表有正确的字段结构
ALTER TABLE daily_checkins 
ADD COLUMN IF NOT EXISTS relapsed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 如果之前有 status 字段，可以基于它设置 relapsed 字段
UPDATE daily_checkins 
SET relapsed = CASE 
    WHEN status = 'failed' THEN TRUE 
    ELSE FALSE 
END
WHERE relapsed IS NULL;

-- 添加索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date_relapsed 
ON daily_checkins(user_id, date, relapsed);

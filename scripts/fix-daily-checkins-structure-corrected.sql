-- 修复 daily_checkins 表结构（移除对不存在status字段的引用）
ALTER TABLE daily_checkins 
ADD COLUMN IF NOT EXISTS relapsed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 设置默认值（不依赖不存在的status字段）
UPDATE daily_checkins 
SET relapsed = FALSE
WHERE relapsed IS NULL;

-- 添加索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date_relapsed 
ON daily_checkins(user_id, date, relapsed);

-- 确保表有正确的字段
DO $$
BEGIN
    -- 检查并添加 created_at 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_checkins' AND column_name = 'created_at') THEN
        ALTER TABLE daily_checkins ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- 检查并添加 updated_at 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_checkins' AND column_name = 'updated_at') THEN
        ALTER TABLE daily_checkins ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

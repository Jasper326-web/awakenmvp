-- 更新每日打卡表，添加视频录制支持
ALTER TABLE daily_checkins 
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS video_filename TEXT,
ADD COLUMN IF NOT EXISTS video_size BIGINT,
ADD COLUMN IF NOT EXISTS video_duration INTEGER, -- 视频时长（秒）
ADD COLUMN IF NOT EXISTS video_format VARCHAR(10), -- 视频格式 (mp4, webm, etc.)
ADD COLUMN IF NOT EXISTS has_video BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS video_uploaded_at TIMESTAMP WITH TIME ZONE;

-- 创建视频记录表（可选，用于更详细的视频管理）
CREATE TABLE IF NOT EXISTS video_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    checkin_id UUID REFERENCES daily_checkins(id) ON DELETE CASCADE,
    video_url TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_size BIGINT,
    duration INTEGER, -- 视频时长（秒）
    format VARCHAR(10), -- 视频格式
    thumbnail_url TEXT, -- 视频缩略图
    upload_status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加约束
ALTER TABLE video_records 
ADD CONSTRAINT check_upload_status 
CHECK (upload_status IN ('pending', 'completed', 'failed'));

ALTER TABLE video_records 
ADD CONSTRAINT check_video_format 
CHECK (format IN ('mp4', 'webm', 'mov', 'avi', 'mkv'));

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_daily_checkins_has_video ON daily_checkins(has_video);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_video_date ON daily_checkins(date) WHERE has_video = true;
CREATE INDEX IF NOT EXISTS idx_video_records_user_id ON video_records(user_id);
CREATE INDEX IF NOT EXISTS idx_video_records_checkin_id ON video_records(checkin_id);
CREATE INDEX IF NOT EXISTS idx_video_records_created_at ON video_records(created_at);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_video_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_video_records_updated_at
    BEFORE UPDATE ON video_records
    FOR EACH ROW
    EXECUTE FUNCTION update_video_records_updated_at();

-- 创建RLS策略
ALTER TABLE video_records ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的视频记录
CREATE POLICY "Users can view own video records" ON video_records
    FOR SELECT USING (auth.uid() = user_id);

-- 用户只能插入自己的视频记录
CREATE POLICY "Users can insert own video records" ON video_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的视频记录
CREATE POLICY "Users can update own video records" ON video_records
    FOR UPDATE USING (auth.uid() = user_id);

-- 用户只能删除自己的视频记录
CREATE POLICY "Users can delete own video records" ON video_records
    FOR DELETE USING (auth.uid() = user_id);

-- 创建视频统计视图
CREATE OR REPLACE VIEW user_video_stats AS
SELECT 
    user_id,
    COUNT(*) as total_videos,
    SUM(file_size) as total_size,
    SUM(duration) as total_duration,
    COUNT(CASE WHEN upload_status = 'completed' THEN 1 END) as completed_videos,
    COUNT(CASE WHEN upload_status = 'failed' THEN 1 END) as failed_videos,
    MAX(created_at) as last_video_date
FROM video_records
GROUP BY user_id;

-- 创建获取用户视频记录的函数
CREATE OR REPLACE FUNCTION get_user_video_records(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    checkin_date DATE,
    video_url TEXT,
    filename TEXT,
    file_size BIGINT,
    duration INTEGER,
    format VARCHAR(10),
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vr.id,
        dc.date as checkin_date,
        vr.video_url,
        vr.filename,
        vr.file_size,
        vr.duration,
        vr.format,
        vr.thumbnail_url,
        vr.created_at
    FROM video_records vr
    LEFT JOIN daily_checkins dc ON vr.checkin_id = dc.id
    WHERE vr.user_id = p_user_id 
    AND vr.upload_status = 'completed'
    ORDER BY vr.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建清理过期失败上传的函数
CREATE OR REPLACE FUNCTION cleanup_failed_video_uploads()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- 删除7天前失败的上传记录
    DELETE FROM video_records 
    WHERE upload_status = 'failed' 
    AND created_at < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 添加一些示例数据（可选）
-- INSERT INTO video_records (user_id, video_url, filename, file_size, duration, format, upload_status)
-- VALUES 
-- (auth.uid(), 'https://example.com/video1.mp4', 'checkin_video_1.mp4', 1024000, 30, 'mp4', 'completed'),
-- (auth.uid(), 'https://example.com/video2.mp4', 'checkin_video_2.mp4', 2048000, 45, 'mp4', 'completed');

-- 创建存储桶（如果使用Supabase Storage）
-- 注意：这个需要在Supabase控制台中手动创建，或者使用管理员权限
-- INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', false);

-- 创建存储策略（如果使用Supabase Storage）
-- CREATE POLICY "Users can upload own videos" ON storage.objects
--     FOR INSERT WITH CHECK (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can view own videos" ON storage.objects
--     FOR SELECT USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

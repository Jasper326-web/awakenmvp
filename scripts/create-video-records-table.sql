-- 创建视频记录表
CREATE TABLE IF NOT EXISTS video_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    date DATE NOT NULL,
    video_url TEXT NOT NULL,
    file_name TEXT,
    file_size BIGINT,
    duration INTEGER, -- 视频时长（秒）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 确保每个用户每天只能有一个视频记录
    UNIQUE(user_id, date)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_video_records_user_date ON video_records(user_id, date);
CREATE INDEX IF NOT EXISTS idx_video_records_created_at ON video_records(created_at);

-- 启用RLS
ALTER TABLE video_records ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Users can view their own video records" ON video_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own video records" ON video_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own video records" ON video_records
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own video records" ON video_records
    FOR DELETE USING (auth.uid() = user_id);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_video_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_video_records_updated_at
    BEFORE UPDATE ON video_records
    FOR EACH ROW
    EXECUTE FUNCTION update_video_records_updated_at();

-- 添加注释
COMMENT ON TABLE video_records IS '用户视频记录表';
COMMENT ON COLUMN video_records.user_id IS '用户ID';
COMMENT ON COLUMN video_records.date IS '录制日期';
COMMENT ON COLUMN video_records.video_url IS '视频URL';
COMMENT ON COLUMN video_records.file_name IS '文件名';
COMMENT ON COLUMN video_records.file_size IS '文件大小（字节）';
COMMENT ON COLUMN video_records.duration IS '视频时长（秒）';

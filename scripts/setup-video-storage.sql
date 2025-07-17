-- 创建视频存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true,
  52428800, -- 50MB
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']::text[];

-- 设置存储桶的RLS策略
-- 允许所有用户读取视频
CREATE POLICY "Videos are publicly accessible" 
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'videos');

-- 允许所有已认证用户上传视频
CREATE POLICY "Authenticated users can upload videos" 
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');

-- 允许用户更新和删除自己的视频
CREATE POLICY "Users can update their own videos" 
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own videos" 
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 确保daily_checkins表有video_url字段
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'daily_checkins' 
    AND column_name = 'video_url'
  ) THEN
    ALTER TABLE public.daily_checkins ADD COLUMN video_url TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'daily_checkins' 
    AND column_name = 'has_video'
  ) THEN
    ALTER TABLE public.daily_checkins ADD COLUMN has_video BOOLEAN DEFAULT false;
  END IF;
END
$$;

-- 简化的视频存储桶创建脚本
-- 在Supabase Dashboard的SQL编辑器中运行

-- 1. 创建存储桶（如果不存在）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos', 
  true,
  52428800, -- 50MB
  ARRAY['video/mp4', 'video/webm', 'video/mov', 'video/avi']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. 删除现有的RLS策略（如果存在）
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own files" ON storage.objects;

-- 3. 创建新的RLS策略
CREATE POLICY "Allow public uploads on videos bucket" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'videos');

CREATE POLICY "Allow public access to videos bucket" ON storage.objects
FOR SELECT USING (bucket_id = 'videos');

CREATE POLICY "Allow public delete on videos bucket" ON storage.objects
FOR DELETE USING (bucket_id = 'videos');

CREATE POLICY "Allow public update on videos bucket" ON storage.objects
FOR UPDATE USING (bucket_id = 'videos');

-- 4. 确保RLS已启用
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

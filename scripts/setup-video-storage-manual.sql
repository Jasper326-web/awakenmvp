-- 手动创建视频存储桶和策略
-- 请在Supabase Dashboard的SQL编辑器中运行此脚本

-- 1. 创建videos存储桶（如果不存在）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true,
  104857600, -- 100MB = 100 * 1024 * 1024 bytes
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/mov']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/mov']::text[];

-- 2. 删除可能存在的旧策略
DROP POLICY IF EXISTS "Videos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own files" ON storage.objects;

-- 3. 创建新的存储策略
-- 允许所有人读取视频（公开访问）
CREATE POLICY "Public video access" 
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'videos');

-- 允许所有人上传视频（简化权限，生产环境建议限制为已认证用户）
CREATE POLICY "Public video upload" 
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'videos');

-- 允许用户更新自己的视频
CREATE POLICY "Users can update own videos" 
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'videos');

-- 允许用户删除自己的视频
CREATE POLICY "Users can delete own videos" 
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'videos');

-- 4. 验证设置
SELECT 
  id, 
  name, 
  public, 
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'videos';

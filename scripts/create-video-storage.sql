-- 创建视频存储桶的SQL脚本
-- 注意：这个脚本需要在Supabase Dashboard中的SQL编辑器中运行

-- 插入存储桶配置
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos', 
  true,
  52428800, -- 50MB
  ARRAY['video/mp4', 'video/webm', 'video/mov', 'video/avi', 'video/quicktime']
) ON CONFLICT (id) DO NOTHING;

-- 设置存储桶的RLS策略
-- 允许所有用户上传文件
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'videos');

-- 允许所有用户查看文件
CREATE POLICY "Allow public access" ON storage.objects
FOR SELECT USING (bucket_id = 'videos');

-- 允许用户删除自己的文件
CREATE POLICY "Allow users to delete own files" ON storage.objects
FOR DELETE USING (bucket_id = 'videos');

-- 允许用户更新自己的文件
CREATE POLICY "Allow users to update own files" ON storage.objects
FOR UPDATE USING (bucket_id = 'videos');

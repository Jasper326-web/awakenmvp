-- 创建社区图片存储桶的 RLS 策略
-- 允许认证用户上传图片到 community-images 存储桶

-- 1. 创建存储桶（如果不存在）
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-images', 'community-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 设置存储桶的 RLS 策略
-- 允许认证用户上传图片
CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'community-images');

-- 允许所有用户查看图片
CREATE POLICY "Allow public to view images" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'community-images');

-- 允许用户删除自己上传的图片
CREATE POLICY "Allow users to delete their own images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'community-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 允许用户更新自己上传的图片
CREATE POLICY "Allow users to update their own images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'community-images' AND auth.uid()::text = (storage.foldername(name))[1]); 
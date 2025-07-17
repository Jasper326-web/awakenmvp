-- 设置avatars存储桶的RLS策略
-- 此脚本为avatars存储桶配置正确的权限策略

-- 1. 确保avatars存储桶存在
-- 注意：存储桶创建需要在Supabase Dashboard中手动完成，或通过API创建

-- 2. 启用RLS（如果尚未启用）
-- 注意：存储桶的RLS在Supabase中默认是启用的

-- 3. 删除现有的存储策略（如果存在）
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;

-- 4. 创建上传策略：用户只能上传自己的头像
CREATE POLICY "Users can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. 创建更新策略：用户只能更新自己的头像
CREATE POLICY "Users can update own avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 6. 创建删除策略：用户只能删除自己的头像
CREATE POLICY "Users can delete own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 7. 创建查看策略：所有人都可以查看头像（公开访问）
CREATE POLICY "Public can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- 8. 验证策略是否创建成功
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%avatar%';

-- 9. 显示验证结果
SELECT 'Avatar storage policies created successfully' as status; 
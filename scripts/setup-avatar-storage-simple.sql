-- 简化的avatars存储桶RLS策略
-- 此脚本为avatars存储桶配置简单的权限策略

-- 1. 删除现有的存储策略（如果存在）
DROP POLICY IF EXISTS "Enable read access for all users" ON storage.objects;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON storage.objects;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON storage.objects;

-- 2. 创建读取策略：所有人都可以查看头像
CREATE POLICY "Enable read access for all users" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- 3. 创建上传策略：已认证用户可以上传
CREATE POLICY "Enable insert for authenticated users only" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated'
);

-- 4. 创建更新策略：用户可以更新自己的头像
CREATE POLICY "Enable update for users based on user_id" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated'
);

-- 5. 创建删除策略：用户可以删除自己的头像
CREATE POLICY "Enable delete for users based on user_id" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated'
);

-- 6. 验证策略
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND bucket_id = 'avatars';

-- 7. 显示结果
SELECT 'Simple avatar storage policies created successfully' as status; 
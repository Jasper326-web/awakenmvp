-- 检查avatars存储桶是否存在，如果不存在则创建
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'avatars'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('avatars', 'avatars', true);
  END IF;
END $$;

-- 删除可能存在的旧策略以避免冲突
DROP POLICY IF EXISTS "Avatar Upload" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Download" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Delete" ON storage.objects;

-- 创建上传策略 - 允许认证用户上传自己的头像
CREATE POLICY "Avatar Upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = SPLIT_PART(name, '/', 1)
);

-- 创建下载策略 - 允许所有人查看头像
CREATE POLICY "Avatar Download"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- 创建删除策略 - 允许用户删除自己的头像
CREATE POLICY "Avatar Delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = SPLIT_PART(name, '/', 1)
);

-- 创建更新策略 - 允许用户更新自己的头像
CREATE POLICY "Avatar Update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = SPLIT_PART(name, '/', 1)
);

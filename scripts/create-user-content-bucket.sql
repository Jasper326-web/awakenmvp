-- 检查是否存在user-content存储桶
SELECT EXISTS (
  SELECT 1 FROM storage.buckets WHERE name = 'user-content'
) AS bucket_exists;

-- 注意：在PostgreSQL中，注释使用双连字符(--)而不是井号(#)
-- 创建存储桶需要通过Supabase API或管理界面完成，无法通过标准SQL语句创建

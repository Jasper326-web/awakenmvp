-- 验证表结构是否正确
SELECT 'daily_checkins' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'daily_checkins' 
UNION ALL
SELECT 'user_task_progress' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_task_progress'
ORDER BY table_name, column_name;

-- 检查索引是否创建成功
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE tablename IN ('daily_checkins', 'user_task_progress')
ORDER BY tablename, indexname;

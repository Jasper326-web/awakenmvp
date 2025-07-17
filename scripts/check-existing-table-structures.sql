-- 检查现有表结构
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'daily_checkins' 
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_task_progress' 
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'daily_plan_tasks' 
ORDER BY ordinal_position;

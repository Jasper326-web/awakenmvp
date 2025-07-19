-- 检查 user_task_progress 表的结构和数据
-- 查看表结构
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_task_progress'
ORDER BY ordinal_position;

-- 查看今日的任务完成数据
SELECT 
    user_id,
    task_id,
    date,
    completed,
    completed_at,
    created_at,
    updated_at
FROM user_task_progress 
WHERE date = CURRENT_DATE
ORDER BY created_at DESC;

-- 查看特定用户今日的任务完成情况
-- 请将 'your-user-id' 替换为实际的用户ID
SELECT 
    task_id,
    completed,
    completed_at,
    created_at
FROM user_task_progress 
WHERE user_id = 'your-user-id' 
AND date = CURRENT_DATE
ORDER BY created_at DESC;

-- 统计今日各任务的完成情况
SELECT 
    task_id,
    COUNT(*) as total_records,
    COUNT(CASE WHEN completed = true THEN 1 END) as completed_count,
    COUNT(CASE WHEN completed = false THEN 1 END) as not_completed_count
FROM user_task_progress 
WHERE date = CURRENT_DATE
GROUP BY task_id
ORDER BY task_id; 
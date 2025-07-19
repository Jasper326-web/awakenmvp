-- 重置今天的任务完成状态
-- 删除今天的所有任务完成记录

-- 查看今天的数据
SELECT 
    task_id,
    completed,
    completed_at,
    created_at
FROM user_task_progress 
WHERE date = CURRENT_DATE
ORDER BY created_at DESC;

-- 删除今天的所有数据
DELETE FROM user_task_progress 
WHERE date = CURRENT_DATE;

-- 确认删除结果
SELECT COUNT(*) as remaining_records
FROM user_task_progress 
WHERE date = CURRENT_DATE;

-- 查看明天的数据（如果有的话）
SELECT 
    task_id,
    completed,
    completed_at
FROM user_task_progress 
WHERE date = CURRENT_DATE + INTERVAL '1 day'
ORDER BY created_at DESC; 
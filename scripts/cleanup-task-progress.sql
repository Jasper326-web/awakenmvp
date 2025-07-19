-- 清理 user_task_progress 表中的错误数据
-- 查看当前数据
SELECT 
    user_id,
    task_id,
    date,
    completed,
    completed_at,
    created_at
FROM user_task_progress 
WHERE date = CURRENT_DATE
ORDER BY created_at DESC;

-- 删除今日的所有数据（谨慎使用）
-- DELETE FROM user_task_progress WHERE date = CURRENT_DATE;

-- 删除特定用户今日的数据（替换 'your-user-id' 为实际用户ID）
-- DELETE FROM user_task_progress 
-- WHERE user_id = 'your-user-id' 
-- AND date = CURRENT_DATE;

-- 查看表结构确认字段类型
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_task_progress'
ORDER BY ordinal_position; 
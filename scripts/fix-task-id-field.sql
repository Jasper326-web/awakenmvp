-- 修改 user_task_progress 表的 task_id 字段为 TEXT 类型
-- 这样可以存储字符串类型的任务ID

-- 检查字段类型并修改
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_task_progress' 
        AND column_name = 'task_id' 
        AND data_type = 'uuid'
    ) THEN
        -- 修改字段类型为TEXT
        ALTER TABLE user_task_progress ALTER COLUMN task_id TYPE TEXT;
        RAISE NOTICE '✅ 已修改 task_id 字段为 TEXT 类型';
    ELSE
        RAISE NOTICE 'ℹ️ task_id 字段已经是 TEXT 类型或不存在';
    END IF;
    
    -- 删除原有的外键约束（如果存在）
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'user_task_progress' 
        AND constraint_name LIKE '%task_id%'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE user_task_progress DROP CONSTRAINT IF EXISTS user_task_progress_task_id_fkey;
        RAISE NOTICE '✅ 已删除 task_id 外键约束';
    END IF;
    
    RAISE NOTICE '✅ user_task_progress 表 task_id 字段修改完成';
END $$;

-- 重新创建索引
DROP INDEX IF EXISTS idx_user_task_progress_task_date;
CREATE INDEX IF NOT EXISTS idx_user_task_progress_task_date 
ON user_task_progress(task_id, date);

-- 重新创建唯一约束
DROP INDEX IF EXISTS idx_user_task_progress_unique;
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_task_progress_unique 
ON user_task_progress(user_id, task_id, date); 
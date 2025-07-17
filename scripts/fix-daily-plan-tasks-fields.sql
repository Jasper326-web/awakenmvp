-- 检查 daily_plan_tasks 表的字段名
-- 如果字段名不正确，需要重命名
DO $$
BEGIN
    -- 检查并重命名 task_name 为 task_title
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'daily_plan_tasks' AND column_name = 'task_name') THEN
        ALTER TABLE daily_plan_tasks RENAME COLUMN task_name TO task_title;
    END IF;
    
    -- 检查并重命名 description 为 task_description  
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'daily_plan_tasks' AND column_name = 'description') THEN
        ALTER TABLE daily_plan_tasks RENAME COLUMN description TO task_description;
    END IF;
END $$;

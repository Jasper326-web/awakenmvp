-- 修复或创建 user_task_progress 表
DO $$
BEGIN
    -- 如果表不存在，创建它
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_task_progress') THEN
        CREATE TABLE user_task_progress (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            task_id UUID REFERENCES daily_plan_tasks(id) ON DELETE CASCADE,
            date DATE DEFAULT CURRENT_DATE,
            completed BOOLEAN DEFAULT FALSE,
            completed_at TIMESTAMP WITH TIME ZONE,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    ELSE
        -- 如果表存在但缺少date字段，添加它
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'user_task_progress' AND column_name = 'date') THEN
            ALTER TABLE user_task_progress ADD COLUMN date DATE DEFAULT CURRENT_DATE;
        END IF;
        
        -- 检查并添加其他可能缺少的字段
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'user_task_progress' AND column_name = 'completed_at') THEN
            ALTER TABLE user_task_progress ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'user_task_progress' AND column_name = 'notes') THEN
            ALTER TABLE user_task_progress ADD COLUMN notes TEXT;
        END IF;
    END IF;
END $$;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_task_progress_user_date 
ON user_task_progress(user_id, date);

CREATE INDEX IF NOT EXISTS idx_user_task_progress_task_date 
ON user_task_progress(task_id, date);

-- 创建唯一约束，防止同一用户同一天重复完成同一任务
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_task_progress_unique 
ON user_task_progress(user_id, task_id, date);

-- 启用 RLS
ALTER TABLE user_task_progress ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "Users can view their own task progress" ON user_task_progress;
DROP POLICY IF EXISTS "Users can insert their own task progress" ON user_task_progress;
DROP POLICY IF EXISTS "Users can update their own task progress" ON user_task_progress;

-- 创建 RLS 策略
CREATE POLICY "Users can view their own task progress" ON user_task_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own task progress" ON user_task_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task progress" ON user_task_progress
    FOR UPDATE USING (auth.uid() = user_id);

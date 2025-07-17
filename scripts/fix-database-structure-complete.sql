-- 🎯 全面修复数据库结构
-- 修复字段名、添加缺失字段、确保表结构完整

-- 1️⃣ 修复 daily_plan_tasks 字段名
DO $$
BEGIN
    -- 检查并重命名 task_name 为 task_title
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'daily_plan_tasks' AND column_name = 'task_name') THEN
        ALTER TABLE daily_plan_tasks RENAME COLUMN task_name TO task_title;
        RAISE NOTICE '✅ 已将 task_name 重命名为 task_title';
    END IF;
    
    -- 检查并重命名 description 为 task_description
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'daily_plan_tasks' AND column_name = 'description') THEN
        ALTER TABLE daily_plan_tasks RENAME COLUMN description TO task_description;
        RAISE NOTICE '✅ 已将 description 重命名为 task_description';
    END IF;
END $$;

-- 2️⃣ 确保 personal_plans 表结构完整
DO $$
BEGIN
    -- 添加 plan_type 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_plans' AND column_name = 'plan_type') THEN
        ALTER TABLE personal_plans ADD COLUMN plan_type TEXT DEFAULT 'light';
        RAISE NOTICE '✅ 已添加 plan_type 字段';
    END IF;
    
    -- 添加 is_active 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_plans' AND column_name = 'is_active') THEN
        ALTER TABLE personal_plans ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE '✅ 已添加 is_active 字段';
    END IF;
    
    -- 添加 current_day 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_plans' AND column_name = 'current_day') THEN
        ALTER TABLE personal_plans ADD COLUMN current_day INTEGER DEFAULT 1;
        RAISE NOTICE '✅ 已添加 current_day 字段';
    END IF;
    
    -- 添加 target_days 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_plans' AND column_name = 'target_days') THEN
        ALTER TABLE personal_plans ADD COLUMN target_days INTEGER DEFAULT 90;
        RAISE NOTICE '✅ 已添加 target_days 字段';
    END IF;
END $$;

-- 3️⃣ 确保 daily_checkins 表结构完整
DO $$
BEGIN
    -- 添加 date 字段（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_checkins' AND column_name = 'date') THEN
        ALTER TABLE daily_checkins ADD COLUMN date DATE DEFAULT CURRENT_DATE;
        RAISE NOTICE '✅ 已添加 date 字段';
    END IF;
    
    -- 添加 relapsed 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_checkins' AND column_name = 'relapsed') THEN
        ALTER TABLE daily_checkins ADD COLUMN relapsed BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ 已添加 relapsed 字段';
    END IF;
    
    -- 添加 notes 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_checkins' AND column_name = 'notes') THEN
        ALTER TABLE daily_checkins ADD COLUMN notes TEXT;
        RAISE NOTICE '✅ 已添加 notes 字段';
    END IF;
    
    -- 添加 video_url 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_checkins' AND column_name = 'video_url') THEN
        ALTER TABLE daily_checkins ADD COLUMN video_url TEXT;
        RAISE NOTICE '✅ 已添加 video_url 字段';
    END IF;
    
    -- 添加 sleep_hours 字段（如果需要）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_checkins' AND column_name = 'sleep_hours') THEN
        ALTER TABLE daily_checkins ADD COLUMN sleep_hours INTEGER;
        RAISE NOTICE '✅ 已添加 sleep_hours 字段';
    END IF;
END $$;

-- 4️⃣ 确保 user_task_progress 表存在且结构完整
CREATE TABLE IF NOT EXISTS user_task_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES daily_plan_tasks(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加 task_type 字段用于任务分类
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_task_progress' AND column_name = 'task_type') THEN
        ALTER TABLE user_task_progress ADD COLUMN task_type TEXT;
        RAISE NOTICE '✅ 已添加 task_type 字段到 user_task_progress';
    END IF;
END $$;

-- 5️⃣ 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON daily_checkins(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_task_progress_user_task ON user_task_progress(user_id, task_id);
CREATE INDEX IF NOT EXISTS idx_personal_plans_user_active ON personal_plans(user_id, is_active);

-- 6️⃣ 设置 RLS 策略
ALTER TABLE user_task_progress ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的任务进度
CREATE POLICY "Users can view own task progress" ON user_task_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own task progress" ON user_task_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own task progress" ON user_task_progress
    FOR UPDATE USING (auth.uid() = user_id);

RAISE NOTICE '🎉 数据库结构修复完成！';

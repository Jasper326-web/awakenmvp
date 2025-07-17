-- 创建用户个人计划表
CREATE TABLE IF NOT EXISTS user_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL, -- 计划类型：轻度依赖、中度依赖等
    test_score INTEGER NOT NULL, -- 测试分数
    daily_tasks JSONB NOT NULL, -- 每日任务列表
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id)
);

-- 创建用户每日计划完成记录表
CREATE TABLE IF NOT EXISTS daily_plan_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES user_plans(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    task_id INTEGER NOT NULL,
    task_title TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date, task_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON user_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_active ON user_plans(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_daily_plan_progress_user_date ON daily_plan_progress(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_plan_progress_plan_id ON daily_plan_progress(plan_id);

-- 设置RLS策略
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_plan_progress ENABLE ROW LEVEL SECURITY;

-- 用户只能查看和修改自己的计划
CREATE POLICY "Users can manage their own plans" ON user_plans
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own progress" ON daily_plan_progress
    FOR ALL USING (auth.uid() = user_id);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_user_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_plans_updated_at
    BEFORE UPDATE ON user_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_user_plans_updated_at();

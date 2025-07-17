-- 确保addiction_tests表存在
CREATE TABLE IF NOT EXISTS addiction_tests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    test_score INTEGER NOT NULL,
    addiction_level TEXT NOT NULL,
    category_scores JSONB,
    answers JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_addiction_tests_user_id ON addiction_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_addiction_tests_created_at ON addiction_tests(created_at);

-- 设置RLS策略
ALTER TABLE addiction_tests ENABLE ROW LEVEL SECURITY;

-- 删除现有策略（如果存在）
DROP POLICY IF EXISTS "Users can view own tests" ON addiction_tests;
DROP POLICY IF EXISTS "Users can insert own tests" ON addiction_tests;
DROP POLICY IF EXISTS "Users can update own tests" ON addiction_tests;

-- 创建新的RLS策略
CREATE POLICY "Users can view own tests" ON addiction_tests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tests" ON addiction_tests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tests" ON addiction_tests
    FOR UPDATE USING (auth.uid() = user_id);

-- 确保user_plans表存在
CREATE TABLE IF NOT EXISTS user_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    plan_type TEXT NOT NULL,
    test_score INTEGER,
    daily_tasks JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON user_plans(user_id);

-- 设置RLS策略
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

-- 删除现有策略（如果存在）
DROP POLICY IF EXISTS "Users can view own plans" ON user_plans;
DROP POLICY IF EXISTS "Users can insert own plans" ON user_plans;
DROP POLICY IF EXISTS "Users can update own plans" ON user_plans;

-- 创建新的RLS策略
CREATE POLICY "Users can view own plans" ON user_plans
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plans" ON user_plans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans" ON user_plans
    FOR UPDATE USING (auth.uid() = user_id);

-- 检查表是否存在
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'addiction_tests'
);

-- 如果表存在，检查列结构
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'addiction_tests';

-- 删除旧表（如果需要重建）
DROP TABLE IF EXISTS addiction_tests;

-- 重新创建表，确保有正确的列
CREATE TABLE addiction_tests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    test_score INTEGER NOT NULL,
    addiction_level TEXT NOT NULL,
    answers JSONB,  -- 确保这个列存在
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_addiction_tests_user_id ON addiction_tests(user_id);
CREATE INDEX idx_addiction_tests_created_at ON addiction_tests(created_at);

-- 设置RLS策略
ALTER TABLE addiction_tests ENABLE ROW LEVEL SECURITY;

-- 删除现有策略（如果存在）
DROP POLICY IF EXISTS "Users can view own tests" ON addiction_tests;
DROP POLICY IF EXISTS "Users can insert own tests" ON addiction_tests;

-- 创建新的RLS策略
CREATE POLICY "Users can view own tests" ON addiction_tests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tests" ON addiction_tests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 确认表结构
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'addiction_tests';

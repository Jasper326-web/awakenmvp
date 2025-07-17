-- 创建用户问题存储表
CREATE TABLE IF NOT EXISTS user_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_questions_user_id ON user_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_questions_created_at ON user_questions(created_at DESC);

-- 设置RLS策略
ALTER TABLE user_questions ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "Anyone can insert questions" ON user_questions;
DROP POLICY IF EXISTS "Users can view own questions" ON user_questions;
DROP POLICY IF EXISTS "Service role can do anything" ON user_questions;

-- 重新创建策略
CREATE POLICY "Anyone can insert questions" ON user_questions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own questions" ON user_questions
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service role can do anything" ON user_questions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 验证表创建
SELECT 'user_questions table created successfully' as status;

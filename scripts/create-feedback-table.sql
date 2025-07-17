-- 创建用户反馈表
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  admin_notes TEXT
);

-- 设置RLS策略
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- 允许已认证用户插入反馈
CREATE POLICY "允许已认证用户插入反馈" ON user_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 允许匿名用户插入反馈
CREATE POLICY "允许匿名用户插入反馈" ON user_feedback
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 用户只能查看自己的反馈
CREATE POLICY "用户只能查看自己的反馈" ON user_feedback
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 管理员可以查看和修改所有反馈
CREATE POLICY "管理员可以查看所有反馈" ON user_feedback
  FOR ALL
  TO service_role
  USING (true);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON user_feedback(created_at);

-- 输出确认信息
SELECT 'User feedback table created successfully' AS message;

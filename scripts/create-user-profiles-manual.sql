-- 手动在 Supabase SQL 编辑器中执行以下命令

-- 1. 创建 user_profiles 表
CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(255),
  avatar_url TEXT,
  country VARCHAR(100) DEFAULT '未知',
  streak INTEGER DEFAULT 0,
  level INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- 3. 启用 RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. 创建 RLS 策略
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- 5. 为现有用户创建默认资料
INSERT INTO user_profiles (user_id, username, streak, level)
SELECT 
  id as user_id,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'email', '用户') as username,
  0 as streak,
  0 as level
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_profiles)
ON CONFLICT (user_id) DO NOTHING; 
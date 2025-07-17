-- 安全地清理会员系统并简化架构
-- 使用 IF NOT EXISTS 和 DROP IF EXISTS 来避免重复错误

-- 1. 删除会员相关的表（如果存在）
DROP TABLE IF EXISTS payment_records CASCADE;
DROP TABLE IF EXISTS subscription_history CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;

-- 2. 删除会员相关的函数（如果存在）
DROP FUNCTION IF EXISTS get_user_subscription_status(UUID);
DROP FUNCTION IF EXISTS create_subscription(UUID, TEXT, TIMESTAMP WITH TIME ZONE);
DROP FUNCTION IF EXISTS cancel_subscription(UUID);
DROP FUNCTION IF EXISTS upgrade_subscription(UUID, TEXT);

-- 3. 删除会员相关的视图（如果存在）
DROP VIEW IF EXISTS user_subscription_view;
DROP VIEW IF EXISTS active_subscriptions_view;

-- 4. 删除现有的RLS策略（避免重复创建错误）
DROP POLICY IF EXISTS "Users can view all users for leaderboard" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can view own checkins" ON daily_checkins;
DROP POLICY IF EXISTS "Users can insert own checkins" ON daily_checkins;
DROP POLICY IF EXISTS "Users can update own checkins" ON daily_checkins;
DROP POLICY IF EXISTS "Users can view own tests" ON addiction_tests;
DROP POLICY IF EXISTS "Users can insert own tests" ON addiction_tests;
DROP POLICY IF EXISTS "Users can view all posts" ON community_posts;
DROP POLICY IF EXISTS "Users can insert own posts" ON community_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON community_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON community_posts;
DROP POLICY IF EXISTS "Users can view all likes" ON post_likes;
DROP POLICY IF EXISTS "Users can insert own likes" ON post_likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON post_likes;
DROP POLICY IF EXISTS "Users can view own bookmarks" ON post_bookmarks;
DROP POLICY IF EXISTS "Users can insert own bookmarks" ON post_bookmarks;
DROP POLICY IF EXISTS "Users can delete own bookmarks" ON post_bookmarks;
DROP POLICY IF EXISTS "Users can view own achievements" ON achievements;
DROP POLICY IF EXISTS "Users can insert own achievements" ON achievements;
DROP POLICY IF EXISTS "Users can update own achievements" ON achievements;

-- 5. 确保核心表存在并且结构正确
-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  total_days INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 每日打卡表
CREATE TABLE IF NOT EXISTS daily_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  relapsed BOOLEAN DEFAULT FALSE,
  completed_plan BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 色瘾测试表
CREATE TABLE IF NOT EXISTS addiction_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  test_score INTEGER NOT NULL CHECK (test_score >= 0 AND test_score <= 80),
  addiction_level TEXT NOT NULL CHECK (addiction_level IN ('轻度', '中度', '高度', '极重度')),
  dimension_scores JSONB,
  answers JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 社区帖子表
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 帖子点赞表
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- 成就表
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 创建或重新创建索引
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_current_streak;
DROP INDEX IF EXISTS idx_users_total_days;
DROP INDEX IF EXISTS idx_daily_checkins_user_date;
DROP INDEX IF EXISTS idx_daily_checkins_date;
DROP INDEX IF EXISTS idx_addiction_tests_user_id;
DROP INDEX IF EXISTS idx_addiction_tests_created_at;
DROP INDEX IF EXISTS idx_community_posts_created_at;
DROP INDEX IF EXISTS idx_community_posts_user_id;
DROP INDEX IF EXISTS idx_post_likes_user_post;

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_current_streak ON users(current_streak DESC);
CREATE INDEX idx_users_total_days ON users(total_days DESC);
CREATE INDEX idx_daily_checkins_user_date ON daily_checkins(user_id, date);
CREATE INDEX idx_daily_checkins_date ON daily_checkins(date);
CREATE INDEX idx_addiction_tests_user_id ON addiction_tests(user_id);
CREATE INDEX idx_addiction_tests_created_at ON addiction_tests(created_at DESC);
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX idx_post_likes_user_post ON post_likes(user_id, post_id);

-- 7. 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE addiction_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- 8. 重新创建 RLS 策略
CREATE POLICY "Users can view all users for leaderboard" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own checkins" ON daily_checkins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkins" ON daily_checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkins" ON daily_checkins
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own tests" ON addiction_tests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tests" ON addiction_tests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all posts" ON community_posts
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own posts" ON community_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON community_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON community_posts
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view all likes" ON post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own likes" ON post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON post_likes
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own achievements" ON achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements" ON achievements
  FOR UPDATE USING (auth.uid() = user_id);

-- 9. 创建有用的函数
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
BEGIN
  -- 更新用户连续天数和总天数
  UPDATE users 
  SET 
    current_streak = (
      SELECT COUNT(*) 
      FROM daily_checkins 
      WHERE user_id = NEW.user_id 
        AND date >= (
          SELECT COALESCE(MAX(date), NEW.date) 
          FROM daily_checkins 
          WHERE user_id = NEW.user_id AND relapsed = true
        )
        AND relapsed = false
    ),
    total_days = (
      SELECT COUNT(*) 
      FROM daily_checkins 
      WHERE user_id = NEW.user_id AND relapsed = false
    ),
    updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS update_user_streak_trigger ON daily_checkins;
CREATE TRIGGER update_user_streak_trigger
  AFTER INSERT OR UPDATE ON daily_checkins
  FOR EACH ROW
  EXECUTE FUNCTION update_user_streak();

-- 完成提示
SELECT 'Database cleanup and simplification completed successfully!' as status;

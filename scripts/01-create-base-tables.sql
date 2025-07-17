-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建用户表
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

-- 创建每日打卡表
CREATE TABLE IF NOT EXISTS daily_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mood TEXT NOT NULL CHECK (mood IN ('excellent', 'good', 'okay', 'bad', 'terrible')),
  had_urges TEXT NOT NULL CHECK (had_urges IN ('none', 'mild', 'moderate', 'strong', 'overwhelming')),
  relapsed BOOLEAN DEFAULT FALSE,
  exercised BOOLEAN DEFAULT FALSE,
  had_brain_fog TEXT NOT NULL CHECK (had_brain_fog IN ('none', 'mild', 'moderate', 'severe')),
  sleep_hours DECIMAL(3,1) NOT NULL CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
  sleep_quality TEXT NOT NULL CHECK (sleep_quality IN ('excellent', 'good', 'okay', 'poor', 'terrible')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 创建色瘾测试表
CREATE TABLE IF NOT EXISTS addiction_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  first_exposure_age INTEGER NOT NULL CHECK (first_exposure_age >= 5 AND first_exposure_age <= 30),
  habit_duration_years INTEGER NOT NULL CHECK (habit_duration_years >= 0 AND habit_duration_years <= 50),
  monthly_frequency INTEGER NOT NULL CHECK (monthly_frequency >= 0 AND monthly_frequency <= 100),
  content_escalation TEXT NOT NULL CHECK (content_escalation IN ('none', 'mild', 'moderate', 'severe')),
  boredom_relapse TEXT NOT NULL CHECK (boredom_relapse IN ('never', 'rarely', 'sometimes', 'often', 'always')),
  emotional_relapse TEXT NOT NULL CHECK (emotional_relapse IN ('never', 'rarely', 'sometimes', 'often', 'always')),
  paid_content TEXT NOT NULL CHECK (paid_content IN ('never', 'rarely', 'sometimes', 'often', 'regularly')),
  test_score INTEGER NOT NULL CHECK (test_score >= 0 AND test_score <= 100),
  addiction_level TEXT NOT NULL CHECK (addiction_level IN ('low', 'moderate', 'high', 'severe')),
  physical_symptoms TEXT[] DEFAULT '{}',
  psychological_symptoms TEXT[] DEFAULT '{}',
  final_assessment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建社区帖子表
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

-- 创建成就表
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL CHECK (achievement_type IN ('streak', 'checkin', 'social', 'meditation', 'test')),
  achievement_name TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建帖子点赞表
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- 创建帖子收藏表
CREATE TABLE IF NOT EXISTS post_bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

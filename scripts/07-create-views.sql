-- 创建用户完整信息视图
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
  u.id,
  u.email,
  u.username,
  u.avatar_url,
  u.current_streak,
  u.total_days,
  u.level,
  u.created_at as user_created_at,
  u.updated_at as user_updated_at,
  COALESCE(us.plan, 'free') as subscription_plan,
  COALESCE(us.is_active, FALSE) as subscription_active,
  us.expires_at as subscription_expires_at,
  CASE 
    WHEN us.expires_at IS NOT NULL AND us.expires_at > NOW()
    THEN GREATEST(0, EXTRACT(days FROM (us.expires_at - NOW()))::INTEGER)
    ELSE NULL
  END as days_remaining,
  CASE 
    WHEN us.plan IN ('pro', 'premium') 
      AND us.is_active = TRUE 
      AND (us.expires_at IS NULL OR us.expires_at > NOW()) 
    THEN TRUE 
    ELSE FALSE 
  END as is_pro,
  CASE 
    WHEN us.plan = 'premium' 
      AND us.is_active = TRUE 
      AND (us.expires_at IS NULL OR us.expires_at > NOW()) 
    THEN TRUE 
    ELSE FALSE 
  END as is_premium
FROM users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id;

-- 创建活跃订阅视图
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT 
  us.*,
  u.email,
  u.username,
  CASE 
    WHEN us.expires_at IS NOT NULL AND us.expires_at > NOW()
    THEN GREATEST(0, EXTRACT(days FROM (us.expires_at - NOW()))::INTEGER)
    ELSE NULL
  END as days_remaining
FROM user_subscriptions us
JOIN users u ON us.user_id = u.id
WHERE us.is_active = TRUE
  AND (us.expires_at IS NULL OR us.expires_at > NOW());

-- 创建即将过期的订阅视图
CREATE OR REPLACE VIEW expiring_subscriptions AS
SELECT 
  us.*,
  u.email,
  u.username,
  EXTRACT(days FROM (us.expires_at - NOW()))::INTEGER as days_remaining
FROM user_subscriptions us
JOIN users u ON us.user_id = u.id
WHERE us.is_active = TRUE
  AND us.expires_at IS NOT NULL
  AND us.expires_at > NOW()
  AND us.expires_at <= NOW() + INTERVAL '7 days';

-- 创建用户统计视图
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
  u.id,
  u.username,
  u.current_streak,
  u.total_days,
  u.level,
  COUNT(dc.id) as total_checkins,
  COUNT(CASE WHEN dc.relapsed = true THEN 1 END) as total_relapses,
  COUNT(CASE WHEN dc.exercised = true THEN 1 END) as exercise_days,
  AVG(dc.sleep_hours) as avg_sleep_hours,
  COUNT(CASE WHEN dc.mood IN ('excellent', 'good') THEN 1 END) as good_mood_days,
  COALESCE(us.plan, 'free') as subscription_plan,
  CASE 
    WHEN us.plan IN ('pro', 'premium') 
      AND us.is_active = TRUE 
      AND (us.expires_at IS NULL OR us.expires_at > NOW()) 
    THEN TRUE 
    ELSE FALSE 
  END as is_pro
FROM users u
LEFT JOIN daily_checkins dc ON u.id = dc.user_id
LEFT JOIN user_subscriptions us ON u.id = us.user_id
GROUP BY u.id, u.username, u.current_streak, u.total_days, u.level, us.plan, us.is_active, us.expires_at;

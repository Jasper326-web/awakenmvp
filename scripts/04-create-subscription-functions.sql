-- 创建检查订阅状态的函数
CREATE OR REPLACE FUNCTION check_subscription_status(user_id UUID)
RETURNS TABLE(
  plan TEXT,
  is_active BOOLEAN,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_expired BOOLEAN,
  is_pro BOOLEAN,
  is_premium BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(us.plan, 'free') as plan,
    COALESCE(us.is_active, FALSE) as is_active,
    us.expires_at,
    CASE 
      WHEN us.expires_at IS NULL THEN FALSE
      WHEN us.expires_at < NOW() THEN TRUE
      ELSE FALSE
    END as is_expired,
    CASE 
      WHEN us.plan IN ('pro', 'premium') AND us.is_active = TRUE AND (us.expires_at IS NULL OR us.expires_at > NOW()) 
      THEN TRUE 
      ELSE FALSE 
    END as is_pro,
    CASE 
      WHEN us.plan = 'premium' AND us.is_active = TRUE AND (us.expires_at IS NULL OR us.expires_at > NOW()) 
      THEN TRUE 
      ELSE FALSE 
    END as is_premium
  FROM users u
  LEFT JOIN user_subscriptions us ON u.id = us.user_id
  WHERE u.id = check_subscription_status.user_id;
END;
$$ LANGUAGE plpgsql;

-- 创建获取用户完整信息的函数
CREATE OR REPLACE FUNCTION get_user_profile(user_id UUID)
RETURNS TABLE(
  id UUID,
  email TEXT,
  username TEXT,
  avatar_url TEXT,
  current_streak INTEGER,
  total_days INTEGER,
  level INTEGER,
  subscription_plan TEXT,
  subscription_active BOOLEAN,
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  is_pro BOOLEAN,
  is_premium BOOLEAN,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.username,
    u.avatar_url,
    u.current_streak,
    u.total_days,
    u.level,
    COALESCE(us.plan, 'free') as subscription_plan,
    COALESCE(us.is_active, FALSE) as subscription_active,
    us.expires_at as subscription_expires_at,
    CASE 
      WHEN us.plan IN ('pro', 'premium') AND us.is_active = TRUE AND (us.expires_at IS NULL OR us.expires_at > NOW()) 
      THEN TRUE 
      ELSE FALSE 
    END as is_pro,
    CASE 
      WHEN us.plan = 'premium' AND us.is_active = TRUE AND (us.expires_at IS NULL OR us.expires_at > NOW()) 
      THEN TRUE 
      ELSE FALSE 
    END as is_premium,
    CASE 
      WHEN us.expires_at IS NOT NULL AND us.expires_at > NOW()
      THEN GREATEST(0, EXTRACT(days FROM (us.expires_at - NOW()))::INTEGER)
      ELSE NULL
    END as days_remaining
  FROM users u
  LEFT JOIN user_subscriptions us ON u.id = us.user_id
  WHERE u.id = get_user_profile.user_id;
END;
$$ LANGUAGE plpgsql;

-- 创建获取排行榜的函数（支持会员权限）
CREATE OR REPLACE FUNCTION get_leaderboard(
  order_by TEXT DEFAULT 'current_streak',
  user_limit INTEGER DEFAULT 10,
  requesting_user_id UUID DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  username TEXT,
  current_streak INTEGER,
  total_days INTEGER,
  level INTEGER,
  rank INTEGER,
  is_pro BOOLEAN
) AS $$
DECLARE
  is_pro_user BOOLEAN := FALSE;
BEGIN
  -- 检查请求用户是否为会员
  IF requesting_user_id IS NOT NULL THEN
    SELECT 
      CASE 
        WHEN us.plan IN ('pro', 'premium') AND us.is_active = TRUE AND (us.expires_at IS NULL OR us.expires_at > NOW()) 
        THEN TRUE 
        ELSE FALSE 
      END INTO is_pro_user
    FROM users u
    LEFT JOIN user_subscriptions us ON u.id = us.user_id
    WHERE u.id = requesting_user_id;
  END IF;
  
  -- 根据会员状态调整限制
  IF is_pro_user THEN
    user_limit := GREATEST(user_limit, 50); -- Pro用户至少可以看50名
  ELSE
    user_limit := LEAST(user_limit, 10); -- 免费用户最多看10名
  END IF;
  
  RETURN QUERY
  SELECT 
    u.id,
    u.username,
    u.current_streak,
    u.total_days,
    u.level,
    ROW_NUMBER() OVER (
      ORDER BY 
        CASE WHEN order_by = 'current_streak' THEN u.current_streak END DESC,
        CASE WHEN order_by = 'total_days' THEN u.total_days END DESC,
        u.created_at ASC
    )::INTEGER as rank,
    CASE 
      WHEN us.plan IN ('pro', 'premium') AND us.is_active = TRUE AND (us.expires_at IS NULL OR us.expires_at > NOW()) 
      THEN TRUE 
      ELSE FALSE 
    END as is_pro
  FROM users u
  LEFT JOIN user_subscriptions us ON u.id = us.user_id
  ORDER BY 
    CASE WHEN order_by = 'current_streak' THEN u.current_streak END DESC,
    CASE WHEN order_by = 'total_days' THEN u.total_days END DESC,
    u.created_at ASC
  LIMIT user_limit;
END;
$$ LANGUAGE plpgsql;

-- 创建自动过期订阅的函数
CREATE OR REPLACE FUNCTION expire_subscriptions()
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  -- 将过期的订阅设为非活跃状态
  UPDATE user_subscriptions 
  SET is_active = FALSE
  WHERE expires_at < NOW() 
    AND is_active = TRUE
    AND plan != 'free';
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  -- 记录过期事件
  INSERT INTO subscription_history (user_id, plan, action, created_at)
  SELECT user_id, plan, 'expire', NOW()
  FROM user_subscriptions 
  WHERE expires_at < NOW() 
    AND is_active = FALSE
    AND plan != 'free'
    AND NOT EXISTS (
      SELECT 1 FROM subscription_history sh 
      WHERE sh.user_id = user_subscriptions.user_id 
        AND sh.action = 'expire' 
        AND sh.created_at > NOW() - INTERVAL '1 day'
    );
  
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

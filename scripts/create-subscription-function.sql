-- 创建检查订阅状态的函数
CREATE OR REPLACE FUNCTION public.check_subscription_status(user_id UUID)
RETURNS TABLE (
  plan TEXT,
  is_active BOOLEAN,
  expires_at TIMESTAMPTZ,
  is_expired BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(us.plan, 'free')::TEXT as plan,
    COALESCE(us.is_active, false) as is_active,
    us.expires_at,
    CASE 
      WHEN us.expires_at IS NULL THEN false
      WHEN us.expires_at < NOW() THEN true
      ELSE false
    END as is_expired
  FROM 
    (SELECT NULL::TEXT as plan, NULL::BOOLEAN as is_active, NULL::TIMESTAMPTZ as expires_at) as empty_sub
  LEFT JOIN 
    public.user_subscriptions us ON us.user_id = check_subscription_status.user_id
  WHERE 
    us.is_active = true OR us.is_active IS NULL
  LIMIT 1;
END;
$$;

-- 添加函数注释
COMMENT ON FUNCTION public.check_subscription_status IS '检查用户的订阅状态';

-- 授予执行权限
GRANT EXECUTE ON FUNCTION public.check_subscription_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_subscription_status TO service_role;

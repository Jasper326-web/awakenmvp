-- 修正AI使用统计函数
-- 此脚本修正get_user_ai_usage_stats函数中的字段名错误

-- 重新创建函数：获取用户AI使用统计信息
CREATE OR REPLACE FUNCTION get_user_ai_usage_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    today_usage INTEGER;
    total_usage INTEGER;
    weekly_usage INTEGER;
    monthly_usage INTEGER;
    user_type TEXT;
    max_daily_usage INTEGER;
    remaining_today INTEGER;
    week_start DATE;
    month_start DATE;
BEGIN
    -- 获取用户类型（只要有premium/pro记录即可，无需status=active）
    SELECT subscription_type INTO user_type
    FROM user_subscriptions
    WHERE user_id = user_uuid AND subscription_type IN ('premium', 'pro')
    LIMIT 1;
    
    IF user_type IS NULL THEN
        user_type := 'free';
    END IF;
    
    -- 设置最大使用次数
    IF user_type IN ('premium', 'pro') THEN
        max_daily_usage := 999999;
    ELSE
        max_daily_usage := 5;
    END IF;
    
    -- 计算本周开始日期（周一）
    week_start := CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE) - 1)::INTEGER;
    IF week_start > CURRENT_DATE THEN
        week_start := week_start - 7;
    END IF;
    
    -- 计算本月开始日期
    month_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    
    -- 获取今日使用次数
    SELECT COUNT(*) INTO today_usage
    FROM chat_logs
    WHERE user_id = user_uuid 
    AND usage_date = CURRENT_DATE;
    
    -- 获取总使用次数
    SELECT COUNT(*) INTO total_usage
    FROM chat_logs
    WHERE user_id = user_uuid;
    
    -- 获取本周使用次数（从周一到今天）
    SELECT COUNT(*) INTO weekly_usage
    FROM chat_logs
    WHERE user_id = user_uuid 
    AND usage_date >= week_start
    AND usage_date <= CURRENT_DATE;
    
    -- 获取本月使用次数（从本月1号到今天）
    SELECT COUNT(*) INTO monthly_usage
    FROM chat_logs
    WHERE user_id = user_uuid 
    AND usage_date >= month_start
    AND usage_date <= CURRENT_DATE;
    
    -- 计算今日剩余次数
    remaining_today := GREATEST(0, max_daily_usage - COALESCE(today_usage, 0));
    
    RETURN json_build_object(
        'today_usage', COALESCE(today_usage, 0),
        'total_usage', COALESCE(total_usage, 0),
        'weekly_usage', COALESCE(weekly_usage, 0),
        'monthly_usage', COALESCE(monthly_usage, 0),
        'user_type', user_type,
        'max_daily_usage', max_daily_usage,
        'remaining_today', remaining_today,
        'week_start', week_start,
        'month_start', month_start,
        'can_send_today', remaining_today > 0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 验证函数是否创建成功
SELECT 'get_user_ai_usage_stats function updated successfully' as status; 
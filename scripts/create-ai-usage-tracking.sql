-- AI助教使用次数跟踪系统
-- 此脚本为已存在的chat_logs表添加使用次数跟踪功能

-- 1. 确保chat_logs表有usage_date字段（如果不存在则添加）
ALTER TABLE chat_logs 
ADD COLUMN IF NOT EXISTS usage_date DATE DEFAULT CURRENT_DATE;

-- 2. 创建索引以提高按日期查询的性能
CREATE INDEX IF NOT EXISTS idx_chat_logs_user_usage_date ON chat_logs(user_id, usage_date);

-- 3. 创建函数：获取用户今日已使用的AI消息次数
CREATE OR REPLACE FUNCTION get_user_daily_ai_usage(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    usage_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO usage_count
    FROM chat_logs
    WHERE user_id = user_uuid 
    AND usage_date = CURRENT_DATE;
    
    RETURN COALESCE(usage_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 创建函数：检查用户是否可以发送AI消息
CREATE OR REPLACE FUNCTION can_user_send_ai_message(user_uuid UUID, user_type TEXT)
RETURNS JSON AS $$
DECLARE
    current_usage INTEGER;
    max_usage INTEGER;
    can_send BOOLEAN;
    remaining_count INTEGER;
BEGIN
    -- 获取当前使用次数
    current_usage := get_user_daily_ai_usage(user_uuid);
    
    -- 根据用户类型设置最大使用次数
    IF user_type = 'premium' OR user_type = 'pro' THEN
        max_usage := 999999; -- 付费用户无限制
    ELSE
        max_usage := 5; -- 免费用户每日5条
    END IF;
    
    -- 检查是否可以发送
    can_send := current_usage < max_usage;
    remaining_count := GREATEST(0, max_usage - current_usage);
    
    RETURN json_build_object(
        'can_send', can_send,
        'current_usage', current_usage,
        'max_usage', max_usage,
        'remaining_count', remaining_count,
        'user_type', user_type
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 创建函数：获取用户AI使用统计信息
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
    -- 获取用户类型（从user_subscriptions表，如果存在）
    SELECT subscription_type INTO user_type
    FROM user_subscriptions
    WHERE user_id = user_uuid AND status = 'active'
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

-- 6. 创建触发器：自动设置usage_date字段（如果不存在）
CREATE OR REPLACE FUNCTION set_usage_date()
RETURNS TRIGGER AS $$
BEGIN
    NEW.usage_date = CURRENT_DATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_chat_logs_usage_date ON chat_logs;
CREATE TRIGGER set_chat_logs_usage_date
    BEFORE INSERT ON chat_logs
    FOR EACH ROW
    EXECUTE FUNCTION set_usage_date();

-- 7. 更新现有记录的usage_date字段（如果为空）
UPDATE chat_logs 
SET usage_date = DATE(created_at)
WHERE usage_date IS NULL;

-- 8. 添加注释
COMMENT ON FUNCTION get_user_daily_ai_usage(UUID) IS '获取用户今日AI使用次数';
COMMENT ON FUNCTION can_user_send_ai_message(UUID, TEXT) IS '检查用户是否可以发送AI消息';
COMMENT ON FUNCTION get_user_ai_usage_stats(UUID) IS '获取用户AI使用统计信息';
COMMENT ON COLUMN chat_logs.usage_date IS '使用日期，用于按日期统计使用次数';

-- 验证脚本执行
SELECT 'AI usage tracking system created successfully' as status; 
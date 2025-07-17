-- 创建用户订阅表
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_type VARCHAR(20) NOT NULL DEFAULT 'free',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    stripe_session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id)
);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 设置RLS策略
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 用户只能查看和更新自己的订阅记录
CREATE POLICY "Users can view own subscription" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- 允许插入新订阅记录
CREATE POLICY "Users can insert own subscription" ON user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 创建获取用户订阅状态的函数
CREATE OR REPLACE FUNCTION get_user_subscription_status(user_uuid UUID)
RETURNS TABLE (
    subscription_type VARCHAR(20),
    status VARCHAR(20),
    is_premium BOOLEAN,
    expires_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(us.subscription_type, 'free'::VARCHAR(20)) as subscription_type,
        COALESCE(us.status, 'active'::VARCHAR(20)) as status,
        CASE 
            WHEN us.subscription_type = 'premium' AND us.status = 'active' AND (us.expires_at IS NULL OR us.expires_at > NOW()) 
            THEN true 
            ELSE false 
        END as is_premium,
        us.expires_at
    FROM auth.users u
    LEFT JOIN user_subscriptions us ON u.id = us.user_id
    WHERE u.id = user_uuid;
END;
$$;

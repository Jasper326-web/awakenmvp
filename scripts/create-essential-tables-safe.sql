-- 安全创建用户订阅表
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_type TEXT NOT NULL DEFAULT 'free',
    status TEXT NOT NULL DEFAULT 'active',
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用RLS（如果尚未启用）
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 安全删除现有策略
DROP POLICY IF EXISTS "Users can view own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.user_subscriptions;

-- 重新创建RLS策略
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription" ON public.user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON public.user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- 删除现有函数（如果存在）
DROP FUNCTION IF EXISTS check_subscription_status(uuid);

-- 创建简化的订阅状态检查函数
CREATE OR REPLACE FUNCTION check_subscription_status(user_uuid UUID)
RETURNS TABLE(
    subscription_type TEXT,
    status TEXT,
    is_premium BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(us.subscription_type, 'free') as subscription_type,
        COALESCE(us.status, 'active') as status,
        CASE 
            WHEN us.subscription_type = 'premium' AND us.status = 'active' 
            THEN TRUE 
            ELSE FALSE 
        END as is_premium
    FROM public.user_subscriptions us
    WHERE us.user_id = user_uuid
    ORDER BY us.created_at DESC
    LIMIT 1;
    
    -- 如果没有记录，返回默认值
    IF NOT FOUND THEN
        RETURN QUERY SELECT 'free'::TEXT, 'active'::TEXT, FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 安全地为现有用户创建默认订阅记录
DO $$
BEGIN
    INSERT INTO public.user_subscriptions (user_id, subscription_type, status)
    SELECT id, 'free', 'active'
    FROM auth.users
    WHERE id NOT IN (SELECT COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid) FROM public.user_subscriptions)
    ON CONFLICT DO NOTHING;
EXCEPTION
    WHEN OTHERS THEN
        -- 忽略错误，继续执行
        NULL;
END $$;

-- 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);

-- 验证表和函数是否创建成功
SELECT 'user_subscriptions table created successfully' as status;
SELECT 'check_subscription_status function created successfully' as status;

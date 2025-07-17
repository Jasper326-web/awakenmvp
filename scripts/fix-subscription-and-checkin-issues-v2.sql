-- 首先删除现有的冲突函数
DROP FUNCTION IF EXISTS check_subscription_status(uuid);

-- 创建缺失的订阅相关表
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_type TEXT NOT NULL DEFAULT 'free', -- 'free', 'premium'
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'expired'
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 重新创建订阅状态检查函数
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
            WHEN us.subscription_type = 'premium' AND us.status = 'active' AND (us.end_date IS NULL OR us.end_date > NOW())
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

-- 修复daily_checkins表，移除status列，使用relapsed列
ALTER TABLE public.daily_checkins DROP COLUMN IF EXISTS status;

-- 确保daily_checkins表有正确的结构
ALTER TABLE public.daily_checkins 
ADD COLUMN IF NOT EXISTS relapsed BOOLEAN DEFAULT FALSE;

-- 创建RLS策略
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "Users can view own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.user_subscriptions;

-- 创建新的RLS策略
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription" ON public.user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON public.user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- 为所有现有用户创建默认免费订阅
INSERT INTO public.user_subscriptions (user_id, subscription_type, status)
SELECT id, 'free', 'active'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_subscriptions WHERE user_id IS NOT NULL)
ON CONFLICT DO NOTHING;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);

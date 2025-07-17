-- 修复缺失的数据库表和函数

-- 1. 创建 user_subscriptions 表（如果不存在）
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_pro BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    subscription_type TEXT DEFAULT 'free',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建 achievements 表（如果不存在）
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    achievement_type TEXT NOT NULL DEFAULT 'general',
    icon_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建 user_achievements 表（如果不存在）
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_displayed BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, achievement_id)
);

-- 4. 检查并修复 daily_checkins 表结构
DO $$
BEGIN
    -- 检查 status 列是否存在，如果不存在则添加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_checkins' 
        AND column_name = 'status'
        AND table_schema = 'public'
    ) THEN
        -- 添加 status 列，基于 relapsed 字段计算默认值
        ALTER TABLE public.daily_checkins 
        ADD COLUMN status TEXT DEFAULT 'success';
        
        -- 更新现有记录的 status 值
        UPDATE public.daily_checkins 
        SET status = CASE 
            WHEN relapsed = TRUE THEN 'failed'
            ELSE 'success'
        END;
    END IF;
END $$;

-- 5. 创建 check_subscription_status 函数
CREATE OR REPLACE FUNCTION public.check_subscription_status(user_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    subscription_data JSON;
BEGIN
    -- 获取用户订阅信息
    SELECT json_build_object(
        'user_id', user_id,
        'is_pro', COALESCE(is_pro, FALSE),
        'is_premium', COALESCE(is_premium, FALSE),
        'subscription_type', COALESCE(subscription_type, 'free'),
        'expires_at', expires_at,
        'is_active', CASE 
            WHEN expires_at IS NULL THEN TRUE
            WHEN expires_at > NOW() THEN TRUE
            ELSE FALSE
        END
    ) INTO subscription_data
    FROM public.user_subscriptions
    WHERE user_id = user_uuid;
    
    -- 如果没有订阅记录，返回默认免费用户信息
    IF subscription_data IS NULL THEN
        subscription_data := json_build_object(
            'user_id', user_uuid,
            'is_pro', FALSE,
            'is_premium', FALSE,
            'subscription_type', 'free',
            'expires_at', NULL,
            'is_active', TRUE
        );
    END IF;
    
    RETURN subscription_data;
END;
$$;

-- 6. 创建基础成就数据
INSERT INTO public.achievements (name, description, achievement_type, is_active) VALUES
    ('小试牛刀', '连续守戒3天', 'streak', TRUE),
    ('初入道途', '连续守戒7天', 'streak', TRUE),
    ('意志萌芽', '连续守戒14天', 'streak', TRUE),
    ('心坚如石', '连续守戒30天', 'streak', TRUE),
    ('志行百日', '连续守戒90天', 'streak', TRUE),
    ('破而后立', '连续守戒180天', 'streak', TRUE),
    ('心灵觉醒', '连续守戒365天', 'streak', TRUE)
ON CONFLICT (name) DO NOTHING;

-- 7. 设置 RLS 策略
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- 用户订阅策略
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON public.user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- 成就策略
CREATE POLICY "Anyone can view active achievements" ON public.achievements
    FOR SELECT USING (is_active = TRUE);

-- 用户成就策略
CREATE POLICY "Users can view own achievements" ON public.user_achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON public.user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. 创建索引优化性能
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_active ON public.achievements(is_active);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_status ON public.daily_checkins(status);

-- 9. 授予必要权限
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.achievements TO anon, authenticated;
GRANT ALL ON public.user_subscriptions TO authenticated;
GRANT ALL ON public.user_achievements TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_subscription_status TO authenticated;

COMMIT;

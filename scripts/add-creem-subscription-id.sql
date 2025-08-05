-- 添加Creem订阅ID字段到user_subscriptions表
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS creem_subscription_id TEXT;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_creem_id ON public.user_subscriptions(creem_subscription_id);

-- 添加注释说明字段用途
COMMENT ON COLUMN public.user_subscriptions.creem_subscription_id IS 'Creem平台的订阅ID，用于API调用'; 
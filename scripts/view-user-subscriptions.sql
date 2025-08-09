-- 查看user_subscriptions表的所有数据
SELECT 
    id,
    user_id,
    subscription_type,
    status,
    created_at,
    updated_at,
    end_date,
    creem_subscription_id,
    start_date
FROM public.user_subscriptions 
ORDER BY created_at DESC; 
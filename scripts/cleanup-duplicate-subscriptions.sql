-- 清理重复的订阅记录，只保留最新的有效记录
-- 1. 查看要删除的记录
SELECT 
    id,
    user_id,
    subscription_type,
    status,
    created_at,
    creem_subscription_id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
FROM public.user_subscriptions 
WHERE user_id = '25936bb6-f478-4651-a102-0edbf02adcf8'
ORDER BY created_at DESC;

-- 2. 删除重复记录，只保留最新的
DELETE FROM public.user_subscriptions 
WHERE id IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
        FROM public.user_subscriptions
        WHERE user_id = '25936bb6-f478-4651-a102-0edbf02adcf8'
    ) t
    WHERE rn > 1
);

-- 3. 确认清理结果
SELECT 
    id,
    user_id,
    subscription_type,
    status,
    created_at,
    creem_subscription_id
FROM public.user_subscriptions 
WHERE user_id = '25936bb6-f478-4651-a102-0edbf02adcf8'
ORDER BY created_at DESC; 
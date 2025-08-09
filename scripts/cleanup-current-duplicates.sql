-- 清理当前用户的重复订阅记录，只保留最新的有效记录
-- 删除creem_subscription_id为null的记录，保留有正确订阅ID的记录

-- 1. 查看要删除的记录
SELECT 
    id,
    user_id,
    subscription_type,
    status,
    created_at,
    creem_subscription_id,
    CASE 
        WHEN creem_subscription_id IS NULL THEN '要删除'
        ELSE '保留'
    END as action
FROM public.user_subscriptions 
WHERE user_id = '25936bb6-f478-4651-a102-0edbf02adcf8'
ORDER BY created_at DESC;

-- 2. 删除creem_subscription_id为null的记录
DELETE FROM public.user_subscriptions 
WHERE user_id = '25936bb6-f478-4651-a102-0edbf02adcf8'
AND creem_subscription_id IS NULL;

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
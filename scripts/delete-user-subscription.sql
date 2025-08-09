-- 删除指定用户的订阅记录
-- 使用方法：将下面的 user_id 替换为实际的用户ID

-- 1. 查看当前用户的订阅记录
SELECT 
    id,
    user_id,
    subscription_type,
    status,
    created_at,
    updated_at,
    end_date,
    creem_subscription_id
FROM public.user_subscriptions 
WHERE user_id = '25936bb6-f478-4651-a102-0edbf02adcf8';

-- 2. 删除指定用户的订阅记录
DELETE FROM public.user_subscriptions 
WHERE user_id = '25936bb6-f478-4651-a102-0edbf02adcf8';

-- 3. 确认删除结果
SELECT 
    COUNT(*) as remaining_records
FROM public.user_subscriptions 
WHERE user_id = '25936bb6-f478-4651-a102-0edbf02adcf8';

-- 4. 查看所有剩余的订阅记录
SELECT 
    id,
    user_id,
    subscription_type,
    status,
    created_at,
    updated_at,
    end_date
FROM public.user_subscriptions 
ORDER BY created_at DESC 
LIMIT 10; 
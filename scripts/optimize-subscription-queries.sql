-- 优化订阅查询性能的索引
-- 为user_subscriptions表添加复合索引

-- 为user_id和status创建复合索引
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_status 
ON public.user_subscriptions(user_id, status);

-- 为user_id和created_at创建复合索引
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_created 
ON public.user_subscriptions(user_id, created_at DESC);

-- 为status和end_date创建索引（用于过期检查）
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status_end_date 
ON public.user_subscriptions(status, end_date);

-- 分析表以更新统计信息
ANALYZE public.user_subscriptions; 
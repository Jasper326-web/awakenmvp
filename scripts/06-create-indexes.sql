-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_level ON users(level);
CREATE INDEX IF NOT EXISTS idx_users_current_streak ON users(current_streak);
CREATE INDEX IF NOT EXISTS idx_users_total_days ON users(total_days);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- 每日打卡表索引
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON daily_checkins(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_date ON daily_checkins(date);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_id ON daily_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_relapsed ON daily_checkins(relapsed);

-- 色瘾测试表索引
CREATE INDEX IF NOT EXISTS idx_addiction_tests_user_id ON addiction_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_addiction_tests_created_at ON addiction_tests(created_at);
CREATE INDEX IF NOT EXISTS idx_addiction_tests_addiction_level ON addiction_tests(addiction_level);

-- 社区帖子表索引
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_likes_count ON community_posts(likes_count DESC);

-- 成就表索引
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_completed ON achievements(completed);
CREATE INDEX IF NOT EXISTS idx_achievements_type ON achievements(achievement_type);

-- 点赞和收藏表索引
CREATE INDEX IF NOT EXISTS idx_post_likes_user_post ON post_likes(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_bookmarks_user_post ON post_bookmarks(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_post_bookmarks_post_id ON post_bookmarks(post_id);

-- 订阅表索引
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_active ON user_subscriptions(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan ON user_subscriptions(plan);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_expires_at ON user_subscriptions(expires_at);

-- 订阅历史表索引
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_created_at ON subscription_history(created_at);
CREATE INDEX IF NOT EXISTS idx_subscription_history_action ON subscription_history(action);

-- 支付记录表索引
CREATE INDEX IF NOT EXISTS idx_payment_records_user_id ON payment_records(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_subscription_id ON payment_records(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_status ON payment_records(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_records_created_at ON payment_records(created_at);

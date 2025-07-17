-- 插入示例用户数据
INSERT INTO users (id, username, email, level, current_streak, total_days) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '坚持者', 'user1@example.com', 3, 15, 45),
  ('550e8400-e29b-41d4-a716-446655440002', '新人小白', 'user2@example.com', 1, 3, 8),
  ('550e8400-e29b-41d4-a716-446655440003', '觉醒导师', 'user3@example.com', 5, 156, 300),
  ('550e8400-e29b-41d4-a716-446655440004', '冥想爱好者', 'user4@example.com', 4, 89, 150),
  ('550e8400-e29b-41d4-a716-446655440005', 'Pro会员', 'pro@example.com', 6, 67, 200),
  ('550e8400-e29b-41d4-a716-446655440006', 'Premium会员', 'premium@example.com', 8, 123, 280)
ON CONFLICT (id) DO NOTHING;

-- 为所有用户创建免费订阅记录
INSERT INTO user_subscriptions (user_id, plan, is_active, expires_at)
SELECT id, 'free', true, NULL
FROM users 
ON CONFLICT (user_id) DO NOTHING;

-- 创建一些 Pro 和 Premium 用户示例
INSERT INTO user_subscriptions (user_id, plan, is_active, expires_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440005', 'pro', true, NOW() + INTERVAL '30 days'),
  ('550e8400-e29b-41d4-a716-446655440006', 'premium', true, NOW() + INTERVAL '90 days')
ON CONFLICT (user_id) DO UPDATE SET
  plan = EXCLUDED.plan,
  is_active = EXCLUDED.is_active,
  expires_at = EXCLUDED.expires_at;

-- 插入示例社区帖子
INSERT INTO community_posts (user_id, content, likes_count, comments_count, shares_count) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '今天是我戒色的第30天，感觉精力充沛，注意力也提高了很多。坚持就是胜利！💪', 42, 8, 3),
  ('550e8400-e29b-41d4-a716-446655440002', '刚开始戒色，前两天还好，今天突然感觉很难受，有没有过来人分享一下如何度过最初的戒断反应？🤔', 18, 24, 1),
  ('550e8400-e29b-41d4-a716-446655440003', '分享一个实用技巧：当你有冲动的时候，立即做10个深蹲或20个俯卧撑，把能量转化为锻炼，效果非常好！🏃‍♂️', 156, 32, 47),
  ('550e8400-e29b-41d4-a716-446655440004', '每天坚持20分钟冥想，对我的戒色之旅帮助很大。分享我的冥想音乐和方法，希望对大家有帮助。🧘‍♂️', 89, 15, 12),
  ('550e8400-e29b-41d4-a716-446655440005', '作为Pro会员，我想分享一些高级技巧：制定详细的日程安排，用积极的活动填满你的时间。✨', 67, 19, 8),
  ('550e8400-e29b-41d4-a716-446655440006', 'Premium会员专享：今天参加了一对一指导课程，导师给了很多个性化建议，感觉收获满满！🎯', 98, 25, 15)
ON CONFLICT DO NOTHING;

-- 插入示例成就数据
INSERT INTO achievements (user_id, achievement_type, achievement_name, completed, completed_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'streak', '坚持一周', true, NOW() - INTERVAL '20 days'),
  ('550e8400-e29b-41d4-a716-446655440001', 'checkin', '连续打卡30天', false, NULL),
  ('550e8400-e29b-41d4-a716-446655440001', 'social', '分享3篇心得', true, NOW() - INTERVAL '10 days'),
  ('550e8400-e29b-41d4-a716-446655440003', 'streak', '坚持100天', true, NOW() - INTERVAL '56 days'),
  ('550e8400-e29b-41d4-a716-446655440003', 'social', '获得100个赞', true, NOW() - INTERVAL '30 days'),
  ('550e8400-e29b-41d4-a716-446655440004', 'meditation', '完成冥想课程', true, NOW() - INTERVAL '15 days'),
  ('550e8400-e29b-41d4-a716-446655440005', 'streak', '坚持50天', true, NOW() - INTERVAL '17 days'),
  ('550e8400-e29b-41d4-a716-446655440006', 'streak', '坚持120天', true, NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;

-- 插入示例每日打卡数据
INSERT INTO daily_checkins (user_id, date, mood, had_urges, relapsed, exercised, had_brain_fog, sleep_hours, sleep_quality, notes) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE, 'good', 'mild', false, true, 'none', 7.5, 'good', '今天状态不错，完成了所有计划的任务'),
  ('550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE - INTERVAL '1 day', 'excellent', 'none', false, true, 'mild', 8.0, 'excellent', '非常好的一天，精力充沛'),
  ('550e8400-e29b-41d4-a716-446655440002', CURRENT_DATE, 'okay', 'moderate', false, false, 'moderate', 6.5, 'okay', '今天有些困难，但还是坚持住了'),
  ('550e8400-e29b-41d4-a716-446655440003', CURRENT_DATE, 'excellent', 'none', false, true, 'none', 8.5, 'excellent', '又是充满活力的一天！'),
  ('550e8400-e29b-41d4-a716-446655440004', CURRENT_DATE, 'good', 'mild', false, true, 'mild', 7.0, 'good', '冥想后感觉很平静'),
  ('550e8400-e29b-41d4-a716-446655440005', CURRENT_DATE, 'excellent', 'none', false, true, 'none', 8.0, 'excellent', 'Pro会员的自定义提醒很有用'),
  ('550e8400-e29b-41d4-a716-446655440006', CURRENT_DATE, 'excellent', 'none', false, true, 'none', 8.5, 'excellent', 'Premium指导课程效果显著')
ON CONFLICT (user_id, date) DO NOTHING;

-- 插入一些点赞数据
INSERT INTO post_likes (user_id, post_id) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM community_posts WHERE content LIKE '%实用技巧%' LIMIT 1)),
  ('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM community_posts WHERE content LIKE '%实用技巧%' LIMIT 1)),
  ('550e8400-e29b-41d4-a716-446655440004', (SELECT id FROM community_posts WHERE content LIKE '%冥想%' LIMIT 1)),
  ('550e8400-e29b-41d4-a716-446655440005', (SELECT id FROM community_posts WHERE content LIKE '%Premium%' LIMIT 1))
ON CONFLICT (user_id, post_id) DO NOTHING;

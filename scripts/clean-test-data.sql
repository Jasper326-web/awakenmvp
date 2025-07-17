-- 添加测试用户和数据
-- 创建测试用户
INSERT INTO users (id, username, email, current_streak, total_days, level, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', 'TestUser1', 'test1@example.com', 15, 30, 2, NOW() - INTERVAL '30 days', NOW()),
('22222222-2222-2222-2222-222222222222', 'TestUser2', 'test2@example.com', 8, 25, 2, NOW() - INTERVAL '25 days', NOW()),
('33333333-3333-3333-3333-333333333333', 'TestUser3', 'test3@example.com', 22, 45, 3, NOW() - INTERVAL '45 days', NOW()),
('44444444-4444-4444-4444-444444444444', 'TestUser4', 'test4@example.com', 5, 12, 1, NOW() - INTERVAL '12 days', NOW()),
('55555555-5555-5555-5555-555555555555', 'ProUser', 'pro@example.com', 35, 60, 4, NOW() - INTERVAL '60 days', NOW());

-- 为Pro用户添加会员订阅
INSERT INTO user_subscriptions (user_id, plan, is_active, expires_at, created_at) VALUES
('55555555-5555-5555-5555-555555555555', 'pro', true, NOW() + INTERVAL '30 days', NOW());

-- 添加一些打卡记录
INSERT INTO daily_checkins (user_id, date, relapsed, completed_plan, notes) VALUES
('11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '1 day', false, true, '坚持第15天'),
('22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '1 day', false, true, '感觉不错'),
('33333333-3333-3333-3333-333333333333', CURRENT_DATE - INTERVAL '1 day', false, true, '继续努力'),
('44444444-4444-4444-4444-444444444444', CURRENT_DATE - INTERVAL '2 days', false, false, '有点困难'),
('55555555-5555-5555-5555-555555555555', CURRENT_DATE - INTERVAL '1 day', false, true, 'Pro会员坚持中');

-- 查看创建的数据
SELECT 'Users created:' as info;
SELECT username, current_streak, total_days, level FROM users ORDER BY current_streak DESC;

SELECT 'Subscriptions created:' as info;
SELECT u.username, s.plan, s.is_active, s.expires_at 
FROM user_subscriptions s 
JOIN users u ON s.user_id = u.id;

SELECT 'Check-ins created:' as info;
SELECT u.username, c.date, c.relapsed, c.completed_plan 
FROM daily_checkins c 
JOIN users u ON c.user_id = u.id 
ORDER BY c.date DESC;

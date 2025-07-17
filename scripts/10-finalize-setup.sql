-- 更新所有用户的统计信息
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM users LOOP
    PERFORM update_user_stats(user_record.id);
  END LOOP;
END $$;

-- 验证数据完整性
DO $$
DECLARE
  user_count INTEGER;
  subscription_count INTEGER;
  checkin_count INTEGER;
  post_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM users;
  SELECT COUNT(*) INTO subscription_count FROM user_subscriptions;
  SELECT COUNT(*) INTO checkin_count FROM daily_checkins;
  SELECT COUNT(*) INTO post_count FROM community_posts;
  
  RAISE NOTICE '数据库初始化完成！';
  RAISE NOTICE '用户数量: %', user_count;
  RAISE NOTICE '订阅记录: %', subscription_count;
  RAISE NOTICE '打卡记录: %', checkin_count;
  RAISE NOTICE '社区帖子: %', post_count;
  
  -- 验证会员功能
  IF EXISTS (SELECT 1 FROM user_profiles WHERE is_pro = true) THEN
    RAISE NOTICE '✅ Pro会员功能已启用';
  END IF;
  
  IF EXISTS (SELECT 1 FROM user_profiles WHERE is_premium = true) THEN
    RAISE NOTICE '✅ Premium会员功能已启用';
  END IF;
END $$;

-- 创建定期维护任务（可选）
-- 注意：这需要 pg_cron 扩展，如果 Supabase 不支持，可以通过应用层定期调用
-- SELECT cron.schedule('expire-subscriptions', '0 0 * * *', 'SELECT expire_subscriptions();');

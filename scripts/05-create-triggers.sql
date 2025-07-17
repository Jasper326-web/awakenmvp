-- 为需要的表添加更新时间触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON community_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建触发器：当插入或更新打卡记录时自动更新用户统计
CREATE OR REPLACE FUNCTION trigger_update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_user_stats(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stats_on_checkin
  AFTER INSERT OR UPDATE ON daily_checkins
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_user_stats();

-- 创建订阅状态验证触发器
CREATE OR REPLACE FUNCTION validate_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- 确保过期时间合理
  IF NEW.expires_at IS NOT NULL AND NEW.expires_at <= NOW() THEN
    NEW.is_active := FALSE;
  END IF;
  
  -- 免费计划不应该有过期时间
  IF NEW.plan = 'free' THEN
    NEW.expires_at := NULL;
  END IF;
  
  -- 更新时间戳
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_subscription_trigger
  BEFORE INSERT OR UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION validate_subscription();

-- 创建订阅历史记录触发器
CREATE OR REPLACE FUNCTION log_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
  -- 记录订阅变更
  IF TG_OP = 'INSERT' THEN
    INSERT INTO subscription_history (user_id, plan, action, created_at)
    VALUES (NEW.user_id, NEW.plan, 'subscribe', NOW());
  ELSIF TG_OP = 'UPDATE' THEN
    -- 如果计划改变
    IF OLD.plan != NEW.plan THEN
      INSERT INTO subscription_history (user_id, plan, action, created_at)
      VALUES (NEW.user_id, NEW.plan, 
        CASE 
          WHEN NEW.plan = 'free' THEN 'downgrade'
          WHEN OLD.plan = 'free' THEN 'upgrade'
          ELSE 'upgrade'
        END, 
        NOW());
    END IF;
    
    -- 如果取消订阅
    IF OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
      INSERT INTO subscription_history (user_id, plan, action, created_at)
      VALUES (NEW.user_id, NEW.plan, 'cancel', NOW());
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_subscription_change_trigger
  AFTER INSERT OR UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION log_subscription_change();

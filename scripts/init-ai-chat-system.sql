-- AI聊天系统完整初始化脚本
-- 此脚本将创建所有必要的表和功能来支持AI助教聊天和使用次数跟踪

-- 1. 创建聊天日志表
CREATE TABLE IF NOT EXISTS chat_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  user_type TEXT NOT NULL DEFAULT 'free', -- 'free' 或 'premium'
  conversation_id TEXT, -- 对话ID，用于分组对话历史
  usage_date DATE DEFAULT CURRENT_DATE, -- 使用日期，用于按日期统计
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建用户偏好表
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_activities TEXT[], -- 用户喜欢的活动
  main_concerns TEXT[], -- 用户主要关注的问题
  goals TEXT[], -- 用户的目标
  personality_type TEXT, -- 性格类型
  communication_style TEXT, -- 沟通风格偏好
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_chat_logs_user_id ON chat_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_logs_created_at ON chat_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_logs_conversation_id ON chat_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_logs_user_usage_date ON chat_logs(user_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- 4. 启用RLS
ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- 5. 创建RLS策略
-- 聊天日志策略
CREATE POLICY "Users can view their own chat logs" ON chat_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat logs" ON chat_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户偏好策略
CREATE POLICY "Users can view their own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- 6. 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. 创建触发器
CREATE TRIGGER update_chat_logs_updated_at 
  BEFORE UPDATE ON chat_logs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at 
  BEFORE UPDATE ON user_preferences 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 8. 创建使用次数跟踪函数
-- 获取用户今日已使用的AI消息次数
CREATE OR REPLACE FUNCTION get_user_daily_ai_usage(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    usage_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO usage_count
    FROM chat_logs
    WHERE user_id = user_uuid 
    AND usage_date = CURRENT_DATE;
    
    RETURN COALESCE(usage_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 检查用户是否可以发送AI消息
CREATE OR REPLACE FUNCTION can_user_send_ai_message(user_uuid UUID, user_type TEXT)
RETURNS JSON AS $$
DECLARE
    current_usage INTEGER;
    max_usage INTEGER;
    can_send BOOLEAN;
    remaining_count INTEGER;
BEGIN
    -- 获取当前使用次数
    current_usage := get_user_daily_ai_usage(user_uuid);
    
    -- 根据用户类型设置最大使用次数
    IF user_type = 'premium' OR user_type = 'pro' THEN
        max_usage := 999999; -- 付费用户无限制
    ELSE
        max_usage := 5; -- 免费用户每日5条
    END IF;
    
    -- 检查是否可以发送
    can_send := current_usage < max_usage;
    remaining_count := GREATEST(0, max_usage - current_usage);
    
    RETURN json_build_object(
        'can_send', can_send,
        'current_usage', current_usage,
        'max_usage', max_usage,
        'remaining_count', remaining_count,
        'user_type', user_type
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取用户AI使用统计信息
CREATE OR REPLACE FUNCTION get_user_ai_usage_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    today_usage INTEGER;
    total_usage INTEGER;
    weekly_usage INTEGER;
    monthly_usage INTEGER;
    user_type TEXT;
BEGIN
    -- 获取今日使用次数
    SELECT COUNT(*) INTO today_usage
    FROM chat_logs
    WHERE user_id = user_uuid 
    AND usage_date = CURRENT_DATE;
    
    -- 获取总使用次数
    SELECT COUNT(*) INTO total_usage
    FROM chat_logs
    WHERE user_id = user_uuid;
    
    -- 获取本周使用次数
    SELECT COUNT(*) INTO weekly_usage
    FROM chat_logs
    WHERE user_id = user_uuid 
    AND usage_date >= CURRENT_DATE - INTERVAL '7 days';
    
    -- 获取本月使用次数
    SELECT COUNT(*) INTO monthly_usage
    FROM chat_logs
    WHERE user_id = user_uuid 
    AND usage_date >= CURRENT_DATE - INTERVAL '30 days';
    
    -- 获取用户类型（从user_subscriptions表，如果存在）
    -- 修改逻辑：允许已取消但未过期的订阅
    SELECT subscription_type INTO user_type
    FROM user_subscriptions
    WHERE user_id = user_uuid 
    AND (status = 'active' OR (status = 'cancelled' AND end_date > NOW()))
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF user_type IS NULL THEN
        user_type := 'free';
    END IF;
    
    RETURN json_build_object(
        'today_usage', COALESCE(today_usage, 0),
        'total_usage', COALESCE(total_usage, 0),
        'weekly_usage', COALESCE(weekly_usage, 0),
        'monthly_usage', COALESCE(monthly_usage, 0),
        'user_type', user_type,
        'max_daily_usage', CASE WHEN user_type IN ('premium', 'pro') THEN 999999 ELSE 5 END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 创建触发器：自动设置usage_date字段
CREATE OR REPLACE FUNCTION set_usage_date()
RETURNS TRIGGER AS $$
BEGIN
    NEW.usage_date = CURRENT_DATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_chat_logs_usage_date
    BEFORE INSERT ON chat_logs
    FOR EACH ROW
    EXECUTE FUNCTION set_usage_date();

-- 10. 创建用户记忆查询函数
CREATE OR REPLACE FUNCTION get_user_memory(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'profile', (
      SELECT json_build_object(
        'full_name', p.full_name,
        'current_streak', p.current_streak,
        'max_streak', p.max_streak,
        'total_checkins', p.total_checkins,
        'level', p.level
      )
      FROM profiles p
      WHERE p.id = user_uuid
    ),
    'recent_chats', (
      SELECT json_agg(
        json_build_object(
          'message', cl.message,
          'response', cl.response,
          'created_at', cl.created_at
        )
      )
      FROM chat_logs cl
      WHERE cl.user_id = user_uuid
      ORDER BY cl.created_at DESC
      LIMIT 10
    ),
    'preferences', (
      SELECT json_build_object(
        'preferred_activities', up.preferred_activities,
        'main_concerns', up.main_concerns,
        'goals', up.goals,
        'personality_type', up.personality_type,
        'communication_style', up.communication_style
      )
      FROM user_preferences up
      WHERE up.user_id = user_uuid
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. 添加注释
COMMENT ON TABLE chat_logs IS 'AI助教聊天日志表';
COMMENT ON COLUMN chat_logs.user_id IS '用户ID';
COMMENT ON COLUMN chat_logs.message IS '用户消息';
COMMENT ON COLUMN chat_logs.response IS 'AI回复';
COMMENT ON COLUMN chat_logs.user_type IS '用户类型：free或premium';
COMMENT ON COLUMN chat_logs.conversation_id IS '对话ID，用于分组对话历史';
COMMENT ON COLUMN chat_logs.usage_date IS '使用日期，用于按日期统计使用次数';
COMMENT ON COLUMN chat_logs.created_at IS '创建时间';
COMMENT ON COLUMN chat_logs.updated_at IS '更新时间';

COMMENT ON TABLE user_preferences IS '用户偏好和个性化信息表';
COMMENT ON COLUMN user_preferences.user_id IS '用户ID';
COMMENT ON COLUMN user_preferences.preferred_activities IS '用户喜欢的活动列表';
COMMENT ON COLUMN user_preferences.main_concerns IS '用户主要关注的问题列表';
COMMENT ON COLUMN user_preferences.goals IS '用户的目标列表';
COMMENT ON COLUMN user_preferences.personality_type IS '性格类型';
COMMENT ON COLUMN user_preferences.communication_style IS '沟通风格偏好';
COMMENT ON COLUMN user_preferences.created_at IS '创建时间';
COMMENT ON COLUMN user_preferences.updated_at IS '更新时间';

COMMENT ON FUNCTION get_user_daily_ai_usage(UUID) IS '获取用户今日AI使用次数';
COMMENT ON FUNCTION can_user_send_ai_message(UUID, TEXT) IS '检查用户是否可以发送AI消息';
COMMENT ON FUNCTION get_user_ai_usage_stats(UUID) IS '获取用户AI使用统计信息';
COMMENT ON FUNCTION get_user_memory(UUID) IS '获取用户记忆信息（档案、对话历史、偏好）';

-- 12. 验证脚本执行
SELECT 'AI chat system initialized successfully' as status; 
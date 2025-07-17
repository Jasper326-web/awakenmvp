-- AI助教记忆系统完整设置脚本
-- 执行此脚本将创建所有必要的表和功能

-- 1. 创建聊天日志表
CREATE TABLE IF NOT EXISTS chat_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  user_type TEXT NOT NULL DEFAULT 'free', -- 'free' 或 'premium'
  conversation_id TEXT, -- 对话ID，用于分组对话历史
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

-- 6. 创建更新时间触发器函数（如果不存在）
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

-- 8. 添加注释
COMMENT ON TABLE chat_logs IS 'AI助教聊天日志表';
COMMENT ON COLUMN chat_logs.user_id IS '用户ID';
COMMENT ON COLUMN chat_logs.message IS '用户消息';
COMMENT ON COLUMN chat_logs.response IS 'AI回复';
COMMENT ON COLUMN chat_logs.user_type IS '用户类型：free或premium';
COMMENT ON COLUMN chat_logs.conversation_id IS '对话ID，用于分组对话历史';
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

-- 9. 创建用户记忆查询函数
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

-- 10. 创建用户偏好更新函数
CREATE OR REPLACE FUNCTION update_user_preferences(
  user_uuid UUID,
  activities TEXT[],
  concerns TEXT[],
  goals TEXT[]
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO user_preferences (user_id, preferred_activities, main_concerns, goals)
  VALUES (user_uuid, activities, concerns, goals)
  ON CONFLICT (user_id)
  DO UPDATE SET
    preferred_activities = array_cat(user_preferences.preferred_activities, EXCLUDED.preferred_activities),
    main_concerns = array_cat(user_preferences.main_concerns, EXCLUDED.main_concerns),
    goals = array_cat(user_preferences.goals, EXCLUDED.goals),
    updated_at = NOW();
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 完成提示
SELECT 'AI助教记忆系统设置完成！' as status; 
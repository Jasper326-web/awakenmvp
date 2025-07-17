-- 创建用户偏好表
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

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- 启用RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Users can view their own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- 创建更新时间触发器
CREATE TRIGGER update_user_preferences_updated_at 
  BEFORE UPDATE ON user_preferences 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 添加注释
COMMENT ON TABLE user_preferences IS '用户偏好和个性化信息表';
COMMENT ON COLUMN user_preferences.user_id IS '用户ID';
COMMENT ON COLUMN user_preferences.preferred_activities IS '用户喜欢的活动列表';
COMMENT ON COLUMN user_preferences.main_concerns IS '用户主要关注的问题列表';
COMMENT ON COLUMN user_preferences.goals IS '用户的目标列表';
COMMENT ON COLUMN user_preferences.personality_type IS '性格类型';
COMMENT ON COLUMN user_preferences.communication_style IS '沟通风格偏好';
COMMENT ON COLUMN user_preferences.created_at IS '创建时间';
COMMENT ON COLUMN user_preferences.updated_at IS '更新时间'; 
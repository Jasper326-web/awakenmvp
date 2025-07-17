-- 创建聊天日志表
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

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_chat_logs_user_id ON chat_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_logs_created_at ON chat_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_logs_conversation_id ON chat_logs(conversation_id);

-- 启用RLS
ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Users can view their own chat logs" ON chat_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat logs" ON chat_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chat_logs_updated_at 
  BEFORE UPDATE ON chat_logs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 添加注释
COMMENT ON TABLE chat_logs IS 'AI助教聊天日志表';
COMMENT ON COLUMN chat_logs.user_id IS '用户ID';
COMMENT ON COLUMN chat_logs.message IS '用户消息';
COMMENT ON COLUMN chat_logs.response IS 'AI回复';
COMMENT ON COLUMN chat_logs.user_type IS '用户类型：free或premium';
COMMENT ON COLUMN chat_logs.conversation_id IS '对话ID，用于分组对话历史';
COMMENT ON COLUMN chat_logs.created_at IS '创建时间';
COMMENT ON COLUMN chat_logs.updated_at IS '更新时间'; 
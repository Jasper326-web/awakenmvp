-- 创建社区帖子表
CREATE TABLE IF NOT EXISTS community_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) <= 300),
    media_url TEXT,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建帖子点赞记录表（如果不存在）
CREATE TABLE IF NOT EXISTS post_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- 创建索引提高查询性能
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_community_posts_updated_at 
    BEFORE UPDATE ON community_posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建RLS策略
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- 任何人都可以查看帖子
CREATE POLICY "Anyone can view posts" ON community_posts FOR SELECT USING (true);

-- 只有认证用户可以创建帖子
CREATE POLICY "Authenticated users can create posts" ON community_posts FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的帖子
CREATE POLICY "Users can update own posts" ON community_posts FOR UPDATE 
    USING (auth.uid() = user_id);

-- 用户只能删除自己的帖子
CREATE POLICY "Users can delete own posts" ON community_posts FOR DELETE 
    USING (auth.uid() = user_id);

-- 点赞策略
CREATE POLICY "Anyone can view likes" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage likes" ON post_likes FOR ALL 
    USING (auth.uid() = user_id);

-- 插入一些示例数据
INSERT INTO community_posts (user_id, content, likes_count, created_at) VALUES
    ((SELECT id FROM users LIMIT 1), '今天是我戒色的第30天，感觉精力充沛，注意力也提高了很多。坚持就是胜利！💪', 42, NOW() - INTERVAL '2 hours'),
    ((SELECT id FROM users LIMIT 1), '刚开始戒色，前两天还好，今天突然感觉很难受，有没有过来人分享一下如何度过最初的戒断反应？', 18, NOW() - INTERVAL '5 hours'),
    ((SELECT id FROM users LIMIT 1), '分享一个实用技巧：当你有冲动的时候，立即做10个深蹲或20个俯卧撑，把能量转化为锻炼，效果非常好！🏃‍♂️', 156, NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

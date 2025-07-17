-- 重命名现有的achievements表以避免冲突
ALTER TABLE IF EXISTS achievements RENAME TO old_achievements_backup;

-- 创建正确的成就定义表
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL,
    achievement_type VARCHAR(50) NOT NULL CHECK (achievement_type IN ('streak', 'video', 'log', 'community', 'challenge', 'special')),
    icon_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建用户成就关联表
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_displayed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_is_displayed ON user_achievements(is_displayed);
CREATE INDEX IF NOT EXISTS idx_achievements_type ON achievements(achievement_type);
CREATE INDEX IF NOT EXISTS idx_achievements_is_active ON achievements(is_active);

-- 插入示例成就数据
INSERT INTO achievements (name, description, achievement_type, icon_url, is_active)
VALUES
    ('戒色菜鸟', '连续守戒 3 天', 'streak', '/icons/achievements/rookie.svg', TRUE),
    ('戒色新兵', '连续守戒 7 天', 'streak', '/icons/achievements/recruit.svg', TRUE),
    ('戒色猛士', '连续守戒 14 天', 'streak', '/icons/achievements/warrior.svg', TRUE),
    ('戒色勇士', '连续守戒 30 天', 'streak', '/icons/achievements/hero.svg', TRUE),
    ('戒色大师', '连续守戒 90 天', 'streak', '/icons/achievements/master.svg', TRUE),
    ('戒色宗师', '连续守戒 180 天', 'streak', '/icons/achievements/grandmaster.svg', TRUE),
    ('戒色传奇', '连续守戒 365 天', 'streak', '/icons/achievements/legend.svg', TRUE),
    ('初试Vlog', '连续上传视频 3 天', 'video', '/icons/achievements/first_vlog.svg', TRUE),
    ('视频达人', '连续上传视频 7 天', 'video', '/icons/achievements/video_expert.svg', TRUE),
    ('反思者', '填写第一篇日志', 'log', '/icons/achievements/reflector.svg', TRUE),
    ('日志达人', '连续填写日志 7 天', 'log', '/icons/achievements/journal_expert.svg', TRUE),
    ('初次发言', '发布首条社区动态', 'community', '/icons/achievements/first_post.svg', TRUE),
    ('社区活跃者', '在社区发布 10 条动态', 'community', '/icons/achievements/community_active.svg', TRUE),
    ('重启人生', '破戒3次后重新守戒成功7天', 'challenge', '/icons/achievements/restart.svg', TRUE),
    ('坚韧不拔', '经历5次破戒后达成30天连续守戒', 'challenge', '/icons/achievements/perseverance.svg', TRUE),
    ('早起打卡', '连续7天在早上8点前完成打卡', 'special', '/icons/achievements/early_bird.svg', TRUE),
    ('全勤奖', '连续30天每天都完成所有任务', 'special', '/icons/achievements/perfect_attendance.svg', TRUE);

-- 创建函数：检查并限制每个用户最多展示3个成就
CREATE OR REPLACE FUNCTION check_displayed_achievements()
RETURNS TRIGGER AS $$
BEGIN
    -- 如果新记录设置为展示
    IF NEW.is_displayed = TRUE THEN
        -- 检查该用户已展示的成就数量
        IF (SELECT COUNT(*) FROM user_achievements 
            WHERE user_id = NEW.user_id AND is_displayed = TRUE) >= 3 THEN
            -- 如果已有3个展示的成就，则不允许再设置新的展示成就
            RAISE EXCEPTION '每个用户最多只能展示3个成就';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：限制每个用户最多展示3个成就
DROP TRIGGER IF EXISTS limit_displayed_achievements ON user_achievements;
CREATE TRIGGER limit_displayed_achievements
BEFORE INSERT OR UPDATE ON user_achievements
FOR EACH ROW
EXECUTE FUNCTION check_displayed_achievements();

-- 创建函数：自动检查并授予连续守戒成就
CREATE OR REPLACE FUNCTION check_streak_achievements()
RETURNS TRIGGER AS $$
DECLARE
    streak_days INTEGER;
    achievement_record RECORD;
BEGIN
    -- 获取用户当前的连续守戒天数
    SELECT current_streak INTO streak_days FROM users WHERE id = NEW.user_id;
    
    -- 检查并授予相应的成就
    FOR achievement_record IN 
        SELECT id, name FROM achievements 
        WHERE achievement_type = 'streak' AND is_active = TRUE
        AND (
            (name = '戒色菜鸟' AND streak_days >= 3) OR
            (name = '戒色新兵' AND streak_days >= 7) OR
            (name = '戒色猛士' AND streak_days >= 14) OR
            (name = '戒色勇士' AND streak_days >= 30) OR
            (name = '戒色大师' AND streak_days >= 90) OR
            (name = '戒色宗师' AND streak_days >= 180) OR
            (name = '戒色传奇' AND streak_days >= 365)
        )
    LOOP
        INSERT INTO user_achievements (user_id, achievement_id)
        VALUES (NEW.user_id, achievement_record.id)
        ON CONFLICT (user_id, achievement_id) DO NOTHING;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：当用户连续天数更新时检查成就
DROP TRIGGER IF EXISTS check_streak_achievements_trigger ON users;
CREATE TRIGGER check_streak_achievements_trigger
AFTER UPDATE OF current_streak ON users
FOR EACH ROW
WHEN (NEW.current_streak > OLD.current_streak)
EXECUTE FUNCTION check_streak_achievements();

-- 创建函数：检查并授予日志相关成就
CREATE OR REPLACE FUNCTION check_log_achievements()
RETURNS TRIGGER AS $$
DECLARE
    log_count INTEGER;
    achievement_id UUID;
BEGIN
    -- 检查是否是用户的第一篇日志
    SELECT COUNT(*) INTO log_count FROM daily_checkins 
    WHERE user_id = NEW.user_id AND notes IS NOT NULL AND notes != '';
    
    IF log_count = 1 THEN
        SELECT id INTO achievement_id FROM achievements WHERE name = '反思者' AND is_active = TRUE;
        IF achievement_id IS NOT NULL THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            VALUES (NEW.user_id, achievement_id)
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：当用户提交日志时检查成就
DROP TRIGGER IF EXISTS check_log_achievements_trigger ON daily_checkins;
CREATE TRIGGER check_log_achievements_trigger
AFTER INSERT OR UPDATE OF notes ON daily_checkins
FOR EACH ROW
WHEN (NEW.notes IS NOT NULL AND NEW.notes != '')
EXECUTE FUNCTION check_log_achievements();

-- 创建函数：检查并授予社区相关成就
CREATE OR REPLACE FUNCTION check_community_achievements()
RETURNS TRIGGER AS $$
DECLARE
    post_count INTEGER;
    achievement_id UUID;
BEGIN
    -- 检查是否是用户的第一条社区动态
    SELECT COUNT(*) INTO post_count FROM community_posts WHERE user_id = NEW.user_id;
    
    IF post_count = 1 THEN
        SELECT id INTO achievement_id FROM achievements WHERE name = '初次发言' AND is_active = TRUE;
        IF achievement_id IS NOT NULL THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            VALUES (NEW.user_id, achievement_id)
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
        END IF;
    END IF;
    
    IF post_count = 10 THEN
        SELECT id INTO achievement_id FROM achievements WHERE name = '社区活跃者' AND is_active = TRUE;
        IF achievement_id IS NOT NULL THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            VALUES (NEW.user_id, achievement_id)
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：当用户发布社区动态时检查成就
DROP TRIGGER IF EXISTS check_community_achievements_trigger ON community_posts;
CREATE TRIGGER check_community_achievements_trigger
AFTER INSERT ON community_posts
FOR EACH ROW
EXECUTE FUNCTION check_community_achievements();

-- 设置行级安全策略
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- 创建策略：所有用户可以查看所有成就
CREATE POLICY achievements_select_policy ON achievements
    FOR SELECT USING (true);

-- 创建策略：用户只能查看自己的成就
CREATE POLICY user_achievements_select_policy ON user_achievements
    FOR SELECT USING (auth.uid() = user_id);

-- 创建策略：用户只能更新自己的成就展示状态
CREATE POLICY user_achievements_update_policy ON user_achievements
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 创建函数：获取用户所有成就（包括未解锁的）
CREATE OR REPLACE FUNCTION get_user_achievements(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    description VARCHAR,
    achievement_type VARCHAR,
    icon_url VARCHAR,
    is_unlocked BOOLEAN,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    is_displayed BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.name,
        a.description,
        a.achievement_type,
        a.icon_url,
        CASE WHEN ua.id IS NOT NULL THEN TRUE ELSE FALSE END AS is_unlocked,
        ua.unlocked_at,
        COALESCE(ua.is_displayed, FALSE) AS is_displayed
    FROM 
        achievements a
    LEFT JOIN 
        user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = p_user_id
    WHERE 
        a.is_active = TRUE
    ORDER BY 
        a.achievement_type, 
        CASE WHEN ua.id IS NOT NULL THEN 0 ELSE 1 END, -- 已解锁的排在前面
        a.name;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：切换成就展示状态
CREATE OR REPLACE FUNCTION toggle_achievement_display(p_user_id UUID, p_achievement_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_displayed BOOLEAN;
    v_displayed_count INTEGER;
BEGIN
    -- 检查成就是否已解锁
    IF NOT EXISTS (
        SELECT 1 FROM user_achievements 
        WHERE user_id = p_user_id AND achievement_id = p_achievement_id
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- 获取当前展示状态
    SELECT is_displayed INTO v_is_displayed
    FROM user_achievements
    WHERE user_id = p_user_id AND achievement_id = p_achievement_id;
    
    -- 如果当前未展示，检查已展示数量
    IF NOT v_is_displayed THEN
        SELECT COUNT(*) INTO v_displayed_count
        FROM user_achievements
        WHERE user_id = p_user_id AND is_displayed = TRUE;
        
        IF v_displayed_count >= 3 THEN
            RETURN FALSE; -- 已达到最大展示数量
        END IF;
    END IF;
    
    -- 切换展示状态
    UPDATE user_achievements
    SET is_displayed = NOT v_is_displayed,
        updated_at = NOW()
    WHERE user_id = p_user_id AND achievement_id = p_achievement_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

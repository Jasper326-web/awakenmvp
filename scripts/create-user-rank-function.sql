-- 🎯 创建获取用户排名的函数
CREATE OR REPLACE FUNCTION get_user_rank(user_id UUID)
RETURNS TABLE(
    id UUID,
    username TEXT,
    current_streak INTEGER,
    avatar_url TEXT,
    rank BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH ranked_users AS (
        SELECT 
            u.id,
            u.username,
            u.current_streak,
            u.avatar_url,
            ROW_NUMBER() OVER (ORDER BY u.current_streak DESC) as rank
        FROM users u
        WHERE u.username IS NOT NULL
    )
    SELECT * FROM ranked_users WHERE ranked_users.id = user_id;
END;
$$ LANGUAGE plpgsql;

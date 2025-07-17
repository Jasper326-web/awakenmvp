-- 创建会员激活码表
CREATE TABLE IF NOT EXISTS membership_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    user_id UUID REFERENCES auth.users(id),
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为用户表添加会员相关字段
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_member BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS membership_expiry TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS membership_activated_at TIMESTAMP WITH TIME ZONE;

-- 创建激活会员的RPC函数
CREATE OR REPLACE FUNCTION activate_user_membership(
    p_code TEXT,
    p_user_id UUID,
    p_expiry_date TIMESTAMP WITH TIME ZONE
) RETURNS VOID AS $$
BEGIN
    -- 更新激活码状态
    UPDATE membership_codes 
    SET used = TRUE, 
        user_id = p_user_id, 
        used_at = NOW()
    WHERE code = p_code AND used = FALSE;
    
    -- 检查是否成功更新激活码
    IF NOT FOUND THEN
        RAISE EXCEPTION '激活码无效或已被使用';
    END IF;
    
    -- 更新用户会员状态
    UPDATE users 
    SET is_member = TRUE,
        membership_expiry = p_expiry_date,
        membership_activated_at = NOW()
    WHERE id = p_user_id;
    
    -- 检查是否成功更新用户
    IF NOT FOUND THEN
        RAISE EXCEPTION '用户不存在';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 插入一些测试激活码
INSERT INTO membership_codes (code) VALUES 
('AWAKEN2024'),
('MEMBER001'),
('VIP12345'),
('PREMIUM99'),
('ACTIVATE1')
ON CONFLICT (code) DO NOTHING;

-- 设置RLS策略
ALTER TABLE membership_codes ENABLE ROW LEVEL SECURITY;

-- 只允许通过API访问激活码表
CREATE POLICY "Service role can manage membership codes" ON membership_codes
    FOR ALL USING (auth.role() = 'service_role');

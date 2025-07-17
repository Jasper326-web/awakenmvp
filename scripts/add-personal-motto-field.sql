-- 添加个人签名宣言字段
-- 此脚本为users表添加personal_motto字段

-- 1. 添加personal_motto字段
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS personal_motto TEXT;

-- 2. 添加注释
COMMENT ON COLUMN users.personal_motto IS '用户个人签名宣言';

-- 3. 验证字段是否添加成功
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'personal_motto';

-- 4. 显示验证结果
SELECT 'personal_motto field added successfully' as status; 
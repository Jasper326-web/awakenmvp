-- 修复user_subscriptions表的RLS策略
-- 这个脚本用于确保webhook和API可以正确插入订阅记录

-- 1. 检查当前的RLS策略
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'user_subscriptions';

-- 2. 删除现有的RLS策略（如果存在）
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "user_subscriptions";
DROP POLICY IF EXISTS "Enable select for users based on user_id" ON "user_subscriptions";
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON "user_subscriptions";
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON "user_subscriptions";

-- 3. 创建新的RLS策略
-- 允许用户插入自己的订阅记录
CREATE POLICY "Enable insert for authenticated users only" ON "user_subscriptions"
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 允许用户查看自己的订阅记录
CREATE POLICY "Enable select for users based on user_id" ON "user_subscriptions"
    FOR SELECT 
    TO authenticated
    USING (auth.uid() = user_id);

-- 允许用户更新自己的订阅记录
CREATE POLICY "Enable update for users based on user_id" ON "user_subscriptions"
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 允许用户删除自己的订阅记录
CREATE POLICY "Enable delete for users based on user_id" ON "user_subscriptions"
    FOR DELETE 
    TO authenticated
    USING (auth.uid() = user_id);

-- 4. 确保RLS已启用
ALTER TABLE "user_subscriptions" ENABLE ROW LEVEL SECURITY;

-- 5. 验证策略是否创建成功
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'user_subscriptions'
ORDER BY policyname;

-- 6. 测试插入（可选）
-- INSERT INTO "user_subscriptions" (
--     user_id,
--     subscription_type,
--     status,
--     created_at,
--     updated_at,
--     end_date
-- ) VALUES (
--     'test-user-id',
--     'premium',
--     'active',
--     NOW(),
--     NOW(),
--     NOW() + INTERVAL '30 days'
-- ); 
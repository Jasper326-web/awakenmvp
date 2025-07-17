-- 检查addiction_tests表是否存在
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'addiction_tests' 
ORDER BY ordinal_position;

-- 检查user_plans表是否存在
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_plans' 
ORDER BY ordinal_position;

-- 检查daily_plan_progress表是否存在
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'daily_plan_progress' 
ORDER BY ordinal_position;

-- 查看现有的测试记录
SELECT * FROM addiction_tests ORDER BY created_at DESC LIMIT 5;

-- 查看现有的用户计划
SELECT * FROM user_plans ORDER BY created_at DESC LIMIT 5;

-- 检查achievements表是否存在以及其结构
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'achievements';

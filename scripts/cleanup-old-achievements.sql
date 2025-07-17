-- 删除旧的成就表备份
DROP TABLE IF EXISTS old_achievements_backup CASCADE;

-- 验证删除结果
SELECT 
    table_name,
    table_type
FROM 
    information_schema.tables 
WHERE 
    table_schema = 'public' 
    AND table_name LIKE '%achievement%'
ORDER BY 
    table_name;

-- 修复为中国时区 (Asia/Shanghai)
-- 删除之前的美国时区函数，重新创建中国时区函数

-- 删除现有函数
DROP FUNCTION IF EXISTS get_china_time();
DROP FUNCTION IF EXISTS format_china_datetime(timestamp with time zone);

-- 创建中国时区函数
CREATE OR REPLACE FUNCTION get_china_time()
RETURNS timestamp with time zone
LANGUAGE sql
STABLE
AS $$
  SELECT NOW() AT TIME ZONE 'Asia/Shanghai';
$$;

-- 创建中国时间格式化函数
CREATE OR REPLACE FUNCTION format_china_datetime(input_time timestamp with time zone)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT to_char(input_time AT TIME ZONE 'Asia/Shanghai', 'YYYY-MM-DD HH24:MI:SS');
$$;

-- 测试函数
SELECT 
  NOW() as utc_time,
  get_china_time() as china_time,
  format_china_datetime(NOW()) as formatted_china_time;

-- 查看用户表的中国时间
SELECT 
  username,
  email,
  updated_at AT TIME ZONE 'Asia/Shanghai' as china_update_time
FROM users 
ORDER BY updated_at DESC;

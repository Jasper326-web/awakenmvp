-- 测试中国时区
SELECT 
  NOW() as utc_time,
  NOW() AT TIME ZONE 'Asia/Shanghai' as china_time,
  to_char(NOW() AT TIME ZONE 'Asia/Shanghai', 'YYYY-MM-DD HH24:MI:SS') as formatted_china_time;

-- 查看用户表的时间
SELECT 
  username,
  email,
  updated_at as utc_time,
  updated_at AT TIME ZONE 'Asia/Shanghai' as china_time
FROM users 
ORDER BY updated_at DESC
LIMIT 5;

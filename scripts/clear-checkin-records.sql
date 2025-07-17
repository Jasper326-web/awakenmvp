-- 清空所有打卡记录
DELETE FROM daily_checkins;

-- 清空视频记录表（如果存在）
DELETE FROM video_records WHERE TRUE;

-- 重置序列（如果使用了自增ID）
ALTER SEQUENCE IF EXISTS daily_checkins_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS video_records_id_seq RESTART WITH 1;

-- 验证清空结果
SELECT 'daily_checkins' as table_name, COUNT(*) as record_count FROM daily_checkins
UNION ALL
SELECT 'video_records' as table_name, COUNT(*) as record_count FROM video_records;

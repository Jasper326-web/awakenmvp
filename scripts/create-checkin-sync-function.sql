-- 🔄 创建打卡与任务同步函数
CREATE OR REPLACE FUNCTION sync_checkin_tasks()
RETURNS TRIGGER AS $$
BEGIN
    -- 自动完成 checkin 类型任务
    INSERT INTO user_task_progress (user_id, task_id, completed, completed_at, task_type)
    SELECT 
        NEW.user_id,
        dpt.id,
        true,
        NOW(),
        'checkin'
    FROM daily_plan_tasks dpt
    WHERE dpt.task_type = 'checkin'
    AND NOT EXISTS (
        SELECT 1 FROM user_task_progress utp 
        WHERE utp.user_id = NEW.user_id 
        AND utp.task_id = dpt.id 
        AND DATE(utp.created_at) = NEW.date
    );
    
    -- 如果有日志，完成 journal 类型任务
    IF NEW.notes IS NOT NULL AND LENGTH(TRIM(NEW.notes)) > 0 THEN
        INSERT INTO user_task_progress (user_id, task_id, completed, completed_at, task_type)
        SELECT 
            NEW.user_id,
            dpt.id,
            true,
            NOW(),
            'journal'
        FROM daily_plan_tasks dpt
        WHERE dpt.task_type = 'journal'
        AND NOT EXISTS (
            SELECT 1 FROM user_task_progress utp 
            WHERE utp.user_id = NEW.user_id 
            AND utp.task_id = dpt.id 
            AND DATE(utp.created_at) = NEW.date
        );
    END IF;
    
    -- 如果有视频，完成 video 类型任务
    IF NEW.video_url IS NOT NULL AND LENGTH(TRIM(NEW.video_url)) > 0 THEN
        INSERT INTO user_task_progress (user_id, task_id, completed, completed_at, task_type)
        SELECT 
            NEW.user_id,
            dpt.id,
            true,
            NOW(),
            'video'
        FROM daily_plan_tasks dpt
        WHERE dpt.task_type = 'video'
        AND NOT EXISTS (
            SELECT 1 FROM user_task_progress utp 
            WHERE utp.user_id = NEW.user_id 
            AND utp.task_id = dpt.id 
            AND DATE(utp.created_at) = NEW.date
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_sync_checkin_tasks ON daily_checkins;
CREATE TRIGGER trigger_sync_checkin_tasks
    AFTER INSERT ON daily_checkins
    FOR EACH ROW
    EXECUTE FUNCTION sync_checkin_tasks();

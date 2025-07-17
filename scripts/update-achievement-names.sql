-- 更新成就名称为更积极和鼓舞性的中文名称

-- 检查成就表是否存在
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'achievements') THEN
    -- 更新连续打卡天数成就的名称
    UPDATE achievements SET name = '小试牛刀' WHERE achievement_type = 'streak' AND description LIKE '%3 天%';
    UPDATE achievements SET name = '初入道途' WHERE achievement_type = 'streak' AND description LIKE '%7 天%';
    UPDATE achievements SET name = '意志萌芽' WHERE achievement_type = 'streak' AND description LIKE '%14 天%';
    UPDATE achievements SET name = '心坚如石' WHERE achievement_type = 'streak' AND description LIKE '%30 天%';
    UPDATE achievements SET name = '志行百日' WHERE achievement_type = 'streak' AND description LIKE '%90 天%';
    UPDATE achievements SET name = '破而后立' WHERE achievement_type = 'streak' AND description LIKE '%180 天%';
    UPDATE achievements SET name = '心灵觉醒' WHERE achievement_type = 'streak' AND description LIKE '%365 天%';
    
    RAISE NOTICE '成就名称已成功更新';
  ELSE
    RAISE NOTICE '成就表不存在，请先创建成就系统';
  END IF;
END
$$;

-- 验证更新结果
SELECT id, name, description, achievement_type 
FROM achievements 
WHERE achievement_type = 'streak' 
ORDER BY CASE 
  WHEN description LIKE '%3 天%' THEN 1
  WHEN description LIKE '%7 天%' THEN 2
  WHEN description LIKE '%14 天%' THEN 3
  WHEN description LIKE '%30 天%' THEN 4
  WHEN description LIKE '%90 天%' THEN 5
  WHEN description LIKE '%180 天%' THEN 6
  WHEN description LIKE '%365 天%' THEN 7
  ELSE 8
END;

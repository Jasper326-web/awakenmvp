-- 检查avatars存储桶是否存在，如果不存在则创建
DO $$
BEGIN
    -- 尝试创建avatars存储桶
    BEGIN
        CREATE BUCKET IF NOT EXISTS avatars;
        RAISE NOTICE 'avatars存储桶已创建或已存在';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '无法创建avatars存储桶: %', SQLERRM;
    END;
    
    -- 设置存储桶的公共访问权限
    BEGIN
        UPDATE buckets SET public = true WHERE name = 'avatars';
        RAISE NOTICE 'avatars存储桶已设置为公共访问';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '无法设置avatars存储桶权限: %', SQLERRM;
    END;
END $$;

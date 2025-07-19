-- 为user_feedback表添加图片URL字段
ALTER TABLE user_feedback 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 添加注释
COMMENT ON COLUMN user_feedback.image_url IS '用户上传的图片URL';

-- 创建索引（可选，如果经常查询图片URL）
CREATE INDEX IF NOT EXISTS idx_user_feedback_image_url ON user_feedback(image_url) WHERE image_url IS NOT NULL;

-- 输出确认信息
SELECT 'Image URL field added to user_feedback table successfully' AS message; 
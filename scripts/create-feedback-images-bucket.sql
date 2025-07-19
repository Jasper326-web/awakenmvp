-- 创建反馈图片存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'feedback-images',
  'feedback-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- 设置存储桶策略
CREATE POLICY "允许用户上传反馈图片" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'feedback-images');

CREATE POLICY "允许用户查看反馈图片" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'feedback-images');

CREATE POLICY "允许匿名用户上传反馈图片" ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'feedback-images');

CREATE POLICY "允许匿名用户查看反馈图片" ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id = 'feedback-images');

-- 输出确认信息
SELECT 'Feedback images bucket created successfully' AS message; 
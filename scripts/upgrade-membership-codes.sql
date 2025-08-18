-- 升级 membership_codes 表以支持促销/兑换码
-- 对应后端期望字段：is_used、used_by、used_at、expires_at、subscription_type、duration_days

BEGIN;

-- 新增字段（如果不存在）
ALTER TABLE membership_codes
  ADD COLUMN IF NOT EXISTS is_used BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS used_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_type TEXT DEFAULT 'premium',
  ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 7,
  ADD COLUMN IF NOT EXISTS max_uses INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS uses_count INTEGER DEFAULT 0;

-- 兼容老字段名：used -> is_used
UPDATE membership_codes SET is_used = COALESCE(is_used, FALSE) OR COALESCE(used, FALSE);

-- 索引与约束
CREATE UNIQUE INDEX IF NOT EXISTS idx_membership_codes_code_unique ON membership_codes (code);
CREATE INDEX IF NOT EXISTS idx_membership_codes_is_used ON membership_codes (is_used);
CREATE INDEX IF NOT EXISTS idx_membership_codes_expires_at ON membership_codes (expires_at);

-- 兑换明细表：防止同一用户重复使用同一码
CREATE TABLE IF NOT EXISTS membership_code_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code_id UUID REFERENCES membership_codes(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (code_id, user_id)
);

ALTER TABLE membership_code_redemptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role can manage membership code redemptions" ON membership_code_redemptions;
CREATE POLICY "Service role can manage membership code redemptions" ON membership_code_redemptions
  FOR ALL USING (auth.role() = 'service_role');
CREATE INDEX IF NOT EXISTS idx_code_redemptions_code_id ON membership_code_redemptions (code_id);
CREATE INDEX IF NOT EXISTS idx_code_redemptions_user_id ON membership_code_redemptions (user_id);

COMMIT;

-- 原子化兑换过程（并发安全）：
-- 1) 校验码有效与配额（max_uses/uses_count）与过期
-- 2) 防止同一用户重复使用
-- 3) 递增 uses_count，必要时置 is_used=true
-- 4) 写入兑换明细
-- 5) 原子更新/创建 user_subscriptions 并延长到期时间
-- 返回：天数、订阅类型、新的到期时间
CREATE OR REPLACE FUNCTION redeem_membership_code(
  p_user_id UUID,
  p_code TEXT
) RETURNS TABLE(duration_days INTEGER, subscription_type TEXT, new_end TIMESTAMPTZ) AS $$
DECLARE
  v_code RECORD;
  v_now TIMESTAMPTZ := NOW();
  v_duration INTEGER;
  v_sub_type TEXT;
  v_current_end TIMESTAMPTZ;
  v_base TIMESTAMPTZ;
  v_new_end TIMESTAMPTZ;
  v_latest_sub RECORD;
BEGIN
  -- 锁定兑换码记录
  SELECT * INTO v_code FROM membership_codes WHERE code = p_code FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION '兑换码不存在';
  END IF;

  IF v_code.expires_at IS NOT NULL AND v_code.expires_at < v_now THEN
    RAISE EXCEPTION '兑换码已过期';
  END IF;

  -- 配额检查
  IF COALESCE(v_code.max_uses, 1) > 0 AND COALESCE(v_code.uses_count, 0) >= v_code.max_uses THEN
    RAISE EXCEPTION '兑换码已被用尽';
  END IF;

  -- 同一用户重复校验
  IF EXISTS (SELECT 1 FROM membership_code_redemptions WHERE code_id = v_code.id AND user_id = p_user_id) THEN
    RAISE EXCEPTION '该用户已使用过此码';
  END IF;

  -- 递增计数与可能的完结标记
  UPDATE membership_codes
  SET uses_count = COALESCE(uses_count, 0) + 1,
      is_used = CASE WHEN (COALESCE(uses_count, 0) + 1) >= COALESCE(max_uses, 1) THEN TRUE ELSE is_used END,
      used_at = CASE WHEN (COALESCE(uses_count, 0) + 1) >= COALESCE(max_uses, 1) THEN NOW() ELSE used_at END
  WHERE id = v_code.id;

  -- 写入兑换明细
  INSERT INTO membership_code_redemptions(code_id, code, user_id) VALUES (v_code.id, v_code.code, p_user_id);

  v_duration := COALESCE(v_code.duration_days, 7);
  v_sub_type := COALESCE(v_code.subscription_type, 'premium');

  -- 锁定用户最近订阅
  SELECT id, end_date INTO v_latest_sub
  FROM user_subscriptions
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  v_current_end := v_latest_sub.end_date;
  v_base := GREATEST(COALESCE(v_current_end, v_now), v_now);
  v_new_end := v_base + (v_duration || ' days')::INTERVAL;

  IF v_latest_sub.id IS NOT NULL THEN
    -- 更新现有订阅
    UPDATE user_subscriptions
    SET status = 'active',
        subscription_type = v_sub_type,
        end_date = v_new_end,
        updated_at = v_now
    WHERE id = v_latest_sub.id;
  ELSE
    -- 创建新订阅
    INSERT INTO user_subscriptions (user_id, subscription_type, status, end_date, activated_at, created_at, updated_at)
    VALUES (p_user_id, v_sub_type, 'active', v_new_end, v_now::timestamp, v_now, v_now);
  END IF;

  duration_days := v_duration;
  subscription_type := v_sub_type;
  new_end := v_new_end;
  RETURN QUERY SELECT duration_days, subscription_type, new_end;
END;
$$ LANGUAGE plpgsql;



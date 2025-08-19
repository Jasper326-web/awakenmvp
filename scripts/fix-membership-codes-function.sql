-- 修复 redeem_membership_code 函数以匹配实际的表结构
-- 根据错误信息，used_at 列不存在，需要调整函数逻辑

BEGIN;

-- 删除旧的函数
DROP FUNCTION IF EXISTS redeem_membership_code(UUID, TEXT);

-- 重新创建函数，使用正确的列名
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
      is_used = CASE WHEN (COALESCE(uses_count, 0) + 1) >= COALESCE(max_uses, 1) THEN TRUE ELSE is_used END
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

COMMIT;

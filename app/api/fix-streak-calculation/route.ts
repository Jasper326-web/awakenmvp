import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST() {
  try {
    console.log('[修复连续天数] 开始执行修复脚本...')
    
    // 删除所有旧的函数和触发器
    const dropStatements = [
      'DROP TRIGGER IF EXISTS update_checkin_stats_trigger ON daily_checkins',
      'DROP TRIGGER IF EXISTS update_streak_on_checkin ON daily_checkins',
      'DROP TRIGGER IF EXISTS update_user_streak_trigger ON daily_checkins',
      'DROP FUNCTION IF EXISTS calculate_streak(uuid) CASCADE',
      'DROP FUNCTION IF EXISTS calculate_current_streak(uuid) CASCADE',
      'DROP FUNCTION IF EXISTS calculate_max_streak(uuid) CASCADE',
      'DROP FUNCTION IF EXISTS calculate_total_success_days(uuid) CASCADE',
      'DROP FUNCTION IF EXISTS update_user_checkin_stats(uuid) CASCADE',
      'DROP FUNCTION IF EXISTS update_user_stats(uuid) CASCADE',
      'DROP FUNCTION IF EXISTS update_checkin_stats() CASCADE',
      'DROP FUNCTION IF EXISTS update_user_streak() CASCADE',
      'DROP FUNCTION IF EXISTS trigger_update_checkin_stats() CASCADE',
      'DROP FUNCTION IF EXISTS update_checkin_stats_trigger() CASCADE',
      'DROP FUNCTION IF EXISTS get_user_current_streak(uuid) CASCADE',
      'DROP FUNCTION IF EXISTS get_leaderboard(int) CASCADE',
      'DROP FUNCTION IF EXISTS refresh_all_user_stats() CASCADE',
      'DROP FUNCTION IF EXISTS calculate_total_days(uuid) CASCADE'
    ]
    
    // 执行删除语句
    for (const statement of dropStatements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        if (error) {
          console.log(`[修复连续天数] 删除语句执行: ${statement}`)
        }
      } catch (err) {
        console.log(`[修复连续天数] 删除语句跳过: ${statement}`)
      }
    }
    
    // 创建正确的计算最大连续天数的函数
    const createMaxStreakFunction = `
      CREATE OR REPLACE FUNCTION calculate_max_streak(user_uuid uuid)
      RETURNS integer AS $$
      DECLARE
          checkin_record RECORD;
          current_streak int := 0;
          max_streak int := 0;
          prev_date date := NULL;
          date_diff int;
      BEGIN
          FOR checkin_record IN 
              SELECT date
              FROM daily_checkins 
              WHERE user_id = user_uuid 
              AND status = 'success'
              ORDER BY date ASC
          LOOP
              IF prev_date IS NULL THEN
                  current_streak := 1;
              ELSE
                  date_diff := checkin_record.date - prev_date;
                  IF date_diff = 1 THEN
                      current_streak := current_streak + 1;
                  ELSE
                      current_streak := 1;
                  END IF;
              END IF;
              max_streak := GREATEST(max_streak, current_streak);
              prev_date := checkin_record.date;
          END LOOP;
          RETURN COALESCE(max_streak, 0);
      END;
      $$ LANGUAGE plpgsql;
    `
    
    // 创建计算总成功天数的函数
    const createTotalDaysFunction = `
      CREATE OR REPLACE FUNCTION calculate_total_success_days(user_uuid uuid)
      RETURNS integer AS $$
      DECLARE
          total_count int := 0;
      BEGIN
          SELECT COUNT(*) INTO total_count
          FROM daily_checkins 
          WHERE user_id = user_uuid 
          AND status = 'success';
          RETURN COALESCE(total_count, 0);
      END;
      $$ LANGUAGE plpgsql;
    `
    
    // 创建触发器函数
    const createTriggerFunction = `
      CREATE OR REPLACE FUNCTION trigger_update_checkin_stats()
      RETURNS TRIGGER AS $$
      DECLARE
          max_streak_val int;
          total_days_val int;
      BEGIN
          max_streak_val := calculate_max_streak(NEW.user_id);
          total_days_val := calculate_total_success_days(NEW.user_id);
          NEW.max_streak := max_streak_val;
          NEW.total_days := total_days_val;
          NEW.updated_at := NOW();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `
    
    // 创建触发器
    const createTrigger = `
      CREATE TRIGGER update_checkin_stats_trigger
          BEFORE INSERT OR UPDATE ON daily_checkins
          FOR EACH ROW
          EXECUTE FUNCTION trigger_update_checkin_stats();
    `
    
    // 执行创建语句
    const createStatements = [
      createMaxStreakFunction,
      createTotalDaysFunction,
      createTriggerFunction,
      createTrigger
    ]
    
    for (const statement of createStatements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        if (error) {
          console.error('[修复连续天数] 创建函数失败:', error)
        }
      } catch (err) {
        console.error('[修复连续天数] 创建函数异常:', err)
      }
    }
    
    // 更新所有用户的统计数据
    const updateStats = `
      UPDATE daily_checkins 
      SET 
          max_streak = calculate_max_streak(user_id),
          total_days = calculate_total_success_days(user_id),
          updated_at = NOW()
      WHERE user_id IN (SELECT DISTINCT user_id FROM daily_checkins);
    `
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: updateStats })
      if (error) {
        console.error('[修复连续天数] 更新统计数据失败:', error)
      }
    } catch (err) {
      console.error('[修复连续天数] 更新统计数据异常:', err)
    }
    
    // 验证修复结果
    const { data: checkResults, error: checkError } = await supabase
      .from('daily_checkins')
      .select('user_id, date, status, max_streak, total_days')
      .order('date', { ascending: false })
      .limit(20)
    
    if (checkError) {
      console.error('[修复连续天数] 验证结果失败:', checkError)
    } else {
      console.log('[修复连续天数] 验证结果:', checkResults)
    }
    
    return NextResponse.json({ 
      success: true, 
      message: '连续天数计算修复完成',
      results: checkResults 
    })
    
  } catch (error) {
    console.error('[修复连续天数] 执行失败:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 })
  }
} 
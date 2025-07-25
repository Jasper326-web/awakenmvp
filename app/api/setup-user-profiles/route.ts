import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // 创建 user_profiles 表
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS user_profiles (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        username VARCHAR(255),
        avatar_url TEXT,
        country VARCHAR(100) DEFAULT '未知',
        streak INTEGER DEFAULT 0,
        level INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      );
    `

    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL })
    if (createError) {
      console.error('创建表失败:', createError)
      return NextResponse.json({ error: '创建表失败' }, { status: 500 })
    }

    // 创建索引
    const createIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
    `
    await supabase.rpc('exec_sql', { sql: createIndexSQL })

    // 启用 RLS
    const enableRLSSQL = `
      ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
    `
    await supabase.rpc('exec_sql', { sql: enableRLSSQL })

    // 创建 RLS 策略
    const policiesSQL = `
      DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
      CREATE POLICY "Users can view own profile" ON user_profiles
        FOR SELECT USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
      CREATE POLICY "Users can insert own profile" ON user_profiles
        FOR INSERT WITH CHECK (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
      CREATE POLICY "Users can update own profile" ON user_profiles
        FOR UPDATE USING (auth.uid() = user_id);
    `
    await supabase.rpc('exec_sql', { sql: policiesSQL })

    // 为现有用户创建默认资料
    const insertProfilesSQL = `
      INSERT INTO user_profiles (user_id, username, streak, level)
      SELECT 
        id as user_id,
        COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'email', '用户') as username,
        0 as streak,
        0 as level
      FROM auth.users
      WHERE id NOT IN (SELECT user_id FROM user_profiles)
      ON CONFLICT (user_id) DO NOTHING;
    `
    await supabase.rpc('exec_sql', { sql: insertProfilesSQL })

    return NextResponse.json({ success: true, message: 'user_profiles 表设置完成' })
  } catch (error) {
    console.error('设置 user_profiles 表失败:', error)
    return NextResponse.json({ error: '设置失败' }, { status: 500 })
  }
} 
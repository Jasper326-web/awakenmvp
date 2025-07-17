import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { codeStore } from '@/lib/code-store'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  const { email, password, code } = await req.json()
  if (!email || !password || !code) {
    return NextResponse.json({ error: '参数不完整' }, { status: 400 })
  }

  // 校验验证码
  const record = codeStore.get(email)
  if (!record || record.code !== code || record.expires < Date.now()) {
    return NextResponse.json({ error: '验证码错误或已过期' }, { status: 400 })
  }

  // 创建 Supabase 用户
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // 注册成功后删除验证码
  codeStore.delete(email)
  return NextResponse.json({ success: true })
} 
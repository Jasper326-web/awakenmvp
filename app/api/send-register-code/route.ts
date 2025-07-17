import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { codeStore } from '@/lib/code-store'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 })
  }

  // 生成6位数字验证码
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  codeStore.set(email, { code, expires: Date.now() + 10 * 60 * 1000 }) // 10分钟有效

  // 配置你的QQ邮箱
  const transporter = nodemailer.createTransport({
    service: 'qq',
    auth: {
      user: '569837605@qq.com',
      pass: 'pheygfcbwfvfbffc'
    }
  })

  await transporter.sendMail({
    from: '569837605@qq.com',
    to: email,
    subject: 'Awaken 注册验证码',
    text: `您的验证码是：${code}，10分钟内有效。`
  })

  return NextResponse.json({ success: true })
}

// 导出 codeStore 供注册接口使用
export { codeStore } 
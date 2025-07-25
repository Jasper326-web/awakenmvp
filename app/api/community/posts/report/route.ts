import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // 这里只做演示，实际可存储到数据库
  return NextResponse.json({ success: true, message: '举报已收到' })
} 
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { authService } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const currentUser = await authService.getCurrentUserFromRequest(request)
    if (!currentUser) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    console.log(`[修复统计] 开始为用户 ${currentUser.id} 修复统计数据`)

    // 获取用户所有打卡记录
    const { data: checkins, error: checkinsError } = await supabase
      .from('daily_checkins')
      .select('date, status')
      .eq('user_id', currentUser.id)
      .order('date', { ascending: true })

    if (checkinsError) {
      console.error('[修复统计] 获取打卡记录失败:', checkinsError)
      return NextResponse.json({ error: '获取打卡记录失败' }, { status: 500 })
    }

    if (!checkins || checkins.length === 0) {
      return NextResponse.json({ 
        message: '没有打卡记录',
        stats: { currentStreak: 0, maxStreak: 0, totalDays: 0 }
      })
    }
    
    // 计算最大连续天数
    let maxStreak = 0
    let tempStreak = 0
    let prevDate: string | null = null

    for (const checkin of checkins) {
      if (checkin.status === 'success') {
        if (prevDate === null) {
          tempStreak = 1
        } else {
          const currentDate = new Date(checkin.date)
          const previousDate = new Date(prevDate)
          const dayDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24))
          
          if (dayDiff === 1) {
            tempStreak++
          } else {
            tempStreak = 1
          }
        }
        maxStreak = Math.max(maxStreak, tempStreak)
        prevDate = checkin.date
      } else {
        tempStreak = 0
        prevDate = null
      }
    }

    // 计算当前连续天数
    let currentStreak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      const dateStr = checkDate.toISOString().split('T')[0]

      const checkin = checkins.find((c: any) => c.date === dateStr)

      if (checkin && checkin.status === 'success') {
        currentStreak++
      } else if (checkin && checkin.status === 'failed') {
        break
      } else if (i === 0) {
        continue
      } else {
        break
      }
    }

    // 计算总成功天数
    const totalDays = checkins.filter((c: any) => c.status === 'success').length

    // 更新用户统计
    const { error: updateError } = await supabase
      .from('users')
      .update({
        current_streak: currentStreak,
        max_streak: maxStreak,
        total_days: totalDays,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentUser.id)

    if (updateError) {
      console.error('[修复统计] 更新用户统计失败:', updateError)
      return NextResponse.json({ error: '更新统计失败' }, { status: 500 })
    }

    console.log(`[修复统计] 用户 ${currentUser.id} 统计修复完成:`, {
      currentStreak,
      maxStreak,
      totalDays
    })
    
    return NextResponse.json({ 
      message: '统计修复成功',
      stats: {
        currentStreak,
        maxStreak,
        totalDays
      }
    })
    
  } catch (error) {
    console.error('[修复统计] 处理请求时出错:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
} 
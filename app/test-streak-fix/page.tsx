'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useUser } from '@/hooks/useUser'

export default function TestStreakFix() {
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const { toast } = useToast()
  const { user } = useUser()

  const fixStats = async () => {
    if (!user) {
      toast({
        title: '请先登录',
        description: '需要登录才能修复统计数据',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/fix-streak-calculation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok) {
        setStats(data.stats)
        toast({
          title: '修复成功',
          description: data.message
        })
      } else {
        toast({
          title: '修复失败',
          description: data.error,
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('修复统计失败:', error)
      toast({
        title: '修复失败',
        description: '网络错误',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">统计修复测试</h1>
          <p className="text-gray-300">修复用户的 max_streak 统计数据</p>
        </div>

        <Card className="bg-gray-900/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white">修复操作</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={fixStats} 
              disabled={loading || !user}
              className="w-full"
            >
              {loading ? '修复中...' : '修复统计数据'}
            </Button>
            
            {!user && (
              <p className="text-gray-400 text-sm mt-2">
                请先登录才能使用此功能
              </p>
            )}
          </CardContent>
        </Card>

        {stats && (
          <Card className="bg-gray-900/50 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-white">修复结果</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-coral">{stats.currentStreak}</div>
                  <div className="text-sm text-gray-400">当前连续天数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-coral">{stats.maxStreak}</div>
                  <div className="text-sm text-gray-400">历史最佳</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-coral">{stats.totalDays}</div>
                  <div className="text-sm text-gray-400">总成功天数</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 
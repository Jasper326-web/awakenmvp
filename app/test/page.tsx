"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Video, FileText, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">功能测试页面</h1>
          <p className="text-gray-300">测试打卡和视频录制功能</p>
        </div>

        {/* 功能卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 打卡功能 */}
          <Card className="bg-gray-900/50 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                每日打卡
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300 text-sm">
                测试打卡弹窗、重新填写功能、状态保存和图标显示
              </p>
              <div className="space-y-2 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <span>守戒成功状态</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-3 h-3 text-red-400" />
                  <span>破戒状态</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-3 h-3 text-blue-400" />
                  <span>日志记录</span>
                </div>
                <div className="flex items-center gap-2">
                  <Video className="w-3 h-3 text-purple-400" />
                  <span>视频记录</span>
                </div>
              </div>
              <Link href="/checkin">
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  进入打卡页面
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* 视频录制功能 */}
          <Card className="bg-gray-900/50 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Video className="h-5 w-5" />
                视频录制（集成在打卡弹窗中）
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300 text-sm">
                视频录制功能已集成到打卡弹窗中，通过标签页切换
              </p>
              <div className="space-y-2 text-xs text-gray-400">
                <div>• 在打卡弹窗中点击"视频"标签</div>
                <div>• 摄像头自动初始化和权限获取</div>
                <div>• 实时预览和录制功能</div>
                <div>• 自动上传到Supabase Storage</div>
                <div>• 与状态和日志一起保存</div>
              </div>
              <Link href="/checkin">
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  进入打卡页面测试
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* 功能说明 */}
        <Card className="bg-gray-900/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white">功能说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-gray-300">
              <div>
                <h4 className="font-medium text-white mb-2">打卡弹窗特性：</h4>
                <ul className="space-y-1 text-gray-400">
                  <li>• 右上角重新填写图标（仅在有数据时显示）</li>
                  <li>• 两个标签页：状态 & 日志、视频</li>
                  <li>• 状态和日志在同一个标签页中，布局紧凑</li>
                  <li>• 简约的保存按钮设计</li>
                  <li>• 重新填写会删除现有记录，允许重新填写</li>
                  <li>• 日期下方显示状态图标（守戒/破戒/日志/视频）</li>
                  <li>• 支持状态、日志、视频的完整记录</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-2">视频录制功能特性：</h4>
                <ul className="space-y-1 text-gray-400">
                  <li>• 集成在打卡弹窗的"视频"标签页中</li>
                  <li>• 摄像头自动初始化和权限获取</li>
                  <li>• 实时预览和录制功能</li>
                  <li>• 自动上传到Supabase Storage</li>
                  <li>• 重新录制功能</li>
                  <li>• 与打卡系统数据同步</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-white mb-2">数据同步：</h4>
                <ul className="space-y-1 text-gray-400">
                  <li>• 所有数据（状态、日志、视频）一起保存</li>
                  <li>• 重新填写会清除所有相关数据</li>
                  <li>• 日历图标实时反映最新状态</li>
                  <li>• 统计数据自动计算和更新</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 测试链接 */}
        <Card className="bg-gray-900/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white">快速测试链接</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Link href="/checkin">
                <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-white/10">
                  打卡页面
                </Button>
              </Link>
              <Link href="/test-calendar">
                <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-white/10">
                  日历测试
                </Button>
              </Link>
              <Link href="/debug">
                <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-white/10">
                  调试页面
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import CalendarComponent from "@/components/calendar-component"
import CheckinModal from "@/components/checkin-modal"
import RecordsDisplay from "@/components/records-display"

// 模拟数据
const mockCheckinData = {
  "2024-01-15": {
    status: "success" as const,
    hasJournal: true,
    hasVideo: false,
  },
  "2024-01-16": {
    status: "failed" as const,
    hasJournal: false,
    hasVideo: true,
  },
  "2024-01-17": {
    status: "success" as const,
    hasJournal: true,
    hasVideo: true,
  },
  "2024-01-18": {
    status: "success" as const,
    hasJournal: false,
    hasVideo: false,
  },
  "2024-01-20": {
    status: "failed" as const,
    hasJournal: true,
    hasVideo: false,
  },
}

const mockRecords = [
  {
    date: "2024-01-20",
    status: "failed" as const,
    journalContent: "今天没能坚持住，明天要更加努力。反思一下失败的原因，制定更好的计划。",
  },
  {
    date: "2024-01-18",
    status: "success" as const,
  },
  {
    date: "2024-01-17",
    status: "success" as const,
    journalContent: "今天感觉很好，做了运动，心情不错。继续保持这种状态！",
    videoUrl: "/mock-video.mp4",
  },
  {
    date: "2024-01-16",
    status: "failed" as const,
    videoUrl: "/mock-video2.mp4",
  },
  {
    date: "2024-01-15",
    status: "success" as const,
    journalContent: "第一天打卡，感觉很有动力。设定了明确的目标，相信自己能够坚持下去。",
  },
]

export default function TestCalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)
  const [tooltipData, setTooltipData] = useState<{ journalContent?: string; videoUrl?: string } | null>(null)

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setIsModalOpen(true)
  }

  const handleSave = async (data: { status: "success" | "failed"; journalContent?: string; videoFile?: File }) => {
    console.log("保存打卡数据:", { date: selectedDate, ...data })
    // 模拟保存成功
    alert(`打卡保存成功！\n日期: ${selectedDate}\n状态: ${data.status === "success" ? "守戒" : "破戒"}`)
  }

  const handleDateHover = (date: string) => {
    const record = mockRecords.find((r) => r.date === date)
    if (record && (record.journalContent || record.videoUrl)) {
      setHoveredDate(date)
      setTooltipData({
        journalContent: record.journalContent,
        videoUrl: record.videoUrl,
      })
    }
  }

  const handleDateLeave = () => {
    setHoveredDate(null)
    setTooltipData(null)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">每日打卡 - 测试页面</h1>
          <p className="text-gray-400">这是新的日历式打卡界面预览</p>
          <p className="text-sm text-yellow-400 mt-2">
            💡 点击日历上的日期可以打卡，鼠标悬停在有记录的日期上可以查看详情
          </p>
        </div>

        {/* 日历组件 */}
        <div className="mb-8">
          <CalendarComponent
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            checkinData={mockCheckinData}
            onDateHover={handleDateHover}
            onDateLeave={handleDateLeave}
          />
        </div>

        {/* 悬停提示 */}
        {hoveredDate && tooltipData && (
          <div
            className="fixed z-50 bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg max-w-xs pointer-events-none"
            style={{
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="text-sm">
              <div className="font-medium text-white mb-1">{hoveredDate}</div>
              {tooltipData.journalContent && (
                <div className="text-gray-300 mb-2">
                  <span className="text-blue-400">📓 日志:</span>
                  <p className="mt-1 line-clamp-3">{tooltipData.journalContent}</p>
                </div>
              )}
              {tooltipData.videoUrl && (
                <div className="text-gray-300">
                  <span className="text-purple-400">📹 视频:</span>
                  <p className="mt-1">已录制视频记录</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 记录展示 */}
        <RecordsDisplay selectedDate={selectedDate} records={mockRecords} />

        {/* 打卡弹窗 */}
        <CheckinModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          selectedDate={selectedDate}
          onSave={handleSave}
        />

        {/* 说明文字 */}
        <div className="mt-8 p-4 bg-gray-900 rounded-lg border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-2">功能说明</h3>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• 点击日历上的日期可以进行打卡</li>
            <li>• 绿色表示守戒，红色表示破戒</li>
            <li>• 蓝色小图标表示有日志记录</li>
            <li>• 紫色小图标表示有视频记录</li>
            <li>• 鼠标悬停在有记录的日期上可以查看详情</li>
            <li>• 下方的标签页可以查看日志和视频记录</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

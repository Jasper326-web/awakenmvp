"use client"

import { useState } from "react"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Video, Calendar, Check, X } from "lucide-react"

interface Record {
  date: string
  status: "success" | "failed"
  journalContent?: string
  videoUrl?: string
}

interface RecordsDisplayProps {
  selectedDate: string
  records: Record[]
}

export default function RecordsDisplay({ selectedDate, records }: RecordsDisplayProps) {
  const [activeTab, setActiveTab] = useState("journal")

  // 过滤记录
  const journalRecords = records.filter((r) => r.journalContent)
  const videoRecords = records.filter((r) => r.videoUrl)
  const selectedRecord = records.find((r) => r.date === selectedDate)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("zh-CN", {
      month: "long",
      day: "numeric",
      weekday: "long",
    })
  }

  return (
    <div className="relative rounded-lg overflow-hidden shadow-md bg-gray-900/30 border border-white/20 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl text-white flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-primary" />
          <span>记录查看</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800/50">
            <TabsTrigger value="journal" className="flex items-center space-x-2 data-[state=active]:bg-blue-600">
              <BookOpen className="w-4 h-4" />
              <span>日志记录</span>
              <span className="text-xs bg-gray-700 px-1 rounded">{journalRecords.length}</span>
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center space-x-2 data-[state=active]:bg-purple-600">
              <Video className="w-4 h-4" />
              <span>视频记录</span>
              <span className="text-xs bg-gray-700 px-1 rounded">{videoRecords.length}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="journal" className="mt-4">
            {selectedRecord?.journalContent ? (
              <div className="mb-4 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-400">{formatDate(selectedDate)}</span>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                      selectedRecord.status === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {selectedRecord.status === "success" ? (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        守戒
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3 mr-1" />
                        破戒
                      </>
                    )}
                  </span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{selectedRecord.journalContent}</p>
              </div>
            ) : (
              <div className="mb-4 p-4 bg-gray-800/50 rounded-lg text-center">
                <BookOpen className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">{formatDate(selectedDate)} 暂无日志记录</p>
              </div>
            )}

            {journalRecords.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-400">最近的日志</h4>
                {journalRecords.slice(0, 5).map((record) => (
                  <div key={record.date} className="p-3 bg-gray-800/50 rounded-md border border-gray-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">{formatDate(record.date)}</span>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                          record.status === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {record.status === "success" ? "守戒" : "破戒"}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm line-clamp-2">{record.journalContent}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">暂无日志记录</p>
                <p className="text-sm text-gray-500 mt-1">开始写日志，记录你的成长历程</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="video" className="mt-4">
            {selectedRecord?.videoUrl ? (
              <div className="mb-4 p-4 bg-purple-900/20 border border-purple-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-400">{formatDate(selectedDate)}</span>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                      selectedRecord.status === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {selectedRecord.status === "success" ? (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        守戒
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3 mr-1" />
                        破戒
                      </>
                    )}
                  </span>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                  <Video className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-gray-300 text-sm">视频记录已保存</p>
                  <p className="text-xs text-gray-500 mt-1">点击播放查看内容</p>
                </div>
              </div>
            ) : (
              <div className="mb-4 p-4 bg-gray-800/50 rounded-lg text-center">
                <Video className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">{formatDate(selectedDate)} 暂无视频记录</p>
              </div>
            )}

            {videoRecords.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-400">最近的视频</h4>
                {videoRecords.slice(0, 5).map((record) => (
                  <div key={record.date} className="p-3 bg-gray-800/50 rounded-md border border-gray-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">{formatDate(record.date)}</span>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                          record.status === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {record.status === "success" ? "守戒" : "破戒"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-300">
                      <Video className="w-4 h-4 text-purple-400" />
                      <span className="text-sm">视频记录</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Video className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">暂无视频记录</p>
                <p className="text-sm text-gray-500 mt-1">录制视频，分享你的心得体会</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </div>
  )
}

"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Video, Play, Square, Upload, Calendar } from "lucide-react"

export default function VideoRecord() {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [recordingTime, setRecordingTime] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // 模拟历史记录
  const videoHistory = [
    { id: 1, date: "2024-01-15", duration: "2:30", notes: "今天感觉很好，成功抵制了诱惑" },
    { id: 2, date: "2024-01-14", duration: "1:45", notes: "有些困难，但坚持下来了" },
    { id: 3, date: "2024-01-13", duration: "3:10", notes: "分享了一些心得体会" },
  ]

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      const chunks: BlobPart[] = []
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" })
        const videoUrl = URL.createObjectURL(blob)
        setRecordedVideo(videoUrl)
      }

      mediaRecorder.start()
      setIsRecording(true)

      // 开始计时
      const timer = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)

      // 保存timer引用以便清理
      ;(mediaRecorder as any).timer = timer
    } catch (error) {
      console.error("无法访问摄像头:", error)
      alert("无法访问摄像头，请检查权限设置")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()

      // 清理timer
      if ((mediaRecorderRef.current as any).timer) {
        clearInterval((mediaRecorderRef.current as any).timer)
      }

      // 停止摄像头
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      setIsRecording(false)
    }
  }

  const saveVideo = () => {
    // 这里将来对接后端API保存视频和备注
    console.log("保存视频和备注:", { video: recordedVideo, notes, duration: recordingTime })

    // 重置状态
    setRecordedVideo(null)
    setNotes("")
    setRecordingTime(0)

    alert("视频已保存成功！")
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* 头部 */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">影像记录</h1>
            <p className="text-sm text-gray-400">记录每日总结视频</p>
          </div>
        </div>

        {/* 录制区域 */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Video className="w-5 h-5" />
              <span>今日总结</span>
            </CardTitle>
            <CardDescription className="text-gray-400">{new Date().toLocaleDateString("zh-CN")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 视频预览区域 */}
            <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
              {isRecording || recordedVideo ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted={isRecording}
                  controls={!isRecording && recordedVideo}
                  src={recordedVideo || undefined}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Video className="w-12 h-12 mx-auto text-gray-500" />
                    <p className="text-gray-500 text-sm">点击开始录制</p>
                  </div>
                </div>
              )}

              {/* 录制时间显示 */}
              {isRecording && (
                <div className="absolute top-4 left-4 bg-red-600 text-white px-2 py-1 rounded text-sm font-mono">
                  ● {formatTime(recordingTime)}
                </div>
              )}
            </div>

            {/* 控制按钮 */}
            <div className="flex justify-center space-x-4">
              {!isRecording && !recordedVideo && (
                <Button onClick={startRecording} className="bg-red-600 hover:bg-red-700 text-white">
                  <Video className="w-4 h-4 mr-2" />
                  开始录制
                </Button>
              )}

              {isRecording && (
                <Button onClick={stopRecording} className="bg-gray-600 hover:bg-gray-700 text-white">
                  <Square className="w-4 h-4 mr-2" />
                  停止录制
                </Button>
              )}

              {recordedVideo && (
                <div className="flex space-x-2">
                  <Button
                    onClick={() => {
                      setRecordedVideo(null)
                      setRecordingTime(0)
                    }}
                    variant="outline"
                    className="border-gray-600 text-gray-300"
                  >
                    重新录制
                  </Button>
                  <Button onClick={saveVideo} className="bg-green-600 hover:bg-green-700 text-white">
                    <Upload className="w-4 h-4 mr-2" />
                    保存视频
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 备注区域 */}
        {recordedVideo && (
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white text-sm">添加备注</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="记录今天的感受、收获或想法..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                rows={3}
              />
            </CardContent>
          </Card>
        )}

        {/* 历史记录 */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>历史记录</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {videoHistory.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                      <Play className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">{record.date}</div>
                      <div className="text-gray-400 text-xs">{record.duration}</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    查看
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 使用提示 */}
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="text-center space-y-2">
              <h4 className="font-medium text-white text-sm">录制建议</h4>
              <div className="text-xs text-gray-400 space-y-1">
                <p>• 选择安静的环境，确保音质清晰</p>
                <p>• 真实表达今日的感受和收获</p>
                <p>• 建议录制时长控制在2-5分钟</p>
                <p>• 可以分享戒色心得或遇到的挑战</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

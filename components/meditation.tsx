"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { ArrowLeft, Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react"

export default function Meditation() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(600) // 10分钟默认
  const [volume, setVolume] = useState([70])
  const [isMuted, setIsMuted] = useState(false)
  const [selectedSession, setSelectedSession] = useState<"meditation" | "jixiangwo">("meditation")

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // 模拟音频数据
  const sessions = {
    meditation: {
      title: "正念冥想",
      description: "通过专注呼吸，平静内心，提升觉察力",
      duration: 600, // 10分钟
      audioUrl: "/placeholder-audio.mp3", // 实际项目中替换为真实音频URL
    },
    jixiangwo: {
      title: "吉祥卧练习",
      description: "右侧卧姿，调节身心，促进深度放松",
      duration: 900, // 15分钟
      audioUrl: "/placeholder-audio-2.mp3",
    },
  }

  const currentSession = sessions[selectedSession]

  useEffect(() => {
    setDuration(currentSession.duration)
    setCurrentTime(0)
    setIsPlaying(false)
  }, [selectedSession])

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false)
            return duration
          }
          return prev + 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, duration])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
    // 这里可以控制实际的音频播放
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
    }
  }

  const reset = () => {
    setCurrentTime(0)
    setIsPlaying(false)
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.pause()
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
    }
  }

  const progress = (currentTime / duration) * 100

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
            <h1 className="text-xl font-bold">冥想练习</h1>
            <p className="text-sm text-gray-400">平静内心，提升觉察</p>
          </div>
        </div>

        {/* 练习选择 */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant={selectedSession === "meditation" ? "default" : "outline"}
            onClick={() => setSelectedSession("meditation")}
            className={
              selectedSession === "meditation"
                ? "bg-white text-black"
                : "border-gray-600 text-gray-300 hover:bg-gray-800"
            }
          >
            正念冥想
          </Button>
          <Button
            variant={selectedSession === "jixiangwo" ? "default" : "outline"}
            onClick={() => setSelectedSession("jixiangwo")}
            className={
              selectedSession === "jixiangwo"
                ? "bg-white text-black"
                : "border-gray-600 text-gray-300 hover:bg-gray-800"
            }
          >
            吉祥卧
          </Button>
        </div>

        {/* 当前练习信息 */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">{currentSession.title}</CardTitle>
            <CardDescription className="text-gray-400">{currentSession.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              {/* 时间显示 */}
              <div className="text-4xl font-mono font-bold text-white">{formatTime(currentTime)}</div>
              <div className="text-sm text-gray-400">/ {formatTime(duration)}</div>

              {/* 进度条 */}
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-blue-400 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 控制按钮 */}
        <div className="flex justify-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={reset}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>

          <Button
            size="lg"
            onClick={togglePlay}
            className="bg-white text-black hover:bg-gray-200 w-16 h-16 rounded-full"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleMute}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
        </div>

        {/* 音量控制 */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-sm">音量控制</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Volume2 className="w-4 h-4 text-gray-400" />
              <Slider value={volume} onValueChange={setVolume} max={100} min={0} step={1} className="flex-1" />
              <span className="text-sm text-gray-400 w-8">{volume[0]}</span>
            </div>
          </CardContent>
        </Card>

        {/* 练习指导 */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-sm">练习指导</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedSession === "meditation" ? (
              <div className="space-y-2 text-sm text-gray-300">
                <p>• 找一个安静舒适的地方坐下</p>
                <p>• 闭上眼睛，专注于自然呼吸</p>
                <p>• 当思绪飘散时，温和地将注意力拉回呼吸</p>
                <p>• 保持觉察，不要评判任何想法</p>
              </div>
            ) : (
              <div className="space-y-2 text-sm text-gray-300">
                <p>• 右侧卧，右手托头，左手自然放置</p>
                <p>• 双腿微曲，身体放松</p>
                <p>• 专注于呼吸，让身心完全放松</p>
                <p>• 保持这个姿势直到练习结束</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 隐藏的音频元素 */}
        <audio
          ref={audioRef}
          src={currentSession.audioUrl}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              setDuration(Math.floor(audioRef.current.duration))
            }
          }}
          onTimeUpdate={() => {
            if (audioRef.current) {
              setCurrentTime(Math.floor(audioRef.current.currentTime))
            }
          }}
          onEnded={() => {
            setIsPlaying(false)
            setCurrentTime(duration)
          }}
        />
      </div>
    </div>
  )
}

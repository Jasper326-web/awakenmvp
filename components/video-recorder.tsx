"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Camera, Square, AlertCircle, CheckCircle2, X, Play, VideoOff } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { useLanguage } from "@/lib/lang-context"

interface VideoRecorderProps {
  onVideoSaved: (url: string) => void
  existingVideoUrl?: string
  date: string
  userId?: string
}

export default function VideoRecorder({ onVideoSaved, existingVideoUrl, date, userId }: VideoRecorderProps) {
  const { t } = useLanguage()
  // 状态管理
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingVideoUrl || null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(!!existingVideoUrl)
  const [uploadSpeed, setUploadSpeed] = useState<string>("")
  const [showPreview, setShowPreview] = useState(!!existingVideoUrl)
  const [cameraInitializing, setCameraInitializing] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [hasCameraDevice, setHasCameraDevice] = useState<boolean | null>(null)
  const [deviceCheckComplete, setDeviceCheckComplete] = useState(false)
  const [currentView, setCurrentView] = useState<"camera" | "preview">(existingVideoUrl ? "preview" : "camera")
  const [debugInfo, setDebugInfo] = useState<string>("")

  // Refs
  const liveVideoRef = useRef<HTMLVideoElement>(null)
  const previewVideoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 最大文件大小限制 (100MB)
  const MAX_FILE_SIZE = 100 * 1024 * 1024

  // 添加调试日志
  const addDebugLog = (message: string) => {
    console.log(message)
    setDebugInfo((prev) => `${message}\n${prev}`.slice(0, 500))
  }

  // 检查设备是否有摄像头
  const checkCameraDevice = async () => {
    try {
      addDebugLog("检查摄像头设备...")

      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        addDebugLog("浏览器不支持设备枚举")
        setHasCameraDevice(false)
        setDeviceCheckComplete(true)
        return
      }

      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter((device) => device.kind === "videoinput")

      addDebugLog(`找到视频设备: ${videoDevices.length}`)
      setHasCameraDevice(videoDevices.length > 0)
      setDeviceCheckComplete(true)
    } catch (error) {
      addDebugLog(`检查摄像头设备失败: ${error}`)
      setHasCameraDevice(false)
      setDeviceCheckComplete(true)
    }
  }

  // 初始化检查
  useEffect(() => {
    checkCameraDevice()

    if (existingVideoUrl) {
      setPreviewUrl(existingVideoUrl)
      setUploadSuccess(true)
      setShowPreview(true)
      setCurrentView("preview")
    }

    return () => {
      cleanupResources()
    }
  }, [existingVideoUrl])

  // 清理所有资源
  const cleanupResources = () => {
    addDebugLog("清理视频录制资源...")

    // 停止录制
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }

    // 停止摄像头流
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop()
        addDebugLog(`停止摄像头轨道: ${track.kind} ${track.label}`)
      })
      streamRef.current = null
    }

    // 清理计时器
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    // 清理视频元素
    if (liveVideoRef.current) {
      liveVideoRef.current.srcObject = null
      liveVideoRef.current.src = ""
    }

    // 清理本地预览URL
    if (previewUrl && previewUrl !== existingVideoUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl)
    }

    setCameraReady(false)
  }

  // 格式化录制时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // 初始化摄像头
  const initializeCamera = async () => {
    try {
      setCameraError(null)
      setUploadError(null)
      setCameraInitializing(true)
      addDebugLog("开始初始化摄像头...")

      // 先清理之前的资源
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      // 检查浏览器支持
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("您的浏览器不支持摄像头功能")
      }

      addDebugLog("请求摄像头权限...")
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          facingMode: "user",
        },
        audio: true,
      })

      addDebugLog("摄像头权限获取成功")
      streamRef.current = stream

      // 设置视频预览
      if (liveVideoRef.current) {
        addDebugLog("设置视频预览元素...")
        liveVideoRef.current.srcObject = stream
        liveVideoRef.current.muted = true
        liveVideoRef.current.playsInline = true

        // 等待视频加载并播放
        await new Promise((resolve, reject) => {
          if (liveVideoRef.current) {
            liveVideoRef.current.onloadedmetadata = async () => {
              try {
                if (liveVideoRef.current) {
                  addDebugLog("视频元数据加载完成，尝试播放...")
                  await liveVideoRef.current.play()
                  addDebugLog("摄像头预览开始播放")
                  setCameraReady(true)
                  setCameraInitializing(false)
                  resolve(true)
                }
              } catch (playError) {
                addDebugLog(`视频播放失败: ${playError}`)
                reject(playError)
              }
            }

            liveVideoRef.current.onerror = (error) => {
              addDebugLog(`视频加载错误: ${error}`)
              reject(error)
            }

            // 设置超时
            setTimeout(() => reject(new Error("摄像头初始化超时")), 10000)
          }
        })

        return true
      }
    } catch (error) {
      addDebugLog(`摄像头初始化错误: ${error}`)
      setCameraInitializing(false)
      setCameraReady(false)

      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          setCameraError("摄像头权限被拒绝，请在浏览器设置中允许摄像头访问")
        } else if (error.name === "NotFoundError") {
          setCameraError("未找到摄像头设备")
        } else if (error.name === "NotReadableError") {
          setCameraError("摄像头被其他应用占用，请关闭其他使用摄像头的应用")
        } else {
          setCameraError(error.message)
        }
      } else {
        setCameraError("无法访问摄像头，请检查权限设置")
      }
      return false
    }
  }

  // 开始录制
  const startRecording = async () => {
    try {
      setUploadError(null)
      addDebugLog("准备开始录制...")

      // 确保摄像头流存在且活跃
      if (!streamRef.current || !streamRef.current.active || !cameraReady) {
        addDebugLog("摄像头流不存在或不活跃，重新初始化...")
        const success = await initializeCamera()
        if (!success) return
      }

      // 确保视频正在播放 - 关键修复点
      if (liveVideoRef.current) {
        // 不要重新设置srcObject，保持现有的流
        if (liveVideoRef.current.paused) {
          try {
            addDebugLog("视频暂停中，尝试重新播放...")
            await liveVideoRef.current.play()
            addDebugLog("确保视频继续播放成功")
          } catch (playError) {
            addDebugLog(`重新播放视频失败: ${playError}`)
            return // 如果无法播放，不要继续录制
          }
        }

        // 确保视频元素可见
        if (liveVideoRef.current.style.display === "none") {
          addDebugLog("视频元素隐藏中，设置为可见")
          liveVideoRef.current.style.display = "block"
        }
      }

      // 设置录制器 - 使用相同的MediaStream
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : "video/mp4"

      addDebugLog(`使用录制格式: ${mimeType}`)

      if (!streamRef.current) {
        throw new Error("摄像头流不可用")
      }

      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType,
        videoBitsPerSecond: 500000, // 降低到500kbps，减少文件大小
      })

      const chunks: BlobPart[] = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
          addDebugLog(`录制数据块: ${event.data.size} 字节`)
        }
      }

      mediaRecorder.onstop = () => {
        addDebugLog("录制停止，生成视频文件...")
        const blob = new Blob(chunks, { type: mimeType })
        setRecordedBlob(blob)

        // 创建预览URL
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
        setCurrentView("preview")

        // 清除计时器
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }

        addDebugLog(`录制完成，视频大小: ${formatFileSize(blob.size)}`)

        // 检查文件大小
        if (blob.size > MAX_FILE_SIZE) {
          setUploadError(`视频文件过大 (${formatFileSize(blob.size)})，请录制较短的视频`)
        } else {
          // 自动上传
          uploadVideoToSupabase(new File([blob], `recording-${date}.webm`, { type: mimeType }))
        }
      }

      mediaRecorder.onerror = (event) => {
        addDebugLog(`录制错误: ${event}`)
        setUploadError("录制过程中发生错误")
        setIsRecording(false)
      }

      // 开始录制
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(1000) // 每秒生成一个数据块
      setIsRecording(true)
      addDebugLog("开始录制...")

      // 开始计时
      setRecordingTime(0)
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      addDebugLog(`开始录制错误: ${error}`)
      setUploadError(error instanceof Error ? error.message : "录制失败")
    }
  }

  // 停止录制
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      addDebugLog("停止录制...")
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      // 关键修复：不要停止摄像头流，保持预览
      // streamRef.current 继续保持活跃状态

      // 确保视频继续播放 - 关键修复点
      if (liveVideoRef.current && liveVideoRef.current.paused) {
        liveVideoRef.current.play().catch((error) => {
          addDebugLog(`恢复视频播放失败: ${error}`)
        })
      }
    }
  }

  // 直接上传到Supabase Storage（不创建存储桶）
  const uploadVideoToSupabase = async (file: File) => {
    try {
      setIsUploading(true)
      setUploadProgress(0)
      setUploadError(null)
      addDebugLog("准备上传视频...")

      // 检查用户视频打卡限制
      if (userId) {
        try {
          const response = await fetch("/api/check-video-limit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
          })

          const limitData = await response.json()
          
          if (!response.ok) {
            throw new Error(limitData.error || "检查限制失败")
          }

          if (!limitData.canUpload) {
            // 显示升级提示弹窗
            setUploadError(limitData.message)
            // 触发升级提示
            if (typeof window !== "undefined") {
              // 这里可以触发一个全局事件来显示升级弹窗
              window.dispatchEvent(new CustomEvent("showUpgradeModal", {
                detail: {
                  title: "升级为会员",
                  message: limitData.message,
                  feature: "video_checkin"
                }
              }))
            }
            return
          }

          addDebugLog(`用户限制检查通过: ${limitData.message}`)
        } catch (limitError) {
          addDebugLog(`检查用户限制失败: ${limitError}`)
          // 如果检查失败，继续上传（避免阻塞用户）
        }
      }

      // 检查文件大小
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`文件过大 (${formatFileSize(file.size)})，最大支持 ${formatFileSize(MAX_FILE_SIZE)}`)
      }

      // 智能压缩策略
      let uploadFile = file
      const connection = (navigator as any).connection
      const shouldCompress = file.size > 5 * 1024 * 1024 || // 大于5MB
                           (connection && connection.effectiveType === 'slow-2g') || // 慢速网络
                           (connection && connection.effectiveType === '2g') // 2G网络
      
      if (shouldCompress) {
        addDebugLog(`文件大小: ${formatFileSize(file.size)}，网络类型: ${connection?.effectiveType || 'unknown'}，开始压缩...`)
        try {
          uploadFile = await compressVideo(file)
          const compressionRatio = ((file.size - uploadFile.size) / file.size * 100).toFixed(1)
          addDebugLog(`压缩完成，压缩率: ${compressionRatio}%，压缩后大小: ${formatFileSize(uploadFile.size)}`)
        } catch (compressError) {
          addDebugLog(`压缩失败，使用原文件: ${compressError}`)
        }
      }

      // 创建唯一文件名
      const fileExt = uploadFile.name.split(".").pop() || "webm"
      const fileName = `${userId || "anonymous"}-${date}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}` // 直接放在根目录，不使用videos/前缀

      addDebugLog(`开始上传到Supabase Storage: ${filePath}, ${formatFileSize(uploadFile.size)}`)

      // 优化上传参数
      const { data, error } = await supabase.storage.from("videos").upload(filePath, uploadFile, {
        cacheControl: "3600",
        upsert: true,
        // 添加更多优化参数
        contentType: uploadFile.type,
        // 使用更小的chunk size来提高上传速度
        duplex: 'half',
      })

      if (error) {
        addDebugLog(`上传错误详情: ${JSON.stringify(error)}`)
        throw new Error(`上传失败: ${error.message}`)
      }

      addDebugLog(`上传成功: ${JSON.stringify(data)}`)

      // 使用更真实的进度显示
      const startTime = Date.now()
      const fileSize = uploadFile.size
      
      // 检测网络速度并计算进度
      const networkSpeed = await detectNetworkSpeed()
      addDebugLog(`检测到网络速度: ${(networkSpeed / 1024 / 1024).toFixed(2)}MB/s`)
      
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime
        // 基于实际网络速度估算进度
        const estimatedTotal = (fileSize / networkSpeed) * 1000 // 转换为毫秒
        const progress = Math.min((elapsed / estimatedTotal) * 100, 95)
        setUploadProgress(Math.round(progress))
        
        // 计算实时上传速度
        const currentSpeed = (fileSize * progress / 100) / (elapsed / 1000)
        setUploadSpeed(`${(currentSpeed / 1024 / 1024).toFixed(2)}MB/s`)
      }, 300)

      // 获取公共URL
      const { data: urlData } = supabase.storage.from("videos").getPublicUrl(filePath)
      const publicUrl = urlData.publicUrl

      addDebugLog(`获取公共URL: ${publicUrl}`)

      // 完成上传进度
      clearInterval(progressInterval)
      setUploadProgress(100)

      // 保存到视频记录表
      if (userId) {
        const { error: dbError } = await supabase.from("video_records").upsert(
          {
            user_id: userId,
            record_date: date,
            video_url: publicUrl,
            file_name: fileName,
            file_size: uploadFile.size,
            duration: recordingTime || 0,
          },
          {
            onConflict: "user_id,record_date",
          },
        )

        if (dbError) {
          addDebugLog(`保存视频记录失败: ${dbError}`)
          setUploadError("视频已上传，但记录保存失败")
        }

        // 同时更新daily_checkins表中的video_url字段
        const { data: checkinData, error: checkinQueryError } = await supabase
          .from("daily_checkins")
          .select("id")
          .eq("user_id", userId)
          .eq("date", date)
          .maybeSingle()

        if (checkinQueryError) {
          addDebugLog(`查询打卡记录失败: ${checkinQueryError}`)
        } else if (checkinData) {
          // 如果存在打卡记录，更新video_url字段
          const { error: updateError } = await supabase
            .from("daily_checkins")
            .update({ video_url: publicUrl })
            .eq("id", checkinData.id)

          if (updateError) {
            addDebugLog(`更新打卡记录的video_url失败: ${updateError}`)
          } else {
            addDebugLog(`成功更新打卡记录的video_url`)
          }
        } else {
          // 如果不存在打卡记录，创建一个新记录
          const { error: insertError } = await supabase.from("daily_checkins").insert({
            user_id: userId,
            date: date,
            video_url: publicUrl,
            status: 'success', // 默认为守戒成功
          })

          if (insertError) {
            addDebugLog(`创建带有video_url的打卡记录失败: ${insertError}`)
          } else {
            addDebugLog(`成功创建带有video_url的打卡记录`)
          }
        }
      }

      // 更新状态
      setUploadSuccess(true)
      onVideoSaved(publicUrl)

      // 清理本地预览URL
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl)
      }

      // 设置新的预览URL
      setPreviewUrl(publicUrl)

      addDebugLog("视频上传和保存完成")
    } catch (error) {
      addDebugLog(`视频上传错误: ${error}`)
      setUploadError(error instanceof Error ? error.message : "上传失败")
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // 检测网络速度
  const detectNetworkSpeed = async (): Promise<number> => {
    try {
      const startTime = Date.now()
      const response = await fetch('/api/test-storage', { method: 'HEAD' })
      const endTime = Date.now()
      const duration = endTime - startTime
      // 假设测试请求大约1KB
      const speed = 1024 / (duration / 1000) // bytes per second
      return speed
    } catch {
      return 1024 * 1024 // 默认1MB/s
    }
  }

  // 视频压缩函数
  const compressVideo = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const video = document.createElement('video')
      
      video.onloadedmetadata = () => {
        // 设置压缩后的尺寸（保持4:3比例）
        const maxWidth = 640
        const maxHeight = 480
        let { width, height } = video
        
        // 保持4:3比例
        const aspectRatio = 4/3
        if (width / height > aspectRatio) {
          // 视频太宽，以高度为准
          height = Math.min(height, maxHeight)
          width = height * aspectRatio
        } else {
          // 视频太高，以宽度为准
          width = Math.min(width, maxWidth)
          height = width / aspectRatio
        }
        
        // 确保尺寸为整数
        width = Math.round(width)
        height = Math.round(height)
        
        canvas.width = width
        canvas.height = height
        
        // 根据网络状况动态调整压缩参数
        const connection = (navigator as any).connection
        const isSlowNetwork = connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')
        
        const fps = isSlowNetwork ? 10 : 15 // 慢速网络使用更低帧率
        const bitrate = isSlowNetwork ? 250000 : 500000 // 慢速网络使用更低比特率
        
        const stream = canvas.captureStream(fps)
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp8',
          videoBitsPerSecond: bitrate
        })
        
        const chunks: BlobPart[] = []
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
        mediaRecorder.onstop = () => {
          const compressedBlob = new Blob(chunks, { type: 'video/webm' })
          const compressedFile = new File([compressedBlob], file.name, { type: 'video/webm' })
          resolve(compressedFile)
        }
        
        mediaRecorder.onerror = reject
        
        // 开始录制压缩视频
        mediaRecorder.start()
        video.play()
        
        // 绘制视频帧到canvas
        const drawFrame = () => {
          if (video.ended || video.paused) {
            mediaRecorder.stop()
            return
          }
          ctx?.drawImage(video, 0, 0, width, height)
          requestAnimationFrame(drawFrame)
        }
        drawFrame()
      }
      
      video.onerror = reject
      video.src = URL.createObjectURL(file)
    })
  }

  // 重置状态并重新录制
  const resetVideo = async () => {
    addDebugLog("重置视频录制状态...")

    // 停止录制但保持摄像头流
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }

    // 清理计时器
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    // 清理本地预览URL
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl)
    }

    // 重置状态
    setRecordedBlob(null)
    setPreviewUrl(null)
    setUploadProgress(0)
    setUploadError(null)
    setUploadSuccess(false)
    setUploadSpeed("")
    setCurrentView("camera")
    setIsRecording(false)
    setRecordingTime(0)

    // 如果摄像头流不存在，重新初始化
    if (!streamRef.current || !cameraReady) {
      await initializeCamera()
    }
  }

  // 设备检查中
  if (!deviceCheckComplete) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">{t("checkinModal.cameraLoading")}</p>
          </div>
        </div>
      </div>
    )
  }

  // 无摄像头设备
  if (hasCameraDevice === false) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <VideoOff className="w-6 h-6 text-yellow-600" />
          <div>
            <p className="font-medium text-yellow-800">{t("checkinModal.cameraError")}</p>
            <p className="text-sm text-yellow-700">{t("checkinModal.cameraPermissionDenied")}</p>
          </div>
        </div>

        <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
          <VideoOff className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-3">{t("checkinModal.noCamera")}</p>
          <Button variant="outline" disabled>
            {t("checkinModal.noCameraButton")}
          </Button>
        </div>
      </div>
    )
  }

  // 如果已有视频URL且上传成功，显示已保存状态
  if (uploadSuccess && previewUrl && currentView !== "preview") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center text-green-600">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            <span className="font-medium">{t("checkinModal.videoSaved")}</span>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentView("preview")}
              className="bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-white"
            >
              <Play className="w-4 h-4 mr-1" />
              {t("checkinModal.preview")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetVideo}
              className="bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-white"
            >
              <Camera className="w-4 h-4 mr-1" />
              {t("checkinModal.reRecord")}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 w-full max-w-full" ref={containerRef}>
      {/* 摄像头错误提示 */}
      {cameraError && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
          <AlertCircle className="w-4 h-4" />
          <div>
            <p>{t("checkinModal.cameraError")}</p>
            <Button variant="link" size="sm" onClick={initializeCamera} className="p-0 h-auto text-yellow-700">
              {t("checkinModal.retry")}
            </Button>
          </div>
        </div>
      )}

      {/* 上传错误提示 */}
      {uploadError && (
        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          <AlertCircle className="w-4 h-4" />
          {t("checkinModal.uploadFailed")}
        </div>
      )}

      {/* 视频容器 - 优化为4:3比例，响应式设计 */}
      <div className="relative bg-black rounded-lg overflow-hidden" style={{ 
        width: "100%", 
        height: "0", 
        paddingBottom: "75%", // 4:3比例 (3/4 = 0.75)
        maxHeight: "480px", // 最大高度限制
        minHeight: "300px"  // 最小高度保证
      }}>
        {/* 摄像头预览 - 始终保持在DOM中，使用CSS控制显示/隐藏 */}
        <video
          ref={liveVideoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            transform: "scaleX(-1)", // 只对摄像头预览应用镜像效果
            display: currentView === "camera" ? "block" : "none", // 使用CSS控制显示/隐藏
          }}
        />

        {/* 录制结果预览 - 始终保持在DOM中，使用CSS控制显示/隐藏 */}
        {previewUrl && (
          <video
            ref={previewVideoRef}
            src={previewUrl}
            controls
            autoPlay
            className="absolute inset-0 w-full h-full object-contain"
            style={{
              display: currentView === "preview" ? "block" : "none", // 使用CSS控制显示/隐藏
              transform: "none", // 不对预览视频应用镜像效果
            }}
            onLoadedMetadata={() => {
              addDebugLog("预览视频加载完成")
            }}
          />
        )}

        {/* 摄像头初始化中 */}
        {cameraInitializing && currentView === "camera" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
            <div className="text-center text-white">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p>{t("checkinModal.cameraLoading")}</p>
            </div>
          </div>
        )}

        {/* 摄像头未初始化 */}
        {!cameraReady && !cameraInitializing && !cameraError && currentView === "camera" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
            <div className="text-center text-white">
              <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>{t("checkinModal.startRecording")}</p>
            </div>
          </div>
        )}

        {/* 录制中指示器 */}
        {isRecording && (
          <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            {t("checkinModal.recording")} {formatTime(recordingTime)}
          </div>
        )}

        {/* Overlay Re-record Button when previewing and not uploaded */}
        {previewUrl && currentView === "preview" && !isUploading && !uploadSuccess && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              variant="outline"
              size="lg"
              onClick={resetVideo}
              className="bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-white"
            >
              <Camera className="w-5 h-5 mr-2" />
              {t("checkinModal.reRecord")}
            </Button>
          </div>
        )}

        {/* 预览模式关闭按钮 */}
        {currentView === "preview" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView("camera")}
            className="absolute top-2 right-2 bg-black bg-opacity-50 text-white hover:bg-opacity-70"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* 上传进度 */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{t("checkinModal.uploading")}</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
          {recordedBlob && (
            <div className="text-xs text-muted-foreground text-center">
              {t("checkinModal.fileSize")} {formatFileSize(recordedBlob.size)} | {t("checkinModal.speed")} {uploadSpeed}
            </div>
          )}
        </div>
      )}

      {/* 操作按钮 - 根据当前状态显示不同按钮 */}
      <div className="flex space-x-2">
        {currentView === "camera" && !isRecording && (
          <Button
            onClick={cameraReady ? startRecording : initializeCamera}
            className="bg-red-600 hover:bg-red-700 text-white flex-1"
            disabled={cameraInitializing}
          >
            <Camera className="w-4 h-4 mr-2" />
            {cameraReady ? t("checkinModal.startRecordingBtn") : t("checkinModal.openCamera")}
          </Button>
        )}

        {currentView === "camera" && isRecording && (
          <Button onClick={stopRecording} className="bg-red-600 hover:bg-red-700 text-white flex-1">
            <Square className="w-4 h-4 mr-1" />
            {t("checkinModal.stopRecording")}
          </Button>
        )}

        {/* 预览时的重新录制按钮 */}
        {previewUrl && currentView === "preview" && !isUploading && !uploadSuccess && (
          <Button
            variant="outline"
            size="sm"
            onClick={resetVideo}
            className="bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-white"
          >
            <Camera className="w-4 h-4 mr-1" />
            {t("checkinModal.reRecord")}
          </Button>
        )}

        {currentView === "preview" && uploadSuccess && (
          <Button 
            variant="outline" 
            onClick={resetVideo} 
            className="flex-1 bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-white"
          >
            <Camera className="w-4 h-4 mr-1" />
            {t("checkinModal.reRecord")}
          </Button>
        )}
      </div>

      {/* 调试信息 - 开发时使用，生产环境可以注释掉 */}
      {/* <div className="mt-4 p-2 bg-gray-100 rounded text-xs font-mono text-gray-700 max-h-32 overflow-y-auto">
        <pre>{debugInfo}</pre>
      </div> */}
    </div>
  )
}

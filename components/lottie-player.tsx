"use client"

import { useEffect, useRef, useState } from "react"

interface LottiePlayerProps {
  src: string
  onLoad?: () => void
  className?: string
}

export default function LottiePlayer({ src, onLoad, className = "" }: LottiePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!containerRef.current || !src) return

    const container = containerRef.current
    let timeoutId: NodeJS.Timeout

    // 快速加载检测
    const quickLoadCheck = setTimeout(() => {
      if (!isLoaded) {
        setIsLoaded(true)
        onLoad?.()
      }
    }, 100)

    // 创建iframe
    const iframe = document.createElement("iframe")
    iframe.style.width = "100%"
    iframe.style.height = "100%"
    iframe.style.border = "none"
    iframe.style.background = "transparent"
    iframe.setAttribute("loading", "eager")

    // 优化的HTML内容，减少加载时间
    const iframeContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              width: 100vw; 
              height: 100vh; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              background: transparent;
              overflow: hidden;
            }
            dotlottie-player, lottie-player { 
              width: 100% !important; 
              height: 100% !important; 
              max-width: 100%;
              max-height: 100%;
            }
          </style>
        </head>
        <body>
          <script src="https://unpkg.com/@dotlottie/player-component@latest/dist/dotlottie-player.mjs" type="module"></script>
          <script src="https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js"></script>
          <script>
            const src = "${src}";
            const isDotLottie = src.includes('.lottie');
            
            if (isDotLottie) {
              document.body.innerHTML = '<dotlottie-player src="' + src + '" background="transparent" speed="1" loop autoplay></dotlottie-player>';
            } else {
              document.body.innerHTML = '<lottie-player src="' + src + '" background="transparent" speed="1" loop autoplay></lottie-player>';
            }
            
            // 快速标记为已加载
            setTimeout(() => {
              parent.postMessage('lottie-loaded', '*');
            }, 50);
          </script>
        </body>
      </html>
    `

    // 监听加载消息
    const handleMessage = (event: MessageEvent) => {
      if (event.data === "lottie-loaded") {
        clearTimeout(quickLoadCheck)
        setIsLoaded(true)
        onLoad?.()
      }
    }

    window.addEventListener("message", handleMessage)

    // 设置iframe内容
    iframe.onload = () => {
      const doc = iframe.contentDocument || iframe.contentWindow?.document
      if (doc) {
        doc.open()
        doc.write(iframeContent)
        doc.close()
      }
    }

    // 错误处理
    iframe.onerror = () => {
      clearTimeout(quickLoadCheck)
      setHasError(true)
      setIsLoaded(true)
      onLoad?.()
    }

    // 超时处理 - 减少到1秒
    timeoutId = setTimeout(() => {
      if (!isLoaded) {
        setIsLoaded(true)
        onLoad?.()
      }
    }, 1000)

    container.appendChild(iframe)

    return () => {
      clearTimeout(quickLoadCheck)
      clearTimeout(timeoutId)
      window.removeEventListener("message", handleMessage)
      if (container.contains(iframe)) {
        container.removeChild(iframe)
      }
    }
  }, [src, onLoad, isLoaded])

  if (hasError) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-white/50 text-sm">动画加载失败</div>
      </div>
    )
  }

  return <div ref={containerRef} className={className} />
}

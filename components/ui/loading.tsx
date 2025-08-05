import { cn } from "@/lib/utils"

interface LoadingProps {
  size?: "sm" | "md" | "lg"
  className?: string
  text?: string
  showText?: boolean
}

export function Loading({ 
  size = "md", 
  className,
  text = "加载中...",
  showText = true 
}: LoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  }

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className={cn(
        "animate-spin rounded-full border-2 border-white border-t-transparent",
        sizeClasses[size]
      )} />
      {showText && (
        <p className="mt-4 text-white/70 text-sm">{text}</p>
      )}
    </div>
  )
}

// 全屏Loading组件
export function FullScreenLoading({ 
  size = "lg",
  text = "加载中...",
  className 
}: Omit<LoadingProps, "showText">) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <Loading size={size} text={text} className={className} />
    </div>
  )
} 
// 调试工具库
export const DEBUG = true // 设置为true启用详细日志

export function logInfo(component: string, message: string, data?: any) {
  if (DEBUG) {
    console.log(`[${component}] ${message}`, data || "")
  }
}

export function logWarning(component: string, message: string, data?: any) {
  if (DEBUG) {
    console.warn(`[${component}] ⚠️ ${message}`, data || "")
  }
}

export function logError(component: string, message: string, error?: any) {
  if (DEBUG) {
    console.error(`[${component}] 🔴 ${message}`, error || "")
    if (error?.stack) {
      console.error(`[${component}] Stack:`, error.stack)
    }
  }
}

export function logNetworkRequest(url: string, method: string, body?: any) {
  if (DEBUG) {
    console.log(`📡 Network Request: ${method} ${url}`, body || "")
  }
}

export function logNetworkResponse(url: string, status: number, data?: any) {
  if (DEBUG) {
    const emoji = status >= 200 && status < 300 ? "✅" : "❌"
    console.log(`${emoji} Network Response (${status}): ${url}`, data || "")
  }
}

export function logEnvironment() {
  if (DEBUG) {
    console.log("🔍 Environment Check:")
    console.log("- Window object exists:", typeof window !== "undefined")
    console.log("- Document object exists:", typeof document !== "undefined")
    console.log("- Navigator object exists:", typeof navigator !== "undefined")
    console.log("- Fetch API exists:", typeof fetch !== "undefined")
    console.log("- User Agent:", typeof navigator !== "undefined" ? navigator.userAgent : "N/A")
    console.log("- NEXT_PUBLIC_SITE_URL exists:", typeof process !== "undefined" && !!process.env.NEXT_PUBLIC_SITE_URL)
    if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL) {
      console.log("- NEXT_PUBLIC_SITE_URL value:", process.env.NEXT_PUBLIC_SITE_URL)
    }
  }
}

// Plausible Analytics 类型声明
declare global {
  interface Window {
    plausible?: (eventName: string) => void
  }
}

export {} 
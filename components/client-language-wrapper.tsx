"use client"

import { useEffect, useState } from 'react'

interface ClientLanguageWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function ClientLanguageWrapper({ children, fallback }: ClientLanguageWrapperProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
} 
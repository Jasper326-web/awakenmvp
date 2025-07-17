import './globals.css'
import type { ReactNode } from "react"
import type { Metadata } from "next"
import RootLayoutClient from "./root-layout-client"
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: "Awaken - 戒色成长平台",
  description: "专业的戒色成长平台，帮助您重新掌控人生",
  generator: "v0.dev",
}

/**
 * Server-side root layout.
 * Merely renders the client layout so we can keep metadata on the server.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh">
      <body className="bg-background min-h-screen overflow-x-hidden">
        <RootLayoutClient>
          {children}
        </RootLayoutClient>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
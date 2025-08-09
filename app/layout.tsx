import './globals.css'
import type { ReactNode } from "react"
import type { Metadata } from "next"
import RootLayoutClient from "./root-layout-client"
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: "Awaken: Nofap Growth Hub",
  description: "Professional abstinence growth platform, helping you regain control of your life",
  generator: "v0.dev",
  icons: {
    icon: '/fire.png',
    shortcut: '/fire.png',
    apple: '/fire.png',
  },
}

/**
 * Server-side root layout.
 * Merely renders the client layout so we can keep metadata on the server.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh">
      <head>
        <script async defer data-domain="awakenhub.org" src="https://plausible.io/js/plausible.js"></script>
      </head>
      <body className="bg-background min-h-screen overflow-x-hidden">
        <RootLayoutClient>
          {children}
        </RootLayoutClient>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
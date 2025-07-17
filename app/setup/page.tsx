"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { useLanguage } from '@/lib/lang-context'

export default function SetupPage() {
  const { t } = useLanguage()
  const [isCreatingBucket, setIsCreatingBucket] = useState(false)
  const [bucketCreated, setBucketCreated] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createAvatarsBucket = async () => {
    setIsCreatingBucket(true)
    setError(null)

    try {
      const response = await fetch("/api/create-avatars-bucket")
      const data = await response.json()

      if (response.ok) {
        setBucketCreated(true)
      } else {
        setError(data.error || "创建存储桶失败")
      }
    } catch (err) {
      setError("请求失败，请检查网络连接")
      console.error("创建存储桶请求失败:", err)
    } finally {
      setIsCreatingBucket(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#2e2a5d] flex items-center justify-center p-4 starry-background">
      <Card className="glassmorphism border-0 shadow-lg w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-white">{t("setup.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">{t("setup.create_bucket")}</span>
              {bucketCreated ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : error ? (
                <XCircle className="w-5 h-5 text-red-400" />
              ) : (
                <span className="text-white/70 text-sm">{t("setup.not_created")}</span>
              )}
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-900/30 p-3 rounded-md text-red-400 text-sm">{error}</div>
            )}

            <Button
              onClick={createAvatarsBucket}
              disabled={isCreatingBucket || bucketCreated}
              className="w-full bg-white/20 hover:bg-white/30 text-white"
            >
              {isCreatingBucket ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("setup.creating")}
                </>
              ) : bucketCreated ? (
                t("setup.created")
              ) : (
                t("setup.create_bucket")
              )}
            </Button>
          </div>

          <div className="text-white/70 text-sm">
            <p>{t("setup.desc")}</p>
            <p className="mt-2">{t("setup.complete_desc")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

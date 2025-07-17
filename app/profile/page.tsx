"use client"
import dynamic from "next/dynamic"
import { useLanguage } from '@/lib/lang-context'
import { CoralSeparator } from '@/components/ui/separator';
const ProfileNew = dynamic(() => import("@/components/profile-new"), { ssr: false })

export default function ProfilePage() {
  const { t } = useLanguage()
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t("profile.title")}
          </h1>
          <p className="text-gray-300 text-lg">
            {t("profile.subtitle")}
          </p>
        </div>
        <CoralSeparator />
        <ProfileNew />
      </div>
    </div>
  )
}

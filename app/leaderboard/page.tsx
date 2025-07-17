"use client"
import Leaderboard from "@/components/leaderboard"
import { CoralSeparator } from '@/components/ui/separator';
import { useLanguage } from '@/lib/lang-context'

export default function LeaderboardPage() {
  const { t } = useLanguage()
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t("leaderboard.title")}
          </h1>
          <p className="text-gray-300 text-lg">
            {t("leaderboard.subtitle")}
          </p>
        </div>
        <CoralSeparator />
        <Leaderboard />
      </div>
    </div>
  )
}

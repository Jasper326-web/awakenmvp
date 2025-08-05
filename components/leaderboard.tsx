"use client"

import { useState, useEffect } from "react"
import { Trophy, Award, Medal } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import { authService } from "@/lib/auth"
import { useLanguage } from "@/lib/lang-context"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface LeaderboardUser {
  id: string
  username: string
  current_streak: number
  total_days: number
  avatar_url?: string
  rank: number
}

export default function Leaderboard() {
  const { t } = useLanguage()
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [myRank, setMyRank] = useState<LeaderboardUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      const user = await authService.getCurrentUser()
      setCurrentUserId(user?.id || null)
      loadLeaderboard(user?.id || null)
    })()
  }, [])

  const loadLeaderboard = async (myId: string | null) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, username, current_streak, total_days, avatar_url")
        .order("current_streak", { ascending: false })
        .order("total_days", { ascending: false })
        .limit(100)

      if (error) {
        console.error("获取排行榜失败:", error)
        return
      }

      const sorted = (data || [])
        .filter(u => u.current_streak > 0)
        .sort((a, b) => b.current_streak - a.current_streak || b.total_days - a.total_days)
        .map((u, i) => ({ ...u, rank: i + 1 }))

      setUsers(sorted.slice(0, 10))

      if (myId) {
        const my = sorted.find(u => u.id === myId)
        if (my) setMyRank(my)
        else {
          const { data: myself } = await supabase
            .from("users")
            .select("id, username, current_streak, total_days, avatar_url")
            .eq("id", myId)
            .single()
          if (myself) {
            const myRankNum = (data || []).filter(u => u.current_streak > myself.current_streak || (u.current_streak === myself.current_streak && u.total_days > myself.total_days)).length + 1
            setMyRank({ ...myself, rank: myRankNum })
          }
        }
      }
    } catch (error) {
      console.error("加载排行榜异常:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-6 h-6 text-yellow-400" />
      case 1:
        return <Award className="w-6 h-6 text-gray-300" />
      case 2:
        return <Medal className="w-6 h-6 text-amber-600" />
      default:
        return (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-white font-bold text-sm">
            {index + 1}
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white border-t-transparent mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {myRank && (
          <div className="mb-6 p-6 rounded-xl bg-gradient-to-r from-green-400/20 to-blue-400/20 flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-4 min-w-0">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                {(myRank.username || t("leaderboard.me")).charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-baseline space-x-2">
                  <span className="text-xl font-bold text-white truncate max-w-[120px]">{myRank.username || t("leaderboard.me")}</span>
                  <span className="text-green-400 text-base font-semibold">({t("leaderboard.myRank").replace('{rank}', myRank.rank.toString())})</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-8">
              <div className="text-right">
                <div className="text-gray-300 text-sm">{t("leaderboard.currentStreak")}</div>
                <div className="text-2xl font-bold text-green-400">{myRank.current_streak} <span className="text-base text-gray-300">{t("leaderboard.days")}</span></div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {users.map((user, index) => (
            <div
              key={user.id}
              className={`flex items-center justify-between p-4 rounded-lg transition-all hover:scale-105 ${
                index === 0
                  ? "bg-gradient-to-r from-yellow-400/20 to-orange-400/20"
                  : index === 1
                    ? "bg-gradient-to-r from-gray-300/20 to-gray-400/20"
                    : index === 2
                      ? "bg-gradient-to-r from-amber-600/20 to-amber-700/20"
                      : "bg-white/5"
              }`}
            >
              <div className="flex items-center gap-4">
                {getRankIcon(index)}

                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                  {(user.username || t("leaderboard.user")).charAt(0).toUpperCase()}
                </div>

                <div>
                  <p className="text-white font-medium">{user.username || t("leaderboard.anonymous")}</p>
                  <p className="text-white/60 text-sm">{t("leaderboard.hero")}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold text-green-400">{user.current_streak}</p>
                <p className="text-white/60 text-sm">{t("leaderboard.currentStreakShort")}</p>
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <div className="text-center py-12">
              <p className="text-white/70 text-lg">{t("leaderboard.noData")}</p>
              <p className="text-white/50 text-sm mt-2">{t("leaderboard.beFirst")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

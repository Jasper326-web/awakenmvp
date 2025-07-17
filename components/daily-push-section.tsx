"use client"
import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { Sparkles, Crown } from "lucide-react";
import { useLanguage } from '@/lib/lang-context';

// 在文件顶部添加表情数组和随机选择逻辑
const EMOJIS = [
  "🌟", "💡", "🔥", "🌈", "✨", "🦾", "💪", "🧘‍♂️", "🧠", "🎯", "🌞", "🌻", "🍀", "🚀", "🎉", "😃", "😎", "🥇", "🏆", "🦋"
];
function getRandomEmoji() {
  return EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
}

export default function DailyPushSection() {
  const { isPremium, loading } = useUser();
  const [push, setPush] = useState<any>(null);
  const [loadingPush, setLoadingPush] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (loading) return;
    const fetchDailyPush = async () => {
      if (!isPremium) return;
      setLoadingPush(true);
      try {
        const today = new Date().toISOString().slice(0, 10);
        const response = await fetch(`/api/daily-push?date=${today}`);
        if (response.ok) {
          const data = await response.json();
          setPush(data);
        }
      } catch (error) {
        console.error("获取每日推送失败:", error);
      } finally {
        setLoadingPush(false);
      }
    };
    fetchDailyPush();
  }, [isPremium, loading]);

  // loading skeleton
  if (loading || loadingPush) {
    return (
      <div className="bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-900 rounded-xl p-8 mt-8 mb-8 shadow-lg animate-pulse min-h-[120px]">
        <div className="flex items-center gap-3 mb-4">
          <Crown className="w-7 h-7 text-yellow-300" />
          <span className="text-2xl font-bold text-white">{t("daily_push.title")}</span>
          <span className="ml-auto bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 font-bold rounded-full px-4 py-1 text-sm">{t("daily_push.member_exclusive")}</span>
        </div>
        <div className="h-6 bg-white/10 rounded mb-2 w-2/3"></div>
        <div className="h-6 bg-white/10 rounded mb-2 w-1/2"></div>
      </div>
    );
  }

  // 非会员
  if (!isPremium) {
    return (
      <div className="bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-900 rounded-xl p-8 mt-8 mb-8 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Crown className="w-7 h-7 text-yellow-300" />
          <span className="text-2xl font-bold text-white">{t("daily_push.title")}</span>
          <span className="ml-auto bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 font-bold rounded-full px-4 py-1 text-sm">{t("daily_push.member_exclusive")}</span>
        </div>
        <div className="flex flex-col items-center text-center py-6">
          <Sparkles className="w-10 h-10 text-yellow-200 mb-2" />
          <div className="text-lg font-medium text-white/90 mb-2">{t("daily_push.unlock_title")}</div>
          <div className="text-white/60 mb-4">{t("daily_push.unlock_desc")}</div>
          <div className="bg-white/10 rounded-lg px-4 py-3 text-white/80 text-base italic max-w-xl mx-auto">
            {t("daily_push.preview_quote")}
          </div>
          <div className="text-xs text-white/40 mt-2">{t("daily_push.preview_label")}</div>
        </div>
      </div>
    );
  }

  // 会员
  if (isPremium && push) {
    return (
      <div className="bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-900 rounded-xl p-8 mt-8 mb-8 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Crown className="w-7 h-7 text-yellow-300" />
          <span className="text-2xl font-bold text-white">{t("daily_push.title")}</span>
          <span className="ml-auto bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 font-bold rounded-full px-4 py-1 text-sm">{t("daily_push.member_exclusive")}</span>
        </div>
        <div className="flex flex-col items-center text-center py-6">
          <div className="text-2xl font-extrabold mb-2 max-w-2xl mx-auto break-words leading-loose bg-gradient-to-r from-yellow-200 via-yellow-300 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_1px_8px_rgba(255,230,100,0.5)]">
            {getRandomEmoji()} {push.content} {getRandomEmoji()}
          </div>
          <div className="text-xs text-white mt-2">{t("daily_push.footer")}</div>
        </div>
      </div>
    );
  }

  return null;
} 
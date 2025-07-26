"use client"
import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { useLanguage } from '@/lib/lang-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Crown, Sparkles } from "lucide-react";

// 表情数组和随机选择逻辑
const EMOJIS = [
  "🌟", "💡", "🔥", "🌈", "✨", "🦾", "💪", "🧘‍♂️", "🧠", "🎯", "🌞", "🌻", "🍀", "🚀", "🎉", "😃", "😎", "🥇", "🏆", "🦋"
];
function getRandomEmoji() {
  return EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
}

export default function DailyPushModal() {
  const { isPremium } = useUser();
  const { t, language } = useLanguage();
  const [push, setPush] = useState<any>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isPremium) return;
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem("push_shown_" + today)) return;
    
    fetch(`/api/daily-push?date=${today}&lang=${language}`)
      .then(res => res.json())
      .then(data => {
        setPush(data);
        setOpen(true);
        localStorage.setItem("push_shown_" + today, "1");
      })
      .catch(error => {
        console.error("获取每日推送失败:", error);
      });
  }, [isPremium, language]);

  if (!push) return null;
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg bg-gradient-to-br from-purple-700 via-purple-800 to-indigo-900 border border-purple-600/50 text-white">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold text-white">
            <Crown className="w-6 h-6 text-yellow-300" />
            {t("daily_push.title")}
            <span className="ml-auto bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 font-bold rounded-full px-3 py-1 text-xs">
              {t("daily_push.member_exclusive")}
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="text-3xl font-extrabold max-w-2xl mx-auto break-words leading-relaxed bg-gradient-to-r from-yellow-200 via-yellow-300 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_1px_8px_rgba(255,230,100,0.5)]">
              {getRandomEmoji()} {push.content} {getRandomEmoji()}
            </div>
            
            <div className="flex items-center gap-2 text-xs text-white/60">
              <Sparkles className="w-4 h-4" />
              {t("daily_push.footer")}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
// 任务生成公共方法
import { Calendar, FileText, Video, Headphones, BookOpen, Sparkles, Brain, Heart, Activity } from "lucide-react"
import React from "react"

export function generateTasksByAddictionLevel(level: string, t?: (key: string, vars?: Record<string, any>) => string) {
  const mantraCount = level === "重度" ? 108 : level === "中度" ? 49 : 21
  const articleCount = level === "重度" ? 3 : level === "中度" ? 2 : 1
  const audioCount = level === "重度" ? 3 : level === "中度" ? 2 : 1

  // 固定普通任务
  const baseTasks = [
    {
      id: "checkin",
      title: t ? t("task.daily_checkin") : "每日打卡",
      description: t
        ? (level === "重度"
            ? t("task.daily_checkin_desc_heavy")
            : level === "中度"
            ? t("task.daily_checkin_desc_moderate")
            : t("task.daily_checkin_desc"))
        : "记录今日状态",
      type: "checkin",
      icon: "Calendar",
      action: "redirect",
      target: "/checkin",
      isFree: true,
    },
    {
      id: "exercise",
      title: t ? t("task.exercise") : "户外散步30min",
      description: t ? t("task.exercise_desc") : "清晨户外慢走30分钟，唤醒阳气",
      type: "exercise",
      icon: "Activity",
      action: "instruction",
      instruction: t ? t("task.exercise_instruction") : "...",
      isFree: true,
    },
    {
      id: "auspicious_rest",
      title: t ? t("task.auspicious_rest") : "吉祥卧10min",
      description: t ? t("task.auspicious_rest_desc") : "睡前右侧卧，修复阳气，安神助眠",
      type: "auspicious_rest",
      icon: "Heart",
      action: "instruction",
      instruction: t ? t("task.auspicious_rest_instruction") : "...",
      isFree: true,
    },
  ]

  // premiumTasks 保持不变
  const premiumTasks = [
    {
      id: "audio",
      title: t ? t("task.audio_listen") : "听戒色录音",
      description: t ? t("task.audio_desc") : "聆听戒色音频，提升意志力" ,
      type: "audio",
      icon: "Headphones",
      action: "modal",
      modalType: "audio",
      isFree: false,
    },
    {
      id: "article",
      title: t ? t("task.article_read") : "读戒色文章",
      description: t ? t("task.article_desc") : "阅读戒色文章，增长智慧",
      type: "article",
      icon: "BookOpen",
      action: "modal",
      modalType: "pdf",
      isFree: false,
    },
    {
      id: "mantra",
      title: t ? t("task.mantra_chant") : "念诵准提神咒",
      description: t ? t("task.mantra_desc") : "净化心灵，增强定力",
      type: "mantra",
      icon: "Sparkles",
      action: "modal",
      modalType: "image",
      isFree: false,
    },
    {
      id: "meditation",
      title: t ? t("task.meditation") : "冥想10-20分钟",
      description: t ? t("task.meditation_desc") : "静心修行，感恩冥想，平复欲望",
      type: "meditation",
      icon: "Brain",
      action: "instruction",
      instruction: t ? t("task.meditation_instruction") : "找一个安静整洁的地方，盘腿而坐，闭上眼睛，专注呼吸，脑海中回想生活中值得感恩的人和事，让内心充满温暖和力量。每次建议10-20分钟。",
      isFree: false,
    },
    {
      id: "sleep",
      title: t ? t("task.sleep") : "吉祥卧（还阳卧）",
      description: t ? t("task.sleep_desc") : "仰卧床上，双手放腰后，双脚合十，感受体内暖流",
      type: "sleep",
      icon: "Heart",
      action: "instruction",
      instruction: t ? t("task.sleep_instruction") : "仰卧在床，双手自然放于腰后，双脚合十，闭上眼睛，感受一股温暖的气流在体内流动，身体会很快热起来。这是中华传统的还阳卧法，有助于恢复精力、平复欲望。",
      isFree: false,
    },
  ]

  return [...baseTasks, ...premiumTasks]
} 
// 任务生成公共方法
import { Calendar, FileText, Video, Headphones, BookOpen, Sparkles, Brain, Heart, Activity } from "lucide-react"
import React from "react"

export function generateTasksByAddictionLevel(level: string, t?: (key: string, vars?: Record<string, any>) => string) {
  const mantraCount = level === "重度" ? 108 : level === "中度" ? 49 : 21
  const articleCount = level === "重度" ? 3 : level === "中度" ? 2 : 1
  const audioCount = level === "重度" ? 3 : level === "中度" ? 2 : 1

  const baseTasks = [
    {
      id: "checkin",
      title: t ? t("task.daily_checkin") : "每日打卡",
      description: t ? t("task.daily_checkin_desc") : "记录今日状态",
      type: "checkin",
      icon: "Calendar",
      action: "redirect",
      target: "/checkin",
      isFree: true,
    },
  ]

  const journalTask = {
    id: "journal",
    title: t ? t("task.journal") : "戒色日志",
    description: t ? t("task.journal_desc") : "记录今日感悟",
    type: "journal",
    icon: "FileText",
    action: "redirect",
    target: "/checkin",
    isFree: true,
  }

  const videoTask = {
    id: "video",
    title: t ? t("task.video_checkin") : "视频打卡",
    description: t ? t("task.video_checkin_desc") : "录制视频分享",
    type: "video",
    icon: "Video",
    action: "redirect",
    target: "/video-record",
    isFree: false,
  }

  const premiumTasks = [
    {
      id: "audio",
      title: t ? t("task.audio_listen", { count: audioCount }) : `听戒色录音（第1-${audioCount}集）`,
      description: t ? t("task.audio_desc", { count: audioCount }) : `聆听戒色音频${audioCount}集，提升意志力` ,
      type: "audio",
      icon: "Headphones",
      action: "modal",
      modalType: "audio",
      isFree: false,
    },
    {
      id: "article",
      title: t ? t("task.article_read", { count: articleCount }) : `读戒色文章（第1-${articleCount}章）`,
      description: t ? t("task.article_desc", { count: articleCount }) : `阅读戒色文章${articleCount}章，增长智慧`,
      type: "article",
      icon: "BookOpen",
      action: "modal",
      modalType: "pdf",
      isFree: false,
    },
    {
      id: "mantra",
      title: t ? t("task.mantra_chant", { count: mantraCount }) : `念诵准提神咒${mantraCount}遍`,
      description: t ? t("task.mantra_desc", { count: mantraCount }) : `净化心灵，增强定力，今日目标${mantraCount}遍`,
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

  const exerciseTask = {
    id: "exercise",
    title: t ? t("task.exercise") : "有氧运动10min",
    description: t ? t("task.exercise_desc") : "增强体质，吸收自然能量",
    type: "exercise",
    icon: "Activity",
    action: "instruction",
    instruction: t ? t("task.exercise_instruction") : "进行10分钟有氧运动，如跑步、跳绳、快走等，提高心率，增强体质。推荐在公园晨跑，拥抱大树等户外活动，吸收自然能量。",
    isFree: true,
  }

  switch (level) {
    case "轻度":
      return [...baseTasks, exerciseTask, ...premiumTasks]
    case "中度":
      return [...baseTasks, journalTask, exerciseTask, ...premiumTasks]
    case "重度":
      return [...baseTasks, journalTask, videoTask, exerciseTask, ...premiumTasks]
    default:
      return [...baseTasks, exerciseTask, ...premiumTasks]
  }
} 
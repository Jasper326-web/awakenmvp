import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic'

// 默认的中文每日推送内容
const DEFAULT_DAILY_PUSHES = {
  "2025-01-21": {
    content: "真正的成长不是战胜别人，而是超越昨天的自己。每一次坚持，都是对未来的投资。",
    content_en: "True growth is not about defeating others, but about surpassing yesterday's self. Every moment of persistence is an investment in your future.",
    author: "每日智慧",
    author_en: "Daily Wisdom"
  },
  "2025-01-22": {
    content: "戒色不是剥夺，而是获得。获得更清晰的思维，更强的意志力，更美好的生活。",
    content_en: "NoFap is not deprivation, but acquisition. You gain clearer thinking, stronger willpower, and a better life.",
    author: "心灵成长",
    author_en: "Spiritual Growth"
  },
  "2025-01-23": {
    content: "当你感到困难时，记住：每一个伟大的改变都始于一个勇敢的决定。",
    content_en: "When you feel difficulty, remember: every great change begins with a brave decision.",
    author: "励志语录",
    author_en: "Motivational Quote"
  },
  "2025-01-24": {
    content: "时间会证明，你的坚持是值得的。今天的努力，是明天成功的基石。",
    content_en: "Time will prove that your persistence is worth it. Today's efforts are the foundation of tomorrow's success.",
    author: "时间见证",
    author_en: "Time Witness"
  },
  "2025-01-25": {
    content: "真正的力量来自于内心的平静。当你掌控了自己的欲望，你就掌控了整个世界。",
    content_en: "True power comes from inner peace. When you control your desires, you control the entire world.",
    author: "内心力量",
    author_en: "Inner Strength"
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().slice(0, 10);
    const language = searchParams.get('lang') || 'zh'; // 默认中文

    // 从 daily_pushes 表获取指定日期的推送内容
    const { data, error } = await supabase
      .from('daily_pushes')
      .select('*')
      .eq('push_date', date)
      .single();

    if (error || !data) {
      // 如果没有数据库内容，使用默认的内容
      const defaultContent = DEFAULT_DAILY_PUSHES[date as keyof typeof DEFAULT_DAILY_PUSHES];
      
      if (defaultContent) {
        if (language === 'en') {
          return NextResponse.json({
            content: defaultContent.content_en || defaultContent.content,
            author: defaultContent.author_en || defaultContent.author,
            push_date: date,
            language: 'en'
          });
        } else {
          return NextResponse.json({
            content: defaultContent.content,
            author: defaultContent.author,
            push_date: date,
            language: 'zh'
          });
        }
      }
      
      // 如果连默认内容都没有，返回一个通用的内容
      const fallbackContent = language === 'en' 
        ? "Every day is a new beginning, every moment of persistence is an investment in your future. Believe in yourself, you are becoming better."
        : "每一天都是新的开始，每一次坚持都是对未来的投资。相信自己，你正在变得更好。";
      
      const fallbackAuthor = language === 'en' ? "Daily Motivation" : "每日激励";
      
      return NextResponse.json({
        content: fallbackContent,
        author: fallbackAuthor,
        push_date: date,
        language: language
      });
    }

    // 如果有数据库内容，根据语言返回对应内容
    if (language === 'zh' && data.content_zh) {
      return NextResponse.json({
        ...data,
        content: data.content_zh,
        language: 'zh'
      });
    } else if (language === 'en' && data.content_en) {
      return NextResponse.json({
        ...data,
        content: data.content_en,
        language: 'en'
      });
    } else {
      // 如果没有对应语言的内容，返回默认语言（中文）
      return NextResponse.json({
        ...data,
        content: data.content_zh || data.content || "每一天都是新的开始，每一次坚持都是对未来的投资。",
        language: 'zh'
      });
    }
  } catch (error) {
    console.error('Daily push API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
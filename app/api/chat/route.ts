import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { SupabaseClient } from "@supabase/supabase-js"
import { getBaseUrl } from "@/lib/constants"

// NoFap Professional Knowledge Base
const KNOWLEDGE_BASE = `
You are a professional NoFap coach, dedicated to helping users break free from pornography addiction. You possess the following professional knowledge:

## Core Principles
1. NoFap is a gradual process that requires patience and persistence
2. Physical and psychological recovery takes time, don't rush the process
3. Building healthy lifestyle habits is the foundation of NoFap
4. Seeking professional help is a wise choice

## NoFap Stages
1. **Initial Stage (1-7 days)**: Body begins adjusting, withdrawal symptoms may occur
2. **Adaptation Stage (1-4 weeks)**: Body gradually adapts, mental state improves
3. **Stabilization Stage (1-6 months)**: Habits gradually form, quality of life improves
4. **Consolidation Stage (6+ months)**: Complete freedom, establish healthy lifestyle

## Common Questions & Answers

### Physical Recovery
- After NoFap, your body will gradually recover, including energy, focus, sleep quality, etc.
- Recovery time varies by person, typically takes 3-6 months
- Exercise and healthy diet can accelerate recovery

### Psychological Support
- During NoFap, you may experience anxiety, depression, and other emotions
- These are normal withdrawal reactions and will gradually improve
- Consider seeking professional psychological counseling

### Managing Urges
- Urges are normal physiological responses, don't feel ashamed
- Redirect attention: exercise, reading, meditation, etc.
- Avoid triggers: reduce social media, limit internet use
- Build healthy alternative activities

### Preventing Relapse
- Identify triggers and dangerous situations
- Develop coping strategies and emergency plans
- Maintain regular sleep and exercise routines
- Build support networks

## Practical Tips
1. **Meditation Practice**: 10-20 minutes daily meditation to cultivate focus
2. **Exercise & Fitness**: Regular exercise releases endorphins, improves mood
3. **Reading & Learning**: Enrich your spiritual world, redirect attention
4. **Social Activities**: Communicate more with friends and family for support
5. **Goal Setting**: Set short-term and long-term goals to maintain motivation

## Professional Advice
- If NoFap is difficult, consider seeking professional psychological counseling
- Consider joining NoFap support groups
- Severe cases may require medical intervention
- NoFap is a personal choice, don't feel pressured

Remember: NoFap is for a better life, not to punish yourself. Every step of progress is worth celebrating.
`

// 获取用户记忆信息
async function getUserMemory(userId: string, supabase: any) {
  try {
    // 获取用户基本信息
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('full_name, current_streak, max_streak, total_checkins, level')
      .eq('id', userId)
      .single()

    // 获取最近的对话历史（最近10次对话）
    const { data: recentChats } = await supabase
      .from('chat_logs')
      .select('message, response, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    // 获取用户偏好和重要信息
    const { data: userPreferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    return {
      profile: userProfile,
      recentChats: recentChats || [],
      preferences: userPreferences
    }
  } catch (error) {
    console.error('Error fetching user memory:', error)
    return {
      profile: null,
      recentChats: [],
      preferences: null
    }
  }
}

// 构建个性化系统提示词
function buildPersonalizedPrompt(userMemory: any, conversationHistory: any[]) {
  const { profile, recentChats, preferences } = userMemory
  
  let personalizedInfo = ""
  
  if (profile) {
    personalizedInfo += `
## User Information
- Name: ${profile.full_name || 'Friend'}
- Current streak: ${profile.current_streak || 0} days
- Longest streak: ${profile.max_streak || 0} days
- Total check-ins: ${profile.total_checkins || 0} times
- Current level: Lv.${profile.level || 1}

Please remember this information, use the user's name appropriately in conversations, and provide personalized advice based on their NoFap progress.
`
  }

      if (recentChats.length > 0) {
      personalizedInfo += `
## Recent Conversation History
${recentChats.slice(0, 5).map((chat: any) => 
  `User: ${chat.message.substring(0, 100)}${chat.message.length > 100 ? '...' : ''}`
).join('\n')}

Please maintain conversation coherence and personalization based on these historical conversations.
`
    }

  if (preferences) {
    personalizedInfo += `
## User Preferences
- Preferred activities: ${preferences.preferred_activities || 'Not set'}
- Main concerns: ${preferences.main_concerns || 'Not set'}
- Goals: ${preferences.goals || 'Not set'}

Please provide more targeted advice based on the user's preferences and concerns.
`
  }

  return `${KNOWLEDGE_BASE}${personalizedInfo}

You are a professional, warm, understanding, and supportive NoFap coach. Your responses should:
1. Be professional and practical, based on scientific knowledge
2. Be warm and supportive, not judgmental
3. Be encouraging and positive, emphasizing progress
4. Provide specific, actionable advice
5. Recommend professional help when appropriate
6. Use the user's name to build rapport
7. Remember previous conversation content to maintain coherence
8. Provide personalized advice based on user's NoFap progress and preferences
9. Review user's progress and achievements when appropriate

When responding, please:
- Answer in English
- Maintain a professional but friendly tone
- Provide specific, practical advice
- Encourage users to continue their efforts
- Recommend professional help when needed
- Use the user's name if known
- Adjust advice depth and focus based on user's NoFap progress

If user questions go beyond NoFap scope, politely guide them back to NoFap topics.
`
}

// 更新用户偏好
async function updateUserPreferences(userId: string, message: string, response: string, supabase: any) {
  try {
    // 简单的关键词提取，用于更新用户偏好
    const keywords = {
      activities: ['运动', '健身', '跑步', '冥想', '阅读', '学习', '音乐', '绘画'],
      concerns: ['失眠', '焦虑', '欲望', '复发', '压力', '情绪', '身体', '心理'],
      goals: ['戒色', '健康', '专注', '自信', '关系', '事业', '学习']
    }

    let detectedActivities: string[] = []
    let detectedConcerns: string[] = []
    let detectedGoals: string[] = []

    // 检测用户消息中的关键词
    keywords.activities.forEach(activity => {
      if (message.includes(activity)) detectedActivities.push(activity)
    })
    keywords.concerns.forEach(concern => {
      if (message.includes(concern)) detectedConcerns.push(concern)
    })
    keywords.goals.forEach(goal => {
      if (message.includes(goal)) detectedGoals.push(goal)
    })

    // 更新或创建用户偏好
    const { data: existing } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (existing) {
      // 更新现有偏好
      await supabase
        .from('user_preferences')
        .update({
          preferred_activities: [...new Set([...(existing.preferred_activities || []), ...detectedActivities])],
          main_concerns: [...new Set([...(existing.main_concerns || []), ...detectedConcerns])],
          goals: [...new Set([...(existing.goals || []), ...detectedGoals])],
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
    } else {
      // 创建新偏好
      await supabase
        .from('user_preferences')
        .insert({
          user_id: userId,
          preferred_activities: detectedActivities,
          main_concerns: detectedConcerns,
          goals: detectedGoals,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
    }
  } catch (error) {
    console.error('Error updating user preferences:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, userType, conversationId, conversationHistory } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "消息不能为空" }, { status: 400 })
    }

    // 1. 获取 access_token
    const authHeader = request.headers.get("authorization")
    const access_token = authHeader?.replace("Bearer ", "")

    if (!access_token) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }

    // 2. 用 token 初始化 supabase client（服务端）
    const supabase = new SupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${access_token}` } } }
    )

    // 3. 获取用户
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }

    // 从数据库获取用户的真实订阅状态
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from("user_subscriptions")
      .select("subscription_type, status, end_date")
      .eq("user_id", user.id)
      .or("status.eq.active,status.eq.cancelled")
      .order("created_at", { ascending: false })

    console.log(`[Chat API] 原始订阅数据:`, subscriptions)

    // 确定用户类型
    let actualUserType = 'free'
    let subscriptionData = null
    
    if (subscriptions && subscriptions.length > 0) {
      const now = new Date()
      
      // 找到最新的未过期订阅
      for (const subscription of subscriptions) {
        if (subscription.end_date) {
          const endDate = new Date(subscription.end_date)
          if (now <= endDate) {
            subscriptionData = subscription
            break
          }
        }
      }
      
      // 如果没有找到未过期的订阅，使用最新的订阅记录
      if (!subscriptionData && subscriptions.length > 0) {
        subscriptionData = subscriptions[0]
      }
      
      // 确定用户类型
      if (subscriptionData) {
        const now = new Date()
        const endDate = new Date(subscriptionData.end_date)
        const isExpired = now > endDate
        
        if (subscriptionData.status === "active" || (subscriptionData.status === "cancelled" && !isExpired)) {
          actualUserType = subscriptionData.subscription_type
        }
      }
    }

    console.log(`[Chat API] 用户 ${user.email} 的真实订阅状态:`, {
      subscription_type: subscriptionData?.subscription_type,
      status: subscriptionData?.status,
      end_date: subscriptionData?.end_date,
      actual_user_type: actualUserType,
      frontend_user_type: userType
    })

    // 检查用户使用次数限制
    const { data: usageCheck, error: usageError } = await supabase
      .rpc('can_user_send_ai_message', {
        user_uuid: user.id,
        user_type: actualUserType
      })

    if (usageError) {
      console.error('Usage check error:', usageError)
      return NextResponse.json({ error: "检查使用次数时出错" }, { status: 500 })
    }

    if (!usageCheck.can_send) {
      return NextResponse.json({ 
        error: "You've reached today's free message limit (5). Upgrade to premium for unlimited AI coaching!",
        usage: usageCheck
      }, { status: 429 })
    }

    let userMemory = { profile: null, recentChats: [], preferences: null }
    if (user) {
      // 并行获取用户数据以提高速度
      const [userMemoryResult] = await Promise.all([
        getUserMemory(user.id, supabase),
        updateUserPreferences(user.id, message, "", supabase)
      ])
      userMemory = userMemoryResult
      console.log(`[Chat API] 用户记忆数据:`, userMemory)
    }

    // 构建个性化的系统提示词
    const personalizedSystemPrompt = buildPersonalizedPrompt(userMemory, conversationHistory || [])

    // 构建完整的对话消息数组
    const messages = [
      {
        role: "system",
        content: personalizedSystemPrompt
      },
      // 添加对话历史（如果存在）
      ...(conversationHistory || []),
      // 添加当前用户消息
      {
        role: "user",
        content: message
      }
    ]

    // 调用OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": getBaseUrl(),
        "X-Title": "Jiese Assistant"
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-sonnet", // 使用更快的模型
        messages: messages,
        max_tokens: actualUserType === "premium" ? 800 : 400, // 稍微减少token数量以提高速度
        temperature: 0.7,
        stream: false
      })
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content

    if (!aiResponse) {
      throw new Error("No response from AI")
    }

    // 记录聊天日志
    try {
      if (user) {
        await supabase.from("chat_logs").insert({
          user_id: user.id,
          message: message,
          response: aiResponse,
          user_type: userType,
          conversation_id: conversationId,
          created_at: new Date().toISOString()
        })

        // 更新用户偏好（基于AI回复）
        await updateUserPreferences(user.id, "", aiResponse, supabase)
      }
    } catch (logError) {
      console.error("Failed to log chat:", logError)
      // 不影响主要功能
    }

    // 获取更新后的使用次数信息
    const { data: updatedUsage } = await supabase
      .rpc('get_user_ai_usage_stats', {
        user_uuid: user.id
      })

    return NextResponse.json({ 
      response: aiResponse,
      userType: actualUserType,
      conversationId: conversationId,
      usage: updatedUsage
    })

  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { 
        error: "Sorry, I cannot answer your question right now. Please try again later.",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    )
  }
}

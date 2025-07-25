"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, X, Send, Crown, Sparkles, Brain, BookOpen, Zap, RotateCcw } from "lucide-react"
import { useSubscription } from "@/hooks/use-subscription"
import { supabase } from "@/lib/supabaseClient"
import { useLanguage } from '@/lib/lang-context'

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
  type?: "text" | "suggestion" | "error"
}

export default function ChatWidget() {
  const { t, language } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [usageStats, setUsageStats] = useState<any>(null)
  const [conversationId, setConversationId] = useState<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { isPro, isPremium } = useSubscription()

  // 初始化欢迎消息
  useEffect(() => {
    setMessages([
      {
        id: "1",
        content: t("ai.welcome"),
        isUser: false,
        timestamp: new Date(),
        type: "text"
      },
    ])
  }, [t, language])

  // 新增会员判断
  const isVip =
    usageStats?.subscription_type === 'premium' ||
    usageStats?.subscription_type === 'pro' ||
    usageStats?.user_type === 'premium' ||
    usageStats?.user_type === 'pro'

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 获取用户使用统计信息
  const fetchUsageStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUsageStats(null);
      return;
    }
    const { data, error } = await supabase.rpc('get_user_ai_usage_stats', { user_uuid: user.id });
    if (error) {
      setUsageStats(null);
      return;
    }
    setUsageStats(data);
  };

  // 生成对话ID
  useEffect(() => {
    if (!conversationId) {
      setConversationId(`conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
    }
  }, [conversationId])

  // 组件加载时获取使用统计
  useEffect(() => {
    fetchUsageStats()
  }, [])

  // 监听打开聊天窗口的事件
  useEffect(() => {
    const handleOpenChat = () => {
      setIsOpen(true)
    }
    
    window.addEventListener('openChatWidget', handleOpenChat)
    
    return () => {
      window.removeEventListener('openChatWidget', handleOpenChat)
    }
  }, [])

  // 快速回复建议 - 根据语言动态生成
  const quickReplies = React.useMemo(() => [
    t("ai.quick_reply_urges"),
    t("ai.quick_reply_insomnia"),
    t("ai.quick_reply_habits"),
    t("ai.quick_reply_recovery"),
    t("ai.quick_reply_relapse")
  ], [t, language])

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    // 检查消息限制（使用新的can_send_today字段）
    if (usageStats && !usageStats.can_send_today) {
      const limitMessage: Message = {
        id: Date.now().toString(),
        content: language === "zh" 
          ? "您已达到今日免费消息限制（5条）。升级会员可享受无限制AI助教服务！"
          : "You have reached today's free message limit (5 messages). Upgrade to premium for unlimited AI coaching!",
        isUser: false,
        timestamp: new Date(),
        type: "error"
      }
      setMessages((prev) => [...prev, limitMessage])
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      // 构建对话历史（保留最近10轮对话）
      const recentMessages = messages.slice(-20) // 保留最近20条消息（10轮对话）
      const conversationHistory = recentMessages.map(msg => ({
        role: msg.isUser ? "user" : "assistant",
        content: msg.content
      }))

      // 正确获取access_token
      const { data: { session } } = await supabase.auth.getSession();
      const access_token = session?.access_token;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(access_token ? { "Authorization": `Bearer ${access_token}` } : {})
        },
        body: JSON.stringify({ 
          message: inputMessage,
          userType: usageStats?.user_type || "free",
          conversationId: conversationId,
          conversationHistory: conversationHistory
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response || (language === "zh" ? "抱歉，我现在无法回答这个问题。" : "Sorry, I cannot answer this question right now."),
          isUser: false,
          timestamp: new Date(),
          type: "text"
        }
        setMessages((prev) => [...prev, aiMessage])
        
        // 更新使用统计
        if (data.usage) {
          setUsageStats(data.usage)
        }
      } else if (response.status === 429) {
        // 处理使用限制错误
        const data = await response.json()
        const limitMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.error || (language === "zh" ? "您已达到今日免费消息限制。" : "You have reached today's message limit."),
          isUser: false,
          timestamp: new Date(),
          type: "error"
        }
        setMessages((prev) => [...prev, limitMessage])
        
        // 更新使用统计
        if (data.usage) {
          setUsageStats(data.usage)
        }
      } else if (response.status === 401) {
        setMessages((prev) => [...prev, {
          id: (Date.now() + 1).toString(),
          content: language === "zh" ? "请先登录后再使用AI助教。" : "Please login first to use AI coaching.",
          isUser: false,
          timestamp: new Date(),
          type: "error"
        }])
      } else {
        throw new Error("Failed to get response")
      }
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: language === "zh" ? "抱歉，我现在遇到了一些问题，请稍后再试。" : "Sorry, I'm experiencing some issues, please try again later.",
        isUser: false,
        timestamp: new Date(),
        type: "error"
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickReply = (reply: string) => {
    setInputMessage(reply)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleResetConversation = () => {
    setMessages([
      {
        id: "1",
        content: t("ai.welcome"),
        isUser: false,
        timestamp: new Date(),
        type: "text"
      },
    ])
    setConversationId(`conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  }

  return (
    <>
      {/* 悬浮聊天按钮 */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 group"
          size="icon"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <div className="relative">
              <MessageCircle className="w-6 h-6" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          )}
        </Button>
        
        {/* 悬浮提示 */}
        {!isOpen && (
          <div className="absolute bottom-16 right-0 bg-slate-800 text-white px-3 py-2 rounded-lg text-sm shadow-lg border border-slate-700 max-w-xs">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span className="truncate">{t("ai.title")}</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {isVip ? t("ai.unlimited") : `${usageStats?.remaining_today || 5}/5 ${t("ai.remaining_today")}`}
            </div>
          </div>
        )}
      </div>

      {/* 聊天弹窗 */}
      {isOpen && (
        <div className="fixed bottom-28 right-6 z-40 w-96 h-[600px]">
          <Card className="w-full h-full bg-gradient-to-br from-slate-800 to-purple-900 border border-purple-700/50 shadow-2xl flex flex-col">
            <CardHeader className="pb-3 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-purple-700/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  {t("ai.title")}
                  {isPro || isPremium ? (
                    <Badge className="ml-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs">
                      <Crown className="w-3 h-3 mr-1" />
                      {t("ai.premium")}
                    </Badge>
                  ) : (
                    <Badge className="ml-2 bg-slate-600 text-gray-300 text-xs">
                      {t("ai.free")}
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleResetConversation}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white hover:bg-white/10"
                    title="重置对话"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setIsOpen(false)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white hover:bg-white/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* 使用状态 */}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{t("ai.today_messages").replace('{count}', (usageStats?.today_usage ?? 0).toString())}</span>
                {isVip ? (
                  <span className="text-green-400">{t("ai.unlimited_use")}</span>
                ) : (
                  <span className="text-orange-400">{t("ai.remaining")} {usageStats?.remaining_today || 5} {t("ai.messages")}</span>
                )}
              </div>
            </CardHeader>
            {/* 消息列表区域 - 可滚动 */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-3">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] p-3 rounded-lg text-sm ${
                        message.isUser 
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" 
                          : message.type === "error"
                            ? "bg-red-500/20 border border-red-500/50 text-red-300"
                            : "bg-white/10 border border-white/20 text-gray-200"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      <div className="text-xs opacity-60 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 border border-white/20 text-gray-200 p-3 rounded-lg text-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
              
              {/* 快速回复建议 */}
              {messages.length === 1 && (
                <div className="p-4 border-t border-white/20">
                  <div className="text-xs text-gray-400 mb-2">💡 {t("ai.quick_replies_title")}：</div>
                  <div className="flex flex-wrap gap-2">
                    {quickReplies.map((reply, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickReply(reply)}
                        className="text-xs bg-white/5 border-white/20 text-gray-300 hover:bg-white/10"
                      >
                        {reply}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* 输入区域 - 固定在底部 */}
            <div className="p-4 border-t border-white/20 bg-slate-800/50">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isVip ? t("ai.input_placeholder") : t("ai.input_placeholder_free")}
                  className="flex-1 bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-purple-500"
                  disabled={isLoading || (usageStats && !usageStats.can_send_today)}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading || (usageStats && !usageStats.can_send_today)}
                  size="icon"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              {/* 升级提示 */}
              {usageStats?.user_type !== 'premium' && usageStats?.remaining_today && usageStats.remaining_today <= 2 && (
                <div className="mt-3 p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Crown className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-300">{t("ai.upgrade_tip")}</span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </>
  )
}

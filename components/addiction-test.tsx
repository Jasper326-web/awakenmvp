"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { UserIcon } from "lucide-react"
import { useLanguage } from "@/lib/lang-context"
import { supabase } from "@/lib/supabaseClient"
import { authService } from "@/lib/auth"
import { useRouter } from "next/navigation"

// 题库数据
const quizQuestions = [
  {
    id: "q1",
    category: "基础类",
    type: "single",
    weight: 8,
    zh: "你几岁开始接触手淫？",
    en: "At what age did you first start masturbating?",
    options: {
      zh: ["10岁前", "10-13", "14-17", "18岁以上"],
      en: ["Before 10", "10-13", "14-17", "After 18"]
    }
  },
  {
    id: "q2",
    category: "基础类",
    type: "single",
    weight: 8,
    zh: "你已经手淫多少年了？",
    en: "How many years have you been masturbating?",
    options: {
      zh: ["<1年", "1-3年", "3-5年", "5年以上"],
      en: ["Less than 1 year", "1-3 years", "3-5 years", "Over 5 years"]
    }
  },
  {
    id: "q3",
    category: "行为类",
    type: "single",
    weight: 10,
    zh: "你现在每周平均几次手淫？",
    en: "On average, how many times do you masturbate per week?",
    options: {
      zh: ["0次", "1-2次", "3-5次", "超过5次"],
      en: ["0 times", "1-2 times", "3-5 times", "More than 5 times"]
    }
  },
  {
    id: "q4",
    category: "基础类",
    type: "single",
    weight: 6,
    zh: "你曾经尝试过戒色吗？",
    en: "Have you ever tried to quit porn or masturbation?",
    options: {
      zh: ["从未尝试", "尝试过一两次", "多次尝试"],
      en: ["Never", "Once or twice", "Multiple times"]
    }
  },
  {
    id: "q5",
    category: "行为类",
    type: "single",
    weight: 6,
    zh: "最长戒色持续了多久？",
    en: "What's the longest period you stayed clean?",
    options: {
      zh: ["不到3天", "一周以内", "1-4周", "超过1个月"],
      en: ["Less than 3 days", "Within a week", "1-4 weeks", "Over 1 month"]
    }
  },
  {
    id: "q6",
    category: "行为类",
    type: "single",
    weight: 5,
    zh: "你多久接触一次色情内容？",
    en: "How often do you watch porn?",
    options: {
      zh: ["几乎每天", "每周几次", "偶尔", "几乎不看"],
      en: ["Almost daily", "Several times a week", "Occasionally", "Almost never"]
    }
  },
  {
    id: "q7",
    category: "躯体类",
    type: "single",
    weight: 6,
    zh: "你是否常常注意力不集中？",
    en: "Do you often have trouble concentrating?",
    options: {
      zh: ["非常严重", "有时", "偶尔", "从不"],
      en: ["Very often", "Sometimes", "Occasionally", "Never"]
    }
  },
  {
    id: "q8",
    category: "躯体类",
    type: "single",
    weight: 6,
    zh: "你是否感觉记忆力下降或脑力变差？",
    en: "Have you noticed memory loss or mental fatigue?",
    options: {
      zh: ["非常明显", "有些下降", "没有变化"],
      en: ["Very obvious", "Somewhat decreased", "No change"]
    }
  },
  {
    id: "q9",
    category: "躯体类",
    type: "single",
    weight: 5,
    zh: "是否有失眠、多梦、早醒等睡眠问题？",
    en: "Do you experience insomnia or disturbed sleep?",
    options: {
      zh: ["经常", "偶尔", "几乎没有"],
      en: ["Often", "Occasionally", "Rarely"]
    }
  },
  {
    id: "q10",
    category: "躯体类",
    type: "multiple",
    weight: 10,
    zh: "你目前有哪些身体症状？（多选）",
    en: "Which physical symptoms are you currently experiencing? (Multiple choice)",
    options: {
      zh: [
        "神经衰弱",
        "精力下降",
        "性功能减退",
        "注意力不集中",
        "记忆力差",
        "脑雾",
        "无明显症状"
      ],
      en: [
        "Nervous fatigue",
        "Low energy",
        "Sexual dysfunction",
        "Poor focus",
        "Poor memory",
        "Brain fog",
        "No noticeable symptoms"
      ]
    }
  },
  {
    id: "q11",
    category: "情绪类",
    type: "single",
    weight: 5,
    zh: "你是否有焦虑、抑郁、或社交恐惧？",
    en: "Do you suffer from anxiety, depression, or social fear?",
    options: {
      zh: ["经常", "偶尔", "从不"],
      en: ["Often", "Occasionally", "Never"]
    }
  },
  {
    id: "q12",
    category: "行为类",
    type: "single",
    weight: 6,
    zh: "色情或手淫是否影响你的学习或工作效率？",
    en: "Has porn or masturbation affected your study or work?",
    options: {
      zh: ["严重影响", "有些影响", "没有影响"],
      en: ["Severely affected", "Somewhat affected", "No effect"]
    }
  },
  {
    id: "q13",
    category: "行为类",
    type: "single",
    weight: 4,
    zh: "你是否会在公共场合也有性冲动？",
    en: "Do you often get sexual urges even in public?",
    options: {
      zh: ["经常", "偶尔", "从不"],
      en: ["Often", "Occasionally", "Never"]
    }
  },
  {
    id: "q14",
    category: "情绪类",
    type: "single",
    weight: 6,
    zh: "你是否反复戒色失败感到沮丧？",
    en: "Have repeated failures made you feel hopeless or ashamed?",
    options: {
      zh: ["非常沮丧", "有点沮丧", "没有"],
      en: ["Very frustrated", "Somewhat frustrated", "No"]
    }
  },
  {
    id: "q15",
    category: "动机类",
    type: "single",
    weight: 3,
    zh: "你是否仍然相信可以彻底恢复？",
    en: "Do you still believe you can recover?",
    options: {
      zh: ["非常相信", "有些信心", "不太相信"],
      en: ["Strongly believe", "Somewhat confident", "Not really"]
    }
  },
  {
    id: "q16",
    category: "动机类",
    type: "multiple",
    weight: 4,
    zh: "你希望通过戒色改善哪些方面？（多选）",
    en: "What areas do you hope to improve through NoFap? (Multiple choice)",
    options: {
      zh: [
        "意志力",
        "专注力",
        "身体健康",
        "情绪稳定",
        "人际关系",
        "性能力"
      ],
      en: [
        "Willpower",
        "Focus",
        "Physical health",
        "Emotional balance",
        "Social connection",
        "Sexual performance"
      ]
    }
  },
  {
    id: "q17",
    category: "开放提问",
    type: "text",
    weight: 0,
    zh: "你戒色过程中遇到的最大困难是什么？",
    en: "What's the biggest challenge you face in your recovery journey?"
  },
  {
    id: "q18",
    category: "开放提问",
    type: "text",
    weight: 0,
    zh: "你还有什么想和我们分享的？",
    en: "Is there anything else you'd like to share with us?"
  }
]

const AddictionTest = () => {
  const { t, language } = useLanguage()
  const router = useRouter()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  // 检查是否有保存的测试结果
  React.useEffect(() => {
    const checkUserAndLoadResult = async () => {
      const user = await authService.getCurrentUser()
      const savedResult = localStorage.getItem('awaken_test_result')
      
      if (savedResult) {
        try {
          const parsedResult = JSON.parse(savedResult)
          
          // 如果用户已登录，将结果保存到数据库并清除localStorage
          if (user) {
            const { error } = await supabase
              .from("addiction_tests")
              .insert([
                {
                  user_id: user.id,
                  test_score: parsedResult.score,
                  addiction_level: parsedResult.addictionLevel,
                  answers: parsedResult.answers || {},
                  created_at: new Date().toISOString()
                }
              ])

            if (!error) {
              console.log('测试结果已保存到数据库')
              localStorage.removeItem('awaken_test_result')
              // 重新加载页面以显示正确的测试结果
              window.location.reload()
              return
            }
          }
          
          // 如果用户未登录或保存失败，显示localStorage中的结果
          setTestResult(parsedResult)
          setShowResult(true)
        } catch (error) {
          console.error('Failed to parse saved test result:', error)
          localStorage.removeItem('awaken_test_result')
        }
      }
    }
    
    checkUserAndLoadResult()
  }, [])

  // 监听登录状态变化，登录成功后保存测试结果到数据库
  React.useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // 用户登录成功，将localStorage中的测试结果保存到数据库
        const savedResult = localStorage.getItem('awaken_test_result')
        if (savedResult) {
          try {
            const testData = JSON.parse(savedResult)
            const { error } = await supabase
              .from("addiction_tests")
              .insert([
                {
                  user_id: session.user.id,
                  test_score: testData.score,
                  addiction_level: testData.addictionLevel,
                  answers: testData.answers || {},
                  created_at: new Date().toISOString()
                }
              ])

            if (!error) {
              console.log('测试结果已保存到数据库')
              // 清除localStorage
              localStorage.removeItem('awaken_test_result')
              // 重新加载页面以显示正确的测试结果
              window.location.reload()
            }
          } catch (error) {
            console.error('保存测试结果失败:', error)
          }
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const currentQ = quizQuestions[currentQuestion]
  const isLastQuestion = currentQuestion === quizQuestions.length - 1

  const handleSingleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const handleMultipleAnswer = (questionId: string, value: string, checked: boolean) => {
    setAnswers(prev => {
      const currentAnswers = prev[questionId] || []
      if (checked) {
        return {
          ...prev,
          [questionId]: [...currentAnswers, value]
        }
      } else {
        return {
          ...prev,
          [questionId]: currentAnswers.filter((v: string) => v !== value)
        }
      }
    })
  }

  const handleTextAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const calculateScore = () => {
    let totalScore = 0
    let totalWeight = 0

    quizQuestions.forEach(question => {
      if (question.weight > 0) {
        const answer = answers[question.id]
        if (answer) {
          if (question.type === "single" && question.options) {
            // 单选题：根据选项索引计算分数
            const options = question.options[language] || question.options.zh
            const optionIndex = options.indexOf(answer)
            const score = (optionIndex + 1) * question.weight
            totalScore += score
          } else if (question.type === "multiple" && question.options) {
            // 多选题：根据选中数量计算分数
            const selectedCount = Array.isArray(answer) ? answer.length : 0
            const score = selectedCount * question.weight
            totalScore += score
          }
          totalWeight += question.weight
        }
      }
    })

    return { score: totalScore, maxScore: totalWeight * 4 } // 假设最高分是权重*4
  }

  const getAddictionLevel = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage <= 30) return language === "zh" ? "轻度" : "Mild"
    if (percentage <= 60) return language === "zh" ? "中度" : "Moderate"
    return language === "zh" ? "重度" : "Severe"
  }

  const handleSubmit = async () => {
    // Plausible Analytics: 追踪色瘾测试点击事件
    if (typeof window !== 'undefined' && window.plausible) {
      window.plausible('lust_test_click')
    }
    
    setIsSubmitting(true)
    
    try {
      const user = await authService.getCurrentUser()
      const { score, maxScore } = calculateScore()
      const addictionLevel = getAddictionLevel(score, maxScore)

      // 如果用户已登录，保存到数据库
      if (user) {
        const { error } = await supabase
          .from("addiction_tests")
          .insert([
            {
              user_id: user.id,
              test_score: score,
              addiction_level: addictionLevel,
              answers: answers,
              created_at: new Date().toISOString()
            }
          ])

        if (error) {
          console.error("保存测试结果失败:", error)
          alert(language === "zh" ? "保存失败，请重试" : "Save failed, please try again")
          return
        }
      }

      const resultData = { score, maxScore, addictionLevel, answers, isLoggedIn: !!user }
      setTestResult(resultData)
      setShowResult(true)
      
      // 保存到localStorage（仅未登录用户）
      if (!user) {
        localStorage.setItem('awaken_test_result', JSON.stringify(resultData))
      }
    } catch (error) {
      console.error("提交测试失败:", error)
      alert(language === "zh" ? "提交失败，请重试" : "Submit failed, please try again")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNext = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const progress = ((currentQuestion + 1) / quizQuestions.length) * 100

  if (showResult) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            {language === "zh" ? "测试结果" : "Test Results"}
          </h1>
        </div>

        <div className="space-y-8">
          {/* 测试结果 */}
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-4">
              {language === "zh" ? "得分" : "Score"}: {testResult.score}/{testResult.maxScore}
            </div>
            <div className="text-2xl text-gray-300 mb-6">
              {language === "zh" ? "依赖程度" : "Dependency Level"}: {testResult.addictionLevel}
            </div>
            <div className="text-gray-400 text-lg max-w-md mx-auto">
              {testResult.addictionLevel === (language === "zh" ? "轻度" : "Mild") && 
                (language === "zh" ? "你的依赖程度较轻，建议保持健康的生活方式" : "Your dependency level is mild, we recommend maintaining a healthy lifestyle")}
              {testResult.addictionLevel === (language === "zh" ? "中度" : "Moderate") && 
                (language === "zh" ? "你存在中等程度的依赖，建议制定戒除计划" : "You have moderate dependency, we recommend creating a recovery plan")}
              {testResult.addictionLevel === (language === "zh" ? "重度" : "Severe") && 
                (language === "zh" ? "你存在重度依赖，建议寻求专业帮助" : "You have severe dependency, we recommend seeking professional help")}
            </div>
          </div>

          {/* 用户操作按钮 */}
          <div className="flex gap-4">
            <Button 
              size="lg"
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              onClick={() => router.push("/plans")}
            >
              {language === "zh" ? "查看个性化方案" : "View Personalized Plan"}
            </Button>
            <Button 
              size="lg"
              className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              onClick={() => {
                setShowResult(false)
                setCurrentQuestion(0)
                setAnswers({})
                localStorage.removeItem('awaken_test_result')
              }}
            >
              {language === "zh" ? "重新测试" : "Retake Test"}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">
          {language === "zh" ? "成瘾程度测试" : "Addiction Level Test"}
        </h1>
        <p className="text-gray-300">
          {language === "zh" ? "通过专业评估了解你的依赖程度" : "Understand your dependency level through professional assessment"}
        </p>
      </div>

      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">
              {language === "zh" ? "问题" : "Question"} {currentQuestion + 1} / {quizQuestions.length}
            </CardTitle>
            <div className="text-sm text-gray-400">
              {Math.round(progress)}%
            </div>
          </div>
          <Progress value={progress} className="w-full" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-lg text-white mb-6">
            {language === "zh" ? currentQ.zh : currentQ.en}
          </div>

          {currentQ.type === "single" && currentQ.options && (
            <div className="space-y-3">
              {(currentQ.options[language] || currentQ.options.zh).map((option, index) => (
                <Button
                  key={index}
                  variant={answers[currentQ.id] === option ? "default" : "outline"}
                  className={`w-full justify-start text-left h-auto p-4 ${
                    answers[currentQ.id] === option 
                      ? "bg-purple-600 hover:bg-purple-700" 
                      : "bg-transparent border-gray-600 text-gray-300 hover:bg-white/10"
                  }`}
                  onClick={() => handleSingleAnswer(currentQ.id, option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          )}

          {currentQ.type === "multiple" && currentQ.options && (
            <div className="space-y-3">
              {(currentQ.options[language] || currentQ.options.zh).map((option, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 border border-gray-600 rounded-lg">
                  <Checkbox
                    id={`${currentQ.id}-${index}`}
                    checked={Array.isArray(answers[currentQ.id]) && answers[currentQ.id].includes(option)}
                    onCheckedChange={(checked) => handleMultipleAnswer(currentQ.id, option, checked as boolean)}
                  />
                  <label
                    htmlFor={`${currentQ.id}-${index}`}
                    className="text-gray-300 cursor-pointer flex-1"
                  >
                    {option}
                  </label>
                </div>
              ))}
            </div>
          )}

          {currentQ.type === "text" && (
            <div className="space-y-2">
              <Textarea
                placeholder={language === "zh" ? "请输入你的回答...（选填）" : "Please enter your answer... (Optional)"}
                value={answers[currentQ.id] || ""}
                onChange={(e) => handleTextAnswer(currentQ.id, e.target.value)}
                className="min-h-[120px] bg-slate-700 border-gray-600 text-white"
              />
              <p className="text-xs text-gray-400">
                {language === "zh" ? "此题为选填，可以直接跳过" : "This question is optional, you can skip it"}
              </p>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            {currentQuestion > 0 && (
              <Button 
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                onClick={handlePrevious}
              >
                {language === "zh" ? "上一题" : "Previous"}
              </Button>
            )}
            
            {!isLastQuestion ? (
              <Button 
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                onClick={handleNext}
                disabled={currentQ.type !== "text" && !answers[currentQ.id]}
              >
                {language === "zh" ? "下一题" : "Next"}
              </Button>
            ) : (
              <Button 
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? (language === "zh" ? "提交中..." : "Submitting...") 
                  : (language === "zh" ? "提交测试" : "Submit Test")
                }
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AddictionTest

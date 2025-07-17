"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Search,
  Brain,
  MessageSquare,
  FileText,
  Settings
} from "lucide-react"
import { useSubscription } from "@/hooks/use-subscription"
import { useRouter } from "next/navigation"

interface KnowledgeItem {
  id: string
  category: string
  title: string
  content: string
  tags: string[]
  created_at: string
  updated_at: string
}

export default function KnowledgePage() {
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([])
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isLoading, setIsLoading] = useState(false)
  const { isPro, isPremium } = useSubscription()
  const router = useRouter()

  // 检查管理员权限
  useEffect(() => {
    if (!isPro && !isPremium) {
      router.push("/pricing")
      return
    }
  }, [isPro, isPremium, router])

  const categories = [
    { id: "all", name: "全部", icon: BookOpen },
    { id: "principles", name: "核心原则", icon: Brain },
    { id: "stages", name: "戒色阶段", icon: Settings },
    { id: "faq", name: "常见问题", icon: MessageSquare },
    { id: "tips", name: "实用技巧", icon: FileText },
    { id: "recovery", name: "身体恢复", icon: Brain },
    { id: "psychology", name: "心理支持", icon: MessageSquare }
  ]

  // 模拟知识库数据
  const mockKnowledgeItems: KnowledgeItem[] = [
    {
      id: "1",
      category: "principles",
      title: "戒色核心原则",
      content: "戒色是一个渐进的过程，需要耐心和坚持。身体和心理的恢复需要时间，不要急于求成。建立健康的生活习惯是戒色的基础。",
      tags: ["原则", "基础", "耐心"],
      created_at: "2024-01-01",
      updated_at: "2024-01-01"
    },
    {
      id: "2",
      category: "stages",
      title: "戒色四个阶段",
      content: "1. 初期阶段（1-7天）：身体开始调整，可能出现戒断反应\n2. 适应阶段（1-4周）：身体逐渐适应，心理状态改善\n3. 稳定阶段（1-6个月）：习惯逐渐养成，生活质量提升\n4. 巩固阶段（6个月以上）：完全戒除，建立健康生活方式",
      tags: ["阶段", "时间", "进展"],
      created_at: "2024-01-01",
      updated_at: "2024-01-01"
    },
    {
      id: "3",
      category: "faq",
      title: "如何应对戒色欲望？",
      content: "欲望是正常的生理反应，不要感到羞耻。可以通过以下方式应对：\n1. 转移注意力：运动、阅读、冥想等\n2. 避免触发因素：减少社交媒体、限制网络使用\n3. 建立健康的替代活动",
      tags: ["欲望", "应对", "技巧"],
      created_at: "2024-01-01",
      updated_at: "2024-01-01"
    }
  ]

  useEffect(() => {
    setKnowledgeItems(mockKnowledgeItems)
  }, [])

  const filteredItems = knowledgeItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleAddItem = () => {
    const newItem: KnowledgeItem = {
      id: Date.now().toString(),
      category: "principles",
      title: "",
      content: "",
      tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    setEditingItem(newItem)
  }

  const handleEditItem = (item: KnowledgeItem) => {
    setEditingItem(item)
  }

  const handleSaveItem = () => {
    if (!editingItem) return

    if (editingItem.id) {
      // 更新现有项目
      setKnowledgeItems(prev => 
        prev.map(item => 
          item.id === editingItem.id ? editingItem : item
        )
      )
    } else {
      // 添加新项目
      setKnowledgeItems(prev => [...prev, editingItem])
    }
    setEditingItem(null)
  }

  const handleDeleteItem = (id: string) => {
    setKnowledgeItems(prev => prev.filter(item => item.id !== id))
  }

  const handleCancelEdit = () => {
    setEditingItem(null)
  }

  if (!isPro && !isPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-sm border-white/20 text-white">
          <CardContent className="p-6 text-center">
            <Brain className="w-12 h-12 mx-auto mb-4 text-purple-400" />
            <h2 className="text-xl font-bold mb-2">需要会员权限</h2>
            <p className="text-gray-300 mb-4">知识库管理功能仅对会员开放</p>
            <Button onClick={() => router.push("/pricing")}>
              升级会员
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-400" />
            AI助教知识库管理
          </h1>
          <p className="text-gray-300">管理和扩充AI助教的专业知识库</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 侧边栏 */}
          <div className="lg:col-span-1">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  分类管理
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categories.map(category => {
                    const Icon = category.icon
                    return (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "default" : "ghost"}
                        className={`w-full justify-start ${
                          selectedCategory === category.id 
                            ? "bg-purple-600 hover:bg-purple-700" 
                            : "text-gray-300 hover:text-white hover:bg-white/10"
                        }`}
                        onClick={() => setSelectedCategory(category.id)}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {category.name}
                      </Button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 主内容区 */}
          <div className="lg:col-span-3">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    知识条目 ({filteredItems.length})
                  </CardTitle>
                  <Button onClick={handleAddItem} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    添加条目
                  </Button>
                </div>
                
                {/* 搜索栏 */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="搜索知识条目..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400"
                  />
                </div>
              </CardHeader>

              <CardContent>
                {editingItem ? (
                  /* 编辑表单 */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">标题</label>
                        <Input
                          value={editingItem.title}
                          onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                          className="bg-white/10 border-white/20 text-white"
                          placeholder="输入标题..."
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">分类</label>
                        <select
                          value={editingItem.category}
                          onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}
                          className="w-full bg-white/10 border border-white/20 text-white rounded-md px-3 py-2"
                        >
                          {categories.filter(c => c.id !== "all").map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-2 block">内容</label>
                      <Textarea
                        value={editingItem.content}
                        onChange={(e) => setEditingItem({...editingItem, content: e.target.value})}
                        className="bg-white/10 border-white/20 text-white min-h-32"
                        placeholder="输入知识内容..."
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-2 block">标签</label>
                      <Input
                        value={editingItem.tags.join(", ")}
                        onChange={(e) => setEditingItem({
                          ...editingItem, 
                          tags: e.target.value.split(",").map(tag => tag.trim()).filter(tag => tag)
                        })}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="输入标签，用逗号分隔..."
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button onClick={handleSaveItem} className="bg-green-600 hover:bg-green-700">
                        <Save className="w-4 h-4 mr-2" />
                        保存
                      </Button>
                      <Button onClick={handleCancelEdit} variant="outline" className="border-white/30 text-white hover:bg-white/10">
                        <X className="w-4 h-4 mr-2" />
                        取消
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* 知识条目列表 */
                  <div className="space-y-4">
                    {filteredItems.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>暂无知识条目</p>
                      </div>
                    ) : (
                      filteredItems.map(item => (
                        <div key={item.id} className="bg-white/5 border border-white/20 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/50">
                                  {categories.find(c => c.id === item.category)?.name}
                                </Badge>
                                <span className="text-xs text-gray-400">
                                  {new Date(item.updated_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-gray-300 text-sm line-clamp-3">{item.content}</p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditItem(item)}
                                className="border-white/30 text-white hover:bg-white/10"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteItem(item.id)}
                                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {item.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs bg-white/10 text-gray-300">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 
"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  User, 
  Crown, 
  Calendar, 
  Target, 
  MessageSquare, 
  LogOut, 
  Trophy, 
  Flame, 
  Star, 
  Settings, 
  Camera,
  Edit3,
  Brain,
  Activity,
  Award,
  TrendingUp,
  Clock,
  BookOpen,
  Video,
  Users,
  Zap,
  ChevronRight,
  CheckCircle,
  X
} from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { authService } from "@/lib/auth"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useDebounce } from '@/hooks/use-debounce'
import { CoralSeparator } from '@/components/ui/separator';
import { CoralButton } from '@/components/ui/button';
import { useLanguage } from '@/lib/lang-context'

interface UserProfile {
  id: string
  username: string
  email: string
  avatar_url: string
  current_streak: number
  max_streak: number
  total_days: number
  level: number
  created_at: string
  personal_motto?: string
}

// 自定义按钮样式
const darkDialogButton = "bg-slate-700 text-white border border-slate-600 hover:bg-slate-600 focus:ring-2 focus:ring-purple-500 focus:outline-none transition disabled:opacity-60 disabled:cursor-not-allowed"
const logoutButton = "bg-transparent border border-red-400 text-red-400 hover:bg-red-500/20 hover:text-white focus:ring-2 focus:ring-red-500 focus:outline-none transition"

export default function ProfileNew() {
  const { t } = useLanguage()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editAvatarOpen, setEditAvatarOpen] = useState(false)
  const [editNameOpen, setEditNameOpen] = useState(false)
  const [newAvatar, setNewAvatar] = useState<File | null>(null)
  const [newName, setNewName] = useState("")
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editMottoOpen, setEditMottoOpen] = useState(false)
  const [newMotto, setNewMotto] = useState("")
  const [editingMotto, setEditingMotto] = useState("")

  const debouncedMotto = useDebounce(editingMotto, 1000) // 1秒防抖
  
  // 自动保存个人签名
  useEffect(() => {
    if (debouncedMotto && debouncedMotto !== user?.personal_motto && user) {
      handleAutoSaveMotto(debouncedMotto)
    }
  }, [debouncedMotto, user])

  // 自动保存个人签名函数
  const handleAutoSaveMotto = async (motto: string) => {
    if (!user) return
    
    try {
      console.log("自动保存个人签名:", motto)
      
      const { error } = await supabase
        .from('users')
        .update({ personal_motto: motto })
        .eq('id', user.id)
      
      if (error) {
        console.error("自动保存个人签名失败:", error)
        toast({ 
          title: "保存失败", 
          description: "个人签名自动保存失败", 
          variant: "destructive" 
        })
      } else {
        console.log("个人签名自动保存成功")
        setUser({ ...user, personal_motto: motto })
        toast({ title: "已自动保存", description: "个人签名已更新" })
      }
    } catch (error) {
      console.error("自动保存个人签名过程中出错:", error)
    }
  }

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      const currentUser = await authService.getCurrentUser()
      if (!currentUser) return

      // 获取用户基本信息
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, username, email, avatar_url, current_streak, max_streak, total_days, level, created_at, personal_motto")
        .eq("id", currentUser.id)
        .single()

      if (userError) throw userError
      setUser({
        id: userData.id,
        username: userData.username || '用户',
        email: userData.email,
        avatar_url: userData.avatar_url,
        current_streak: userData.current_streak || 0,
        max_streak: userData.max_streak || 0,
        total_days: userData.total_days || 0,
        level: userData.level || 1,
        created_at: userData.created_at,
        personal_motto: userData.personal_motto
      })
    } catch (error) {
      console.error("加载用户资料失败:", error)
      toast({
        title: "加载失败",
        description: "无法加载用户资料，请稍后重试",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await authService.signOut()
      toast({
        title: "退出成功",
        description: "您已成功退出登录",
      })
      window.location.reload()
    } catch (error) {
      console.error("退出登录失败:", error)
      toast({
        title: "退出失败",
        description: "退出登录时发生错误",
        variant: "destructive",
      })
    }
  }

  const getLevelColor = (level: number) => {
    if (level >= 30) return "bg-purple-500"
    if (level >= 15) return "bg-blue-500"
    if (level >= 7) return "bg-green-500"
    return "bg-gray-500"
  }

  const getLevelName = (level: number) => {
    if (level >= 30) return "戒色大师"
    if (level >= 15) return "戒色勇士"
    if (level >= 7) return "戒色新兵"
    return "戒色新手"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN")
  }

  // 头像上传逻辑
  const handleAvatarUpload = async () => {
    if (!newAvatar || !user) return
    setSaving(true)
    
    try {
      // 获取文件扩展名
      const fileExt = newAvatar.name.split('.').pop()?.toLowerCase()
      if (!fileExt || !['jpg', 'jpeg', 'png', 'gif'].includes(fileExt)) {
        toast({ title: "文件格式不支持", description: "请选择 JPG、PNG 或 GIF 格式的图片", variant: "destructive" })
        setSaving(false)
        return
      }
      
      // 压缩图片以提高上传速度
      const compressedFile = await compressImage(newAvatar, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.8,
        format: fileExt === 'jpg' || fileExt === 'jpeg' ? 'jpeg' : fileExt
      })
      
      // 使用简单的文件名格式
      const filePath = `avatar-${user.id}.${fileExt}`
      
      console.log("开始上传头像:", { 
        filePath, 
        originalSize: newAvatar.size,
        compressedSize: compressedFile.size,
        compressionRatio: ((newAvatar.size - compressedFile.size) / newAvatar.size * 100).toFixed(1) + '%'
      })
      
      // 上传新头像
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressedFile, { 
          upsert: true,
          cacheControl: '3600',
          contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`
        })
      
      if (uploadError) {
        console.error("头像上传失败:", uploadError)
        toast({ 
          title: "上传失败", 
          description: uploadError.message || "头像上传失败，请重试", 
          variant: "destructive" 
        })
        setSaving(false)
        return
      }
      
      console.log("头像上传成功，获取公开URL...")
      
      // 获取公开URL
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
      const avatarUrl = urlData?.publicUrl
      
      if (!avatarUrl) {
        toast({ title: "获取头像URL失败", description: "请重试", variant: "destructive" })
        setSaving(false)
        return
      }
      
      console.log("获取到公开URL:", avatarUrl)
      
      // 更新用户表中的头像URL
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id)
      
      if (updateError) {
        console.error("更新头像URL失败:", updateError)
        toast({ 
          title: "保存失败", 
          description: updateError.message || "头像保存失败，请重试", 
          variant: "destructive" 
        })
      } else {
        console.log("头像更新成功")
        toast({ title: "头像已更新", description: "头像上传成功" })
        setUser({ ...user, avatar_url: avatarUrl })
        setEditAvatarOpen(false)
        setNewAvatar(null) // 清空选择的文件
      }
    } catch (error) {
      console.error("头像上传过程中出错:", error)
      toast({ 
        title: "上传失败", 
        description: "头像上传过程中出现错误，请重试", 
        variant: "destructive" 
      })
    } finally {
      setSaving(false)
    }
  }

  // 图片压缩函数
  const compressImage = (file: File, options: {
    maxWidth: number
    maxHeight: number
    quality: number
    format: string
  }): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      
      img.onload = () => {
        // 计算新的尺寸
        let { width, height } = img
        const { maxWidth, maxHeight } = options
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
        
        // 设置canvas尺寸
        canvas.width = width
        canvas.height = height
        
        // 绘制压缩后的图片
        ctx.drawImage(img, 0, 0, width, height)
        
        // 转换为Blob
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: `image/${options.format}`,
              lastModified: Date.now()
            })
            resolve(compressedFile)
          } else {
            resolve(file) // 如果压缩失败，返回原文件
          }
        }, `image/${options.format}`, options.quality)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  // 昵称修改逻辑
  const handleNameSave = async () => {
    if (!newName.trim() || !user) return
    setSaving(true)
    const { error: updateError } = await supabase.from('users').update({ username: newName.trim() }).eq('id', user.id)
    if (updateError) {
      toast({ title: "保存失败", description: updateError.message, variant: "destructive" })
    } else {
      toast({ title: "昵称已更新" })
      setUser({ ...user, username: newName.trim() })
      setEditNameOpen(false)
    }
    setSaving(false)
  }

  // 个人签名保存逻辑
  const handleMottoSave = async () => {
    if (!user || !editingMotto) return
    
    setSaving(true)
    
    try {
      // 防抖：如果内容没有变化，直接返回
      if (editingMotto === user.personal_motto) {
        setSaving(false)
        setEditMottoOpen(false)
        return
      }
      
      console.log("保存个人签名:", editingMotto)
      
      const { error } = await supabase
        .from('users')
        .update({ personal_motto: editingMotto })
        .eq('id', user.id)
      
      if (error) {
        console.error("保存个人签名失败:", error)
        toast({ 
          title: "保存失败", 
          description: error.message || "个人签名保存失败，请重试", 
          variant: "destructive" 
        })
      } else {
        console.log("个人签名保存成功")
        toast({ title: "保存成功", description: "个人签名已更新" })
        setUser({ ...user, personal_motto: editingMotto })
        setEditMottoOpen(false)
      }
    } catch (error) {
      console.error("保存个人签名过程中出错:", error)
      toast({
        title: "保存失败",
        description: "保存过程中出现错误，请重试",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <Card className="w-full bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto"></div>
                <p className="text-white mt-4">加载中...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <Card className="w-full bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-12 text-center">
              <p className="text-white">请先登录查看个人资料</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* 用户信息头部卡片 */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative group">
                    <Avatar className="w-20 h-20 border-4 border-purple-500/50">
                      <AvatarImage src={user.avatar_url || "/placeholder-user.jpg"} />
                      <AvatarFallback className="bg-purple-600 text-white text-xl">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      className="absolute bottom-1 right-1 bg-black/60 rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                      onClick={() => setEditAvatarOpen(true)}
                      title={t('profile.edit_avatar')}
                    >
                      <Camera className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl font-bold">{user.username}</span>
                      <button
                        className="ml-2 text-gray-400 hover:text-white"
                        onClick={() => { setNewName(user.username || ''); setEditNameOpen(true) }}
                        title={t('profile.edit_name')}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-gray-300">{user.email}</p>
                    <p className="text-sm text-gray-400">
                      {t('profile.joined_at')}：{formatDate(user.created_at)}
                    </p>
                    {/* 个人签名宣言 */}
                    <div className="mt-3 p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-gray-300 mb-1">{t('profile.motto_label')}</p>
                          <p className="text-white font-medium">
                            {user.personal_motto || t('profile.motto_placeholder')}
                          </p>
                        </div>
                        <button
                          className="ml-2 text-gray-400 hover:text-white"
                          onClick={() => { setEditingMotto(user.personal_motto || ''); setEditMottoOpen(true) }}
                          title={t('profile.edit_motto')}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  className={logoutButton}
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('profile.sign_out')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 编辑头像对话框 */}
          <Dialog open={editAvatarOpen} onOpenChange={setEditAvatarOpen}>
            <DialogContent className="bg-slate-800 border-slate-700 text-white">
              <DialogHeader>
                <DialogTitle>{t('profile.change_avatar')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/jpg,image/png,image/gif"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      // 检查文件大小（5MB限制）
                      if (file.size > 5 * 1024 * 1024) {
                        toast({ 
                          title: "文件过大", 
                          description: "请选择小于5MB的图片", 
                          variant: "destructive" 
                        })
                        e.target.value = ''
                        return
                      }
                      setNewAvatar(file)
                    }
                  }}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  {t('profile.select_image')}
                </Button>
                {newAvatar && (
                  <div className="p-3 bg-slate-700 rounded-lg">
                    <p className="text-sm text-gray-300 mb-2">{t('profile.selected_file')}</p>
                    <p className="text-white text-sm">{newAvatar.name}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      大小: {(newAvatar.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-400">
                  {t('profile.supported_formats')}
                </p>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button className={darkDialogButton} variant="ghost">{t('profile.cancel')}</Button>
                </DialogClose>
                <Button
                  onClick={handleAvatarUpload}
                  disabled={!newAvatar || saving}
                >
                  {saving ? t('profile.uploading') : t('profile.save')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* 编辑昵称对话框 */}
          <Dialog open={editNameOpen} onOpenChange={setEditNameOpen}>
            <DialogContent className="bg-slate-800 border-slate-700 text-white">
              <DialogHeader>
                <DialogTitle>{t('profile.edit_name')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={t('profile.new_name_placeholder')}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">{t('profile.cancel')}</Button>
                </DialogClose>
                <Button
                  onClick={handleNameSave}
                  disabled={!newName.trim() || saving}
                >
                  {saving ? t('profile.saving') : t('profile.save')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* 编辑个人签名宣言对话框 */}
          <Dialog open={editMottoOpen} onOpenChange={setEditMottoOpen}>
            <DialogContent className="bg-slate-800 border-slate-700 text-white">
              <DialogHeader>
                <DialogTitle>{t('profile.edit_motto_label')}</DialogTitle>
                <DialogDescription className="text-gray-300">
                  {t('profile.motto_inspiration')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  value={editingMotto}
                  onChange={(e) => setEditingMotto(e.target.value)}
                  placeholder={t('profile.motto_example')}
                  className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                  maxLength={200}
                />
                <p className="text-xs text-gray-400">
                  {editingMotto.length}/{200} {t('profile.characters')}
                </p>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button className={darkDialogButton} variant="ghost">{t('profile.close')}</Button>
                </DialogClose>
                <div className="text-xs text-gray-400">
                  {t('profile.auto_save')}
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* 统计数据卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-300">{t('profile.current_streak')}</p>
                    <p className="text-3xl font-bold text-purple-400">{user.current_streak}</p>
                  </div>
                  <Flame className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-300">{t('profile.max_streak')}</p>
                    <p className="text-3xl font-bold text-yellow-400">{user.max_streak}</p>
                  </div>
                  <Award className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-300">{t('profile.total_days')}</p>
                    <p className="text-3xl font-bold text-blue-400">{user.total_days}</p>
                  </div>
                  <Target className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-300">{t('profile.success_rate')}</p>
                    <p className="text-3xl font-bold text-green-400">
                      {user.total_days > 0 ? Math.round((user.current_streak / user.total_days) * 100) : 0}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 主要内容区域 */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-sm border-white/20">
              <TabsTrigger value="overview" className="text-white data-[state=active]:bg-purple-600">{t('profile.tab_overview')}</TabsTrigger>
              <TabsTrigger value="activities" className="text-white data-[state=active]:bg-purple-600">{t('profile.tab_features')}</TabsTrigger>
            </TabsList>

            {/* 总览标签页 */}
            <TabsContent value="overview" className="space-y-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    {t('profile.progress')}
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    {t('profile.progress_description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>{t('profile.current_level')}</span>
                      <span className="text-purple-400 font-semibold">Lv.{user.level}</span>
                    </div>
                    <Progress value={(user.current_streak % 7) / 7 * 100} className="h-3" />
                    <p className="text-sm text-gray-400">
                      {t('profile.next_level_days')} {7 - (user.current_streak % 7)} {t('profile.days')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 功能标签页 */}
            <TabsContent value="activities" className="space-y-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    {t('profile.quick_entry')}
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    {t('profile.quick_access')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { icon: Target, label: t('profile.checkin'), href: "/checkin", color: "text-blue-400", desc: t('profile.checkin_desc') },
                      { icon: BookOpen, label: t('profile.plans'), href: "/plans", color: "text-green-400", desc: t('profile.plans_desc') },
                      { icon: Trophy, label: t('profile.leaderboard'), href: "/leaderboard", color: "text-yellow-400", desc: t('profile.leaderboard_desc') },
                      { icon: Brain, label: t('profile.ai_coach'), href: "/profile", color: "text-pink-400", desc: t('profile.ai_coach_desc') }
                    ].map((item, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        className="w-full justify-start text-white hover:bg-white/10 h-auto p-4"
                        onClick={() => {
                          if (item.label === t('profile.ai_coach')) {
                            // 触发聊天窗口打开
                            window.dispatchEvent(new CustomEvent('openChatWidget'))
                          } else {
                            window.location.href = item.href
                          }
                        }}
                      >
                        <div className="flex items-center space-x-3 w-full">
                          <item.icon className={`w-6 h-6 ${item.color}`} />
                          <div className="flex-1 text-left">
                            <div className="font-medium">{item.label}</div>
                            <div className="text-sm text-gray-400">{item.desc}</div>
                          </div>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 
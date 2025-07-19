"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Star, Send, MessageSquare, CheckCircle, Upload, X, Image as ImageIcon } from "lucide-react"
import { useLanguage } from "@/lib/lang-context"
import { supabase } from "@/lib/supabaseClient"

export default function FeedbackSection() {
  const { language, t } = useLanguage()
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [email, setEmail] = useState("")
  const [feedback, setFeedback] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const content = {
    zh: {
      title: t("feedback.title"),
      subtitle: t("feedback.subtitle"),
      emailLabel: t("feedback.email_label"),
      emailPlaceholder: t("feedback.email_placeholder"),
      feedbackLabel: t("feedback.feedback_label"),
      feedbackPlaceholder: t("feedback.feedback_placeholder"),
      ratingLabel: t("feedback.rating_label"),
      imageLabel: t("feedback.image_label"),
      imagePlaceholder: t("feedback.image_placeholder"),
      imageUploading: t("feedback.image_uploading"),
      imageUploadFailed: t("feedback.image_upload_failed"),
      imageRemove: t("feedback.image_remove"),
      submitButton: t("feedback.submit"),
      submittingButton: t("feedback.submitting"),
      successTitle: t("feedback.success_title"),
      successMessage: t("feedback.success_message"),
      submitAnother: t("feedback.submit_another"),
    },
    en: {
      title: t("feedback.title"),
      subtitle: t("feedback.subtitle"),
      emailLabel: t("feedback.email_label"),
      emailPlaceholder: t("feedback.email_placeholder"),
      feedbackLabel: t("feedback.feedback_label"),
      feedbackPlaceholder: t("feedback.feedback_placeholder"),
      ratingLabel: t("feedback.rating_label"),
      imageLabel: t("feedback.image_label"),
      imagePlaceholder: t("feedback.image_placeholder"),
      imageUploading: t("feedback.image_uploading"),
      imageUploadFailed: t("feedback.image_upload_failed"),
      imageRemove: t("feedback.image_remove"),
      submitButton: t("feedback.submit"),
      submittingButton: t("feedback.submitting"),
      successTitle: t("feedback.success_title"),
      successMessage: t("feedback.success_message"),
      submitAnother: t("feedback.submit_another"),
    },
  }

  const currentContent = content[language]

  const handleImageUpload = async (file: File): Promise<string | null> => {
    if (!file) return null

    // 检查文件大小（5MB限制）
    if (file.size > 5 * 1024 * 1024) {
      alert("图片大小不能超过5MB")
      return null
    }

    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert("只支持 JPG、PNG、GIF、WebP 格式的图片")
      return null
    }

    try {
      setIsUploadingImage(true)
      
      // 生成唯一文件名
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      
      // 上传到Supabase存储
      const { data, error } = await supabase.storage
        .from('feedback-images')
        .upload(fileName, file)

      if (error) {
        console.error("图片上传失败:", error)
        alert(currentContent.imageUploadFailed)
        return null
      }

      // 获取公共URL
      const { data: { publicUrl } } = supabase.storage
        .from('feedback-images')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error("图片上传出错:", error)
      alert(currentContent.imageUploadFailed)
      return null
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImageFile(file)
      
      // 创建预览
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!feedback.trim()) return

    setIsSubmitting(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // 如果有图片，先上传图片
      let imageUrl = null
      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile)
        if (!imageUrl) {
          setIsSubmitting(false)
          return
        }
      }

      const feedbackData = {
        user_id: user?.id || null,
        email: email.trim() || null,
        rating: rating || null,
        feedback: feedback.trim(),
        image_url: imageUrl,
        created_at: new Date().toISOString(),
      }

      const { error } = await supabase.from("user_feedback").insert([feedbackData])

      if (error) {
        console.error("提交反馈失败:", error)
        alert("提交失败，请稍后重试")
        return
      }

      setIsSubmitted(true)
      // 重置表单
      setRating(0)
      setEmail("")
      setFeedback("")
      setImageFile(null)
      setImagePreview(null)
    } catch (error) {
      console.error("提交反馈时出错:", error)
      alert("提交失败，请稍后重试")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setIsSubmitted(false)
    setRating(0)
    setEmail("")
    setFeedback("")
    setImageFile(null)
    setImagePreview(null)
  }

  if (isSubmitted) {
    return (
      <section className="container mx-auto px-8 py-16">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl shadow-xl max-w-4xl mx-auto">
          <div className="p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <h3 className="text-2xl font-medium text-white mb-4">{currentContent.successTitle}</h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">{currentContent.successMessage}</p>
            <button
              onClick={resetForm}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg transition-all duration-200"
            >
              {currentContent.submitAnother}
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="container mx-auto px-8 py-16">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{currentContent.title}</h2>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto">{currentContent.subtitle}</p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 评分系统 */}
            <div className="space-y-3">
              <Label className="text-base font-medium text-white">{currentContent.ratingLabel}</Label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="transition-colors duration-200"
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(star)}
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoveredRating || rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-400"
                      }`}
                    />
                  </button>
                ))}
                {rating > 0 && <span className="ml-3 text-sm text-gray-300">{rating}/5</span>}
              </div>
            </div>

            {/* 邮箱输入 */}
            <div className="space-y-3">
              <Label htmlFor="email" className="text-base font-medium text-white">
                {currentContent.emailLabel}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={currentContent.emailPlaceholder}
                className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400 focus:ring-purple-400/20"
              />
            </div>

            {/* 反馈内容 */}
            <div className="space-y-3">
              <Label htmlFor="feedback" className="text-base font-medium text-white">
                {currentContent.feedbackLabel} *
              </Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={currentContent.feedbackPlaceholder}
                rows={5}
                required
                className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400 focus:ring-purple-400/20 resize-none"
              />
            </div>

            {/* 图片上传 */}
            <div className="space-y-3">
              <Label htmlFor="image" className="text-base font-medium text-white">
                {currentContent.imageLabel}
              </Label>
              <div className="flex items-center space-x-3">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  ref={fileInputRef}
                />
                                 <button
                   type="button"
                   onClick={() => fileInputRef.current?.click()}
                   className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg transition-all duration-200 flex items-center"
                   disabled={isUploadingImage}
                 >
                   <Upload className="w-5 h-5 mr-2" />
                   {isUploadingImage ? currentContent.imageUploading : currentContent.imagePlaceholder}
                 </button>
                {imagePreview && (
                  <div className="relative w-16 h-16 rounded-md overflow-hidden">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-0 right-0 bg-red-500/20 text-white rounded-full p-1 hover:bg-red-500/30"
                      title={currentContent.imageRemove}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 提交按钮 */}
            <div className="flex justify-center pt-4">
              <button
                type="submit"
                disabled={!feedback.trim() || isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    {currentContent.submittingButton}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {currentContent.submitButton}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Edit2, Save, X, Eye, FileText } from "lucide-react"
import { useLanguage } from "@/lib/lang-context"

interface JournalEditorProps {
  initialContent: string
  onSave: (content: string) => void
  isViewOnly?: boolean
  placeholder?: string
}

export default function JournalEditor({ initialContent, onSave, isViewOnly = false, placeholder }: JournalEditorProps) {
  const { t } = useLanguage()
  const [content, setContent] = useState(initialContent || "")
  const [isEditing, setIsEditing] = useState(!initialContent)
  const [hasContent, setHasContent] = useState(!!initialContent)

  useEffect(() => {
    setContent(initialContent || "")
    setHasContent(!!initialContent)
    setIsEditing(!initialContent && !isViewOnly)
  }, [initialContent, isViewOnly])

  const handleSave = () => {
    if (content.trim()) {
      onSave(content)
      setIsEditing(false)
      setHasContent(true)
    }
  }

  const handleCancel = () => {
    setContent(initialContent || "")
    setIsEditing(false)
  }

  const startEditing = () => {
    if (!isViewOnly) {
      setIsEditing(true)
    }
  }

  if (isViewOnly) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-base font-medium text-white flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {t("journal.records")}
          </div>
        </div>
        {hasContent ? (
          <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
            <p className="text-sm whitespace-pre-wrap text-gray-200">{initialContent}</p>
          </div>
        ) : (
          <div className="text-center p-8 text-gray-400">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>{t("journal.no_records")}</p>
          </div>
        )}
      </div>
    )
  }

  if (!isEditing && hasContent) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-base font-medium text-white flex items-center gap-2">
            <Eye className="w-4 h-4" />
            {t("journal.content")}
            <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">{t("journal.readonly")}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={startEditing} className="text-blue-400 hover:text-blue-300">
            <Edit2 className="w-4 h-4 mr-1" />
            {t("journal.edit_again")}
          </Button>
        </div>
        <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
          <p className="text-sm whitespace-pre-wrap text-gray-200">{content}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-base font-medium text-white flex items-center gap-2">
          <Edit2 className="w-4 h-4" />
          {t("journal.edit")}
          <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded">{t("journal.editing")}</span>
        </div>
        {hasContent && (
          <Button variant="ghost" size="sm" onClick={handleCancel} className="text-gray-400 hover:text-gray-300">
            <X className="w-4 h-4 mr-1" />
            {t("journal.cancel")}
          </Button>
        )}
      </div>
      <div className="border-2 border-blue-400/50 rounded-lg p-1 focus-within:border-blue-400 transition-colors bg-gray-800/30">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder || t("journal.placeholder")}
          className="min-h-[120px] border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-white placeholder:text-gray-400"
          rows={5}
        />
      </div>
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!content.trim()}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
        >
          <Save className="w-4 h-4 mr-1" />
          {t("journal.save")}
        </Button>
      </div>
      <p className="text-xs text-gray-400 text-right">{content.length}/500</p>
    </div>
  )
} 
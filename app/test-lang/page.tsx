import { useLanguage } from '@/lib/lang-context'

export default function TestLang() {
  const { t } = useLanguage()
  return <div>{t("profile.title")}</div>
} 
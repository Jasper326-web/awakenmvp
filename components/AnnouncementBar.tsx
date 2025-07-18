import { useLanguage } from '@/lib/lang-context';

export default function AnnouncementBar() {
  const { t, language } = useLanguage();
  const text = t('announcement.motd');
  // 动态设置动画时长，英文内容更长则延长动画时长
  const duration = language === 'en' ? '50s' : '30s';
  return (
    <div className="w-full bg-gradient-to-r from-[#FF7E5F] via-[#FEB47B] to-[#FF9966] h-10 flex items-center overflow-hidden relative">
      <div className="whitespace-nowrap animate-scroll text-sm font-semibold text-white drop-shadow" style={{animation: `scroll ${duration} linear infinite`}}>
        {text}
      </div>
      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-scroll {
          will-change: transform;
        }
      `}</style>
    </div>
  );
} 
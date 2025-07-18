import { useLanguage } from '@/lib/lang-context';

export default function AnnouncementBar() {
  const { t } = useLanguage();
  const text = t('announcement.motd');
  return (
    <div className="w-full bg-gradient-to-r from-[#FF7E5F] via-[#FEB47B] to-[#FF9966] h-10 flex items-center overflow-hidden relative">
      <div className="whitespace-nowrap animate-scroll text-sm font-semibold text-white drop-shadow" style={{animation: 'scroll 30s linear infinite'}}>
        {text}
      </div>
      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
      `}</style>
    </div>
  );
} 
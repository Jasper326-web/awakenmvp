import Community from "@/components/community"
import { CoralButton } from '@/components/ui/button';
import { CoralSeparator } from '@/components/ui/separator';

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gradient-coral mb-2">会员专属社群</h1>
        <CoralButton>发帖</CoralButton>
        <CoralSeparator />
        <Community />
      </div>
    </div>
  )
}

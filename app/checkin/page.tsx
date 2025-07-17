import DailyCheckin from "@/components/daily-checkin"

export default function CheckinPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <DailyCheckin />
      </div>
    </div>
  )
}

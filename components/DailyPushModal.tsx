"use client"
import { useEffect, useState } from "react";
// 假设 useUser 已实现
import { useUser } from "@/hooks/useUser";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DailyPushModal() {
  const { isPremium } = useUser();
  const [push, setPush] = useState<any>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isPremium) return;
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem("push_shown_" + today)) return;
    fetch(`/api/daily-push?date=${today}`)
      .then(res => res.json())
      .then(data => {
        setPush(data);
        setOpen(true);
        localStorage.setItem("push_shown_" + today, "1");
      });
  }, [isPremium]);

  if (!push) return null;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>今日专属推送</DialogTitle>
        </DialogHeader>
        <div className="p-6">
          <div className="text-sm text-muted-foreground">{push.content}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
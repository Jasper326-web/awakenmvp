"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

// 简单的内存缓存
const subscriptionCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30秒缓存

export function useUser() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      const currentUser = data?.user ?? null;
      setUser(currentUser);
      
      // 如果用户已登录，检查会员状态
      if (currentUser) {
        // 检查缓存
        const cached = subscriptionCache.get(currentUser.id);
        const now = Date.now();
        
        if (cached && (now - cached.timestamp) < CACHE_DURATION) {
          console.log("[useUser] 使用缓存的订阅数据");
          setIsPremium(!!cached.data);
        } else {
          try {
            console.log("[useUser] 获取新的订阅数据");
            const response = await fetch("/api/user-subscription", {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            })
            if (response.ok) {
              const result = await response.json()
              setIsPremium(!!result.data)
              // 更新缓存
              subscriptionCache.set(currentUser.id, {
                data: result.data,
                timestamp: now
              });
            } else if (response.status === 406) {
              setIsPremium(false)
            } else {
              setIsPremium(false)
            }
          } catch (error) {
            setIsPremium(false);
          }
        }
      } else {
        setIsPremium(false);
      }
      
      setLoading(false);
    };
    getUser();

    // 监听 auth 状态变化，但只在用户ID变化时重新获取
    const { data: listener } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      const newUserId = session?.user?.id;
      if (newUserId !== lastUserId.current) {
        lastUserId.current = newUserId;
        getUser();
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return { user, loading, isPremium };
} 
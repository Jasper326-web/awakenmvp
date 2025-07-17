"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useUser() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      setUser(data?.user ?? null);
      
      // 如果用户已登录，检查会员状态
      if (data?.user) {
        try {
          const { data: subscriptionData } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', data.user.id)
            .eq('status', 'active')
            .single();
          
          setIsPremium(!!subscriptionData);
        } catch (error) {
          setIsPremium(false);
        }
      } else {
        setIsPremium(false);
      }
      
      setLoading(false);
    };
    getUser();

    // 监听 auth 状态变化
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      getUser();
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return { user, loading, isPremium };
} 
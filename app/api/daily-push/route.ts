import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().slice(0, 10);

    // 从 daily_pushes 表获取指定日期的推送内容
    const { data, error } = await supabase
      .from('daily_pushes')
      .select('*')
      .eq('push_date', date)
      .single();

    if (error) {
      console.error('Error fetching daily push:', error);
      return NextResponse.json({ error: 'Failed to fetch daily push' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'No push content for this date' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Daily push API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
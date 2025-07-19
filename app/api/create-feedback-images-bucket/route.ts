import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST() {
  try {
    // 创建存储桶
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('feedback-images', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    })

    if (bucketError) {
      console.error('创建存储桶失败:', bucketError)
      return NextResponse.json({ error: '创建存储桶失败' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: '反馈图片存储桶创建成功',
      bucket: bucketData 
    })
  } catch (error) {
    console.error('创建存储桶时出错:', error)
    return NextResponse.json({ error: '创建存储桶时出错' }, { status: 500 })
  }
} 
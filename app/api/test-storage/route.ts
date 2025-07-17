import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

export async function GET() {
  try {
    console.log("开始测试存储桶配置...")
    
    // 1. 检查存储桶列表
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error("获取存储桶列表失败:", listError)
      return NextResponse.json({ 
        error: "获取存储桶列表失败", 
        details: listError.message 
      }, { status: 500 })
    }
    
    console.log("现有存储桶:", buckets.map((b: any) => b.name))
    
    // 2. 检查avatars存储桶是否存在
    const avatarsBucket = buckets.find((bucket: any) => bucket.name === "avatars")
    
    if (!avatarsBucket) {
      console.log("avatars存储桶不存在，尝试创建...")
      
      const { data: createData, error: createError } = await supabase.storage.createBucket("avatars", {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ["image/png", "image/jpeg", "image/gif"],
      })
      
      if (createError) {
        console.error("创建avatars存储桶失败:", createError)
        return NextResponse.json({ 
          error: "创建存储桶失败", 
          details: createError.message 
        }, { status: 500 })
      }
      
      console.log("avatars存储桶创建成功")
      return NextResponse.json({ 
        message: "avatars存储桶已创建",
        bucket: createData
      })
    }
    
    console.log("avatars存储桶已存在")
    
    // 3. 测试上传权限（模拟）
    const testFileName = `test-${Date.now()}.txt`
    const testContent = "这是一个测试文件"
    
    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(testFileName, new Blob([testContent]), {
          contentType: 'text/plain'
        })
      
      if (uploadError) {
        console.error("测试上传失败:", uploadError)
        return NextResponse.json({ 
          error: "存储桶权限测试失败", 
          details: uploadError.message 
        }, { status: 500 })
      }
      
      // 删除测试文件
      await supabase.storage.from('avatars').remove([testFileName])
      
      console.log("存储桶权限测试成功")
      
      return NextResponse.json({ 
        message: "存储桶配置正常",
        bucket: avatarsBucket,
        test: "权限测试通过"
      })
      
    } catch (error) {
      console.error("测试过程中出错:", error)
      return NextResponse.json({ 
        error: "测试过程中出错", 
        details: String(error) 
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error("测试存储桶时出错:", error)
    return NextResponse.json({ 
      error: "服务器错误", 
      details: String(error) 
    }, { status: 500 })
  }
}

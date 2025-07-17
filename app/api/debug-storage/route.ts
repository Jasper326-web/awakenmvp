import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

export async function GET() {
  try {
    console.log("开始调试存储桶状态...")
    
    // 1. 检查当前用户
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error("获取用户失败:", userError)
      return NextResponse.json({ 
        error: "获取用户失败", 
        details: userError.message 
      }, { status: 401 })
    }
    
    console.log("当前用户:", user?.id)
    
    // 2. 检查存储桶列表
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error("获取存储桶列表失败:", listError)
      return NextResponse.json({ 
        error: "获取存储桶列表失败", 
        details: listError.message 
      }, { status: 500 })
    }
    
    console.log("存储桶列表:", buckets)
    
    // 3. 检查avatars存储桶
    const avatarsBucket = buckets.find((b: any) => b.name === "avatars")
    
    if (!avatarsBucket) {
      console.log("avatars存储桶不存在")
      return NextResponse.json({ 
        error: "avatars存储桶不存在",
        buckets: buckets.map((b: any) => b.name)
      }, { status: 404 })
    }
    
    console.log("avatars存储桶存在:", avatarsBucket)
    
    // 4. 检查存储桶中的文件
    const { data: files, error: filesError } = await supabase.storage
      .from('avatars')
      .list('', { limit: 10 })
    
    if (filesError) {
      console.error("获取文件列表失败:", filesError)
      return NextResponse.json({ 
        error: "获取文件列表失败", 
        details: filesError.message 
      }, { status: 500 })
    }
    
    console.log("avatars存储桶中的文件:", files)
    
    // 5. 测试上传权限
    const testFileName = `test-${Date.now()}.txt`
    const testContent = "测试文件内容"
    
    console.log("测试上传文件:", testFileName)
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(testFileName, new Blob([testContent]), {
        contentType: 'text/plain'
      })
    
    if (uploadError) {
      console.error("测试上传失败:", uploadError)
      return NextResponse.json({ 
        error: "测试上传失败", 
        details: uploadError.message,
        user: user?.id,
        bucket: avatarsBucket,
        files: files
      }, { status: 500 })
    }
    
    console.log("测试上传成功")
    
    // 6. 删除测试文件
    const { error: deleteError } = await supabase.storage
      .from('avatars')
      .remove([testFileName])
    
    if (deleteError) {
      console.error("删除测试文件失败:", deleteError)
    } else {
      console.log("测试文件删除成功")
    }
    
    return NextResponse.json({ 
      success: true,
      message: "存储桶配置正常",
      user: user?.id,
      bucket: avatarsBucket,
      files: files,
      test: "上传测试通过"
    })
    
  } catch (error) {
    console.error("调试过程中出错:", error)
    return NextResponse.json({ 
      error: "调试过程中出错", 
      details: String(error) 
    }, { status: 500 })
  }
} 
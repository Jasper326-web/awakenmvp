import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

export async function GET() {
  try {
    // 检查avatars存储桶是否存在
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error("获取存储桶列表失败:", listError)
      return NextResponse.json({ error: "获取存储桶列表失败" }, { status: 500 })
    }

    const avatarsBucketExists = buckets.some((bucket) => bucket.name === "avatars")

    if (!avatarsBucketExists) {
      // 创建avatars存储桶
      const { data, error } = await supabase.storage.createBucket("avatars", {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ["image/png", "image/jpeg", "image/gif"],
      })

      if (error) {
        console.error("创建avatars存储桶失败:", error)
        return NextResponse.json({ error: "创建存储桶失败" }, { status: 500 })
      }

      return NextResponse.json({ message: "avatars存储桶已创建", data })
    }

    return NextResponse.json({ message: "avatars存储桶已存在" })
  } catch (error) {
    console.error("处理请求时出错:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}

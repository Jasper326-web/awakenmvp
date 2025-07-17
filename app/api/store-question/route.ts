import { supabase } from "@/lib/supabaseClient"

export async function POST(request: Request) {
  try {
    const { question, answer, category } = await request.json()

    if (!question || !answer || !category) {
      return new Response("Missing question, answer, or category", { status: 400 })
    }

    const { data, error } = await supabase.from("questions").insert([{ question, answer, category }]).select()

    if (error) {
      console.error("Error inserting data:", error)
      return new Response("Failed to store question", { status: 500 })
    }

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Server error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}

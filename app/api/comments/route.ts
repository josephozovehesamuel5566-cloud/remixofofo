import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const articleId = searchParams.get("articleId");

    if (!articleId) {
      return NextResponse.json({ error: "Missing articleId" }, { status: 400 });
    }

    const commentsList = await db.getComments(articleId, false); // Fetch comment logs
    return NextResponse.json(commentsList);
  } catch (error) {
    console.error("Comments fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

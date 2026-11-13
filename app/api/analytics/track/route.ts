import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/firebase";
import { collection, query, where, getDocs, addDoc, limit } from "firebase/firestore";

export async function POST(req: NextRequest) {
  try {
    const { slug } = await req.json();
    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "slug required" }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const toolUsageRef = collection(db, "tool_usage");

    const recentQuery = query(
      toolUsageRef,
      where("tool_slug", "==", slug),
      where("user_ip", "==", ip),
      where("created_at", ">=", fiveMinAgo),
      limit(1)
    );

    const snapshot = await getDocs(recentQuery);
    if (!snapshot.empty) {
      return NextResponse.json({ ok: true, deduped: true });
    }

    await addDoc(toolUsageRef, {
      tool_slug: slug,
      user_ip: ip,
      user_agent: userAgent,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Track failed:", error);
    return NextResponse.json({ error: "track failed" }, { status: 500 });
  }
}

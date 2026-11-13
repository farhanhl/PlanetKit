import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const password = req.headers.get("x-analytics-password");
  if (password !== process.env.ANALYTICS_PASSWORD) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const toolUsageRef = collection(db, "tool_usage");
    const snapshot = await getDocs(toolUsageRef);

    const bySlug = new Map<string, { total: number; uniqueIps: Set<string>; lastUsed: string }>();
    snapshot.forEach((doc) => {
      const row = doc.data();
      const toolSlug = row.tool_slug;
      const userIp = row.user_ip || "unknown";
      const createdAt = row.created_at || new Date().toISOString();

      if (!toolSlug || typeof toolSlug !== "string") return;

      const existing = bySlug.get(toolSlug);
      if (existing) {
        existing.total++;
        existing.uniqueIps.add(userIp);
        if (createdAt > existing.lastUsed) existing.lastUsed = createdAt;
      } else {
        bySlug.set(toolSlug, {
          total: 1,
          uniqueIps: new Set([userIp]),
          lastUsed: createdAt,
        });
      }
    });

    const stats = Array.from(bySlug.entries())
      .map(([slug, data]) => ({
        slug,
        totalVisits: data.total,
        uniqueVisitors: data.uniqueIps.size,
        lastUsed: data.lastUsed,
      }))
      .sort((a, b) => b.totalVisits - a.totalVisits);

    const totalVisits = stats.reduce((sum, s) => sum + s.totalVisits, 0);

    return NextResponse.json({ stats, totalVisits });
  } catch (error) {
    console.error("Fetch analytics stats failed:", error);
    return NextResponse.json({ error: "stats failed" }, { status: 500 });
  }
}

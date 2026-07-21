import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

export async function GET(req: NextRequest) {
  const password = req.headers.get("x-analytics-password");
  if (password !== process.env.ANALYTICS_PASSWORD) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { data: rows, error } = await supabase
      .from("tool_usage")
      .select("tool_slug, user_ip, created_at");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const bySlug = new Map<string, { total: number; uniqueIps: Set<string>; lastUsed: string }>();
    for (const row of rows || []) {
      const existing = bySlug.get(row.tool_slug);
      if (existing) {
        existing.total++;
        existing.uniqueIps.add(row.user_ip);
        if (row.created_at > existing.lastUsed) existing.lastUsed = row.created_at;
      } else {
        bySlug.set(row.tool_slug, {
          total: 1,
          uniqueIps: new Set([row.user_ip]),
          lastUsed: row.created_at,
        });
      }
    }

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
  } catch {
    return NextResponse.json({ error: "stats failed" }, { status: 500 });
  }
}
